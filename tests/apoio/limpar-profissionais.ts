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
    // Não silencia: um profissional que não saiu continua poluindo o pool, e
    // o próximo spec pagaria a conta sem saber de onde veio.
    throw new Error(`Falha ao remover profissionais "${prefixo}": ${error.message}`);
  }
  return ids.length;
}
