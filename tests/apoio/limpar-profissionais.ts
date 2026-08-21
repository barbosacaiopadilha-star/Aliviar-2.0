import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * REMOVE OS PROFISSIONAIS QUE UM SPEC CRIOU PELA INTERFACE.
 *
 * `professional_profiles` é um recurso GLOBAL da stack local — nunca escopado
 * por Caso. Um spec que cria profissional e não o remove aumenta o pool para
 * todos os outros, e a Shortlist de quem vem depois vira
 * `AMBIGUOUS_COMPOSITION` em vez de `COMPOSED`. O efeito não é uma falha fixa:
 * é um teste diferente falhando a cada execução, conforme a ordem — o tipo de
 * vermelho que ninguém consegue diagnosticar e todo mundo aprende a ignorar.
 *
 * As fixtures montadas por código já limpam (`cleanupFixture`). Quem cria pela
 * TELA não tinha por onde: é o que esta função resolve.
 *
 * A ordem das exclusões é a mesma de `cleanupFixture`, e pelo mesmo motivo: o
 * que aponta para o profissional sai antes dele, senão o DELETE falha por FK.
 */
export async function removerProfissionaisPorPrefixo(prefixo: string): Promise<number> {
  const admin = createAdminSupabaseClient();

  const { data: alvos, error: erroBusca } = await admin
    .from("professional_profiles")
    .select("id")
    .like("professional_identifier", `${prefixo}%`);

  if (erroBusca) throw new Error(`Busca de profissionais "${prefixo}": ${erroBusca.message}`);
  const ids = (alvos ?? []).map((linha) => linha.id as string);
  if (ids.length === 0) return 0;

  // Tabelas-satélite primeiro. Falha aqui é ignorada de propósito: nem toda
  // stack tem linha em todas elas, e o que importa é o perfil sair.
  for (const tabela of [
    "professional_competency_areas",
    "professional_practice_areas",
    "professional_subcriterion_map",
    "practice_evidence",
    "professional_education_entries",
    "professional_documents",
  ]) {
    await admin.from(tabela).delete().in("professional_profile_id", ids);
  }

  const { error } = await admin.from("professional_profiles").delete().in("id", ids);
  if (error) {
    /**
     * QUEM PARTICIPOU DE UMA CURADORIA NÃO SE APAGA — RETIRA-SE DA REDE.
     *
     * O banco recusa a exclusão de profissional com histórico operacional, e a
     * frase dele já diz o caminho: "Retire da rede — o histórico permanece."
     * A regra está certa: `connection_records`, `curated_selection_options` e
     * `curadoria_report_options` são a memória de Curadorias reais, e apagá-las
     * para limpar um teste seria destruir o registro que o Método existe para
     * guardar.
     *
     * Enquanto esta limpeza só sabia excluir, ela QUEBRAVA no fim da jornada
     * ponta a ponta — e, pior, deixava os profissionais no pool elegível. Foi
     * assim que a Base de Evidências acumulou dezenas de "E2E run-…" de
     * execuções antigas, cada um pesando na Shortlist dos outros specs.
     *
     * A retirada usa a MESMA transição de ciclo que a interface usa, com motivo
     * declarado — nada de `update` cru por fora do domínio.
     */
    // O ATOR É UMA PESSOA, nunca o próprio profissional: a transição recusa
    // com "actor_id não corresponde a nenhum perfil conhecido", e está certa —
    // toda mudança de ciclo carrega quem a fez. Aqui é um administrador, que é
    // quem faria isso na operação real.
    const { data: papel } = await admin.from("roles").select("id").eq("slug", "administrador").single();
    const { data: atores } = await admin
      .from("user_roles")
      .select("profile_id")
      .eq("role_id", papel?.id ?? "")
      .limit(1);
    const ator = atores?.[0]?.profile_id as string | undefined;

    const falhas: string[] = [];
    for (const id of ids) {
      if (!ator) {
        falhas.push(`${id}: nenhum administrador encontrado para assinar a retirada`);
        continue;
      }
      const { error: erroRetirada } = await admin.rpc("transicionar_ciclo_como_servico", {
        p_profissional: id,
        p_para: "RETIRADO_ARQUIVADO",
        p_motivo: "ENCERRAMENTO_DA_ATUACAO",
        p_ator: ator,
        p_nota: "Retirado pela limpeza da suíte E2E — o histórico da Curadoria permanece.",
      });
      // Já retirado não é falha: a limpeza é idempotente, e o que importa é o
      // profissional estar fora do pool elegível ao fim.
      if (erroRetirada && !/RETIRADO_ARQUIVADO/.test(erroRetirada.message)) {
        falhas.push(`${id}: ${erroRetirada.message}`);
      }
    }

    if (falhas.length === ids.length) {
      // Nenhum saiu, nem por exclusão nem por retirada: aí sim é problema, e o
      // próximo spec pagaria a conta sem saber de onde veio.
      throw new Error(
        `Falha ao remover profissionais "${prefixo}": ${error.message}\n` +
          `E a retirada da rede também falhou: ${falhas.join("; ")}`,
      );
    }
  }
  return ids.length;
}
