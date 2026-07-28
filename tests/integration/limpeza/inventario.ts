/**
 * INVENTÁRIO E LIMPEZA — o que a suíte criou, ela devolve.
 *
 * Por que existe: uma execução completa da integração deixava 54 contas, 31
 * Cases, 43 histórias e — o pior — 6 profissionais publicados na Rede
 * operacional local. Sete execuções acumuladas viraram 438 contas e 256
 * Cases, e a Mesa de qualquer sessão humana passava a enxergar uma Rede que
 * ninguém cadastrou.
 *
 * A propriedade é explícita e temporal: tudo que passou a existir entre o
 * `snapshot()` e o `limpar()` pertence àquela janela. Como os arquivos da
 * suíte rodam em série (`fileParallelism: false`), a janela de um arquivo
 * nunca se sobrepõe à de outro — a propriedade é inequívoca, não uma
 * heurística de nome.
 *
 * O que nunca faz: apagar as seis contas permanentes de bootstrap, nem nada
 * que já existia quando a janela abriu. Não existe `delete` sem conjunto de
 * ids conhecido.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/** As seis contas que a suíte precisa encontrar prontas. Nunca são removidas. */
export const CONTAS_PERMANENTES = [
  "admin.teste@aliviar-conexao.local",
  "profissional.teste@aliviar-conexao.local",
  "paciente.teste@aliviar-conexao.local",
  "curador.teste@aliviar-conexao.local",
  "atendente.teste@aliviar-conexao.local",
  "concierge.teste@aliviar-conexao.local",
];

export type Inventario = {
  usuarios: string[];
  /** Papéis concedidos, como "profile_id:role_id" — a chave de `user_roles` é composta. */
  papeis: string[];
  perfis: string[];
  casos: string[];
  profissionais: string[];
  historias: string[];
};

export type Contagens = {
  usuarios: number;
  perfis: number;
  casos: number;
  profissionais: number;
  historias: number;
  redeOperacionalPublicada: number;
  papeis: number;
  declaracoesCriterio: number;
  pesos: number;
  selecoes: number;
  relatorios: number;
  conexoes: number;
  relacionamentos: number;
};

async function todosOsIds(admin: SupabaseClient, tabela: string, coluna = "id"): Promise<string[]> {
  const ids: string[] = [];
  const passo = 1000;
  for (let inicio = 0; ; inicio += passo) {
    const { data, error } = await admin
      .from(tabela)
      .select(coluna)
      .range(inicio, inicio + passo - 1);
    if (error) throw new Error(`${tabela}: ${error.message}`);
    const pagina = (data ?? []) as unknown as Record<string, string>[];
    ids.push(...pagina.map((linha) => linha[coluna]!));
    if (pagina.length < passo) break;
  }
  return ids;
}

async function idsDeUsuarios(admin: SupabaseClient): Promise<string[]> {
  const ids: string[] = [];
  for (let pagina = 1; ; pagina += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page: pagina, perPage: 1000 });
    if (error) throw new Error(`auth.users: ${error.message}`);
    ids.push(...data.users.map((usuario) => usuario.id));
    if (data.users.length < 1000) break;
  }
  return ids;
}

/**
 * O administrador permanente de bootstrap — o executor do descarte.
 *
 * `service_role` é transporte: a função da ADR-038 exige um executor com
 * papel `administrador` e verifica isso por conta própria. A limpeza usa o
 * mesmo caminho que uma pessoa usaria, não um atalho técnico.
 */
async function idDoAdministrador(admin: SupabaseClient): Promise<string> {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(`limpeza: não foi possível localizar o administrador — ${error.message}`);
  const conta = (data?.users ?? []).find(
    (usuario) => usuario.email === "admin.teste@aliviar-conexao.local",
  );
  if (!conta) {
    throw new Error("limpeza: conta de administrador de bootstrap não encontrada. Rode `npm run bootstrap:test-users`.");
  }
  return conta.id;
}

export async function snapshot(admin: SupabaseClient): Promise<Inventario> {
  const [usuarios, perfis, casos, profissionais, historias, papeis] = await Promise.all([
    idsDeUsuarios(admin),
    todosOsIds(admin, "profiles"),
    todosOsIds(admin, "cases"),
    todosOsIds(admin, "professional_profiles"),
    todosOsIds(admin, "patient_stories"),
    paresDePapel(admin),
  ]);
  return { usuarios, perfis, casos, profissionais, historias, papeis };
}

/**
 * Um papel concedido a uma conta PERMANENTE durante a suíte não some com
 * nenhuma conta — foi assim que `Concierge Teste` ficou com `curador_medico`
 * depois de um teste de concessão e revogação. Por isso o par entra no
 * inventário.
 */
async function paresDePapel(admin: SupabaseClient): Promise<string[]> {
  const { data, error } = await admin.from("user_roles").select("profile_id, role_id");
  if (error) throw new Error(`user_roles: ${error.message}`);
  return (data ?? []).map((linha) => `${linha.profile_id}:${linha.role_id}`);
}

async function contar(admin: SupabaseClient, tabela: string, filtro?: (q: never) => never) {
  let consulta = admin.from(tabela).select("*", { count: "exact", head: true });
  if (filtro) consulta = (filtro as unknown as (q: unknown) => typeof consulta)(consulta as never);
  const { count, error } = await consulta;
  if (error) throw new Error(`${tabela}: ${error.message}`);
  return count ?? 0;
}

export async function contagens(admin: SupabaseClient): Promise<Contagens> {
  const usuarios = (await idsDeUsuarios(admin)).length;

  const rede = await admin
    .from("professional_profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_demo", false)
    .eq("is_test_fixture", false)
    .eq("publication_status", "publicado");
  if (rede.error) throw new Error(`rede operacional: ${rede.error.message}`);

  return {
    usuarios,
    perfis: await contar(admin, "profiles"),
    casos: await contar(admin, "cases"),
    profissionais: await contar(admin, "professional_profiles"),
    historias: await contar(admin, "patient_stories"),
    redeOperacionalPublicada: rede.count ?? 0,
    papeis: await contar(admin, "user_roles"),
    declaracoesCriterio: await contar(admin, "criterion_declarations"),
    pesos: await contar(admin, "cruzamento_weights"),
    selecoes: await contar(admin, "curated_selections"),
    relatorios: await contar(admin, "curadoria_reports"),
    conexoes: await contar(admin, "connection_records"),
    relacionamentos: await contar(admin, "relationship_records"),
  };
}

/** O que existe agora e não existia no snapshot. */
export async function residuo(admin: SupabaseClient, antes: Inventario): Promise<Inventario> {
  const agora = await snapshot(admin);
  const novo = (depois: string[], base: string[]) => {
    const conhecidos = new Set(base);
    return depois.filter((id) => !conhecidos.has(id));
  };
  return {
    usuarios: novo(agora.usuarios, antes.usuarios),
    perfis: novo(agora.perfis, antes.perfis),
    casos: novo(agora.casos, antes.casos),
    profissionais: novo(agora.profissionais, antes.profissionais),
    historias: novo(agora.historias, antes.historias),
    papeis: novo(agora.papeis, antes.papeis),
  };
}

export function vazio(inventario: Inventario): boolean {
  return (
    inventario.usuarios.length === 0 &&
    inventario.perfis.length === 0 &&
    inventario.casos.length === 0 &&
    inventario.profissionais.length === 0 &&
    inventario.historias.length === 0
  );
}

/**
 * Remove a cadeia inteira do que nasceu na janela — na ordem que as chaves
 * estrangeiras exigem.
 *
 * A ordem não é estética. `cases.patient_profile_id` cascateia, mas
 * `cases.created_by`, `patient_stories.created_by` e
 * `professional_profiles.created_by` são `NO ACTION`: apagar o perfil antes
 * do que ele criou falha. Por isso Case primeiro, profissional depois,
 * história em seguida e conta por último.
 */
export async function limpar(admin: SupabaseClient, antes: Inventario): Promise<Inventario> {
  const criado = await residuo(admin, antes);

  const emLotes = async (ids: string[], acao: (lote: string[]) => Promise<void>) => {
    for (let i = 0; i < ids.length; i += 100) {
      await acao(ids.slice(i, i + 100));
    }
  };

  // 1. Referências NO ACTION a profissionais que vivem sob Cases da janela —
  //    sairiam por cascata do Case, mas um Case herdado da baseline pode
  //    apontar para um profissional novo.
  await emLotes(criado.profissionais, async (lote) => {
    for (const tabela of [
      "connection_records",
      "relationship_records",
      "curated_selection_options",
      "curadoria_report_options",
    ]) {
      await admin.from(tabela).delete().in("professional_profile_id", lote);
    }
  });

  // 2. Cases — cascateiam por quase toda a cadeia da Curadoria.
  //
  //    Case com troca de responsável não sai pelo DELETE comum: o gatilho
  //    append-only recusa a cascata. Para esses — e só para esses — a limpeza
  //    usa a porta da ADR-038, com motivo declarado e auditoria gravada, do
  //    mesmo jeito que um administrador usaria em produção. Nenhum caminho
  //    paralelo, nenhuma exceção de ambiente.
  const administrador = await idDoAdministrador(admin);

  for (const id of criado.casos) {
    await admin.from("connection_records").delete().eq("case_id", id);
    await admin.from("relationship_records").delete().eq("case_id", id);

    const { error } = await admin.from("cases").delete().eq("id", id);
    if (!error) continue;

    if (/append-only|descarte administrativo autorizado/i.test(error.message)) {
      const { error: erroDescarte } = await admin.rpc("discard_case_admin", {
        _case_id: id,
        _reason: "Descarte de Case sintético ao final da suíte de integração local.",
        _executed_by: administrador,
      });
      if (erroDescarte) {
        throw new Error(`limpeza: descarte do Case ${id} falhou — ${erroDescarte.message}`);
      }
      continue;
    }

    throw new Error(`limpeza de cases: ${error.message}`);
  }

  // 3. Profissionais — cascateiam para áreas, formação, divergências e afins.
  await emLotes(criado.profissionais, async (lote) => {
    const { error } = await admin.from("professional_profiles").delete().in("id", lote);
    if (error) throw new Error(`limpeza de profissionais: ${error.message}`);
  });

  // 4. Histórias que não saíram por cascata do perfil.
  await emLotes(criado.historias, async (lote) => {
    await admin.from("patient_stories").delete().in("id", lote);
  });

  // 5. Tudo que aponta para os perfis da janela com `ON DELETE NO ACTION` e
  //    NÃO sai por cascata de Case nem de profissional. Sem esta passagem, o
  //    `deleteUser` falha em silêncio e a conta sobrevive — foi assim que 53
  //    contas escaparam da primeira versão desta limpeza.
  //
  //    A lista veio de `pg_constraint`: são as referências a `profiles` que
  //    vivem fora das duas cascatas grandes.
  const DEPENDENTES_DE_PERFIL: [string, string][] = [
    ["crm_tasks", "assigned_to"],
    ["crm_tasks", "created_by"],
    ["crm_appointments", "assigned_to"],
    ["crm_appointments", "created_by"],
    ["crm_interactions", "created_by"],
    ["crm_contacts", "patient_profile_id"],
    ["crm_contacts", "converted_by"],
    ["crm_contacts", "qualified_by"],
    ["crm_audit_log", "actor_id"],
    ["connection_events", "actor_id"],
    ["relationship_events", "actor_id"],
    ["patient_story_versions", "created_by"],
    ["patient_stories", "created_by"],
    ["patient_documents", "uploaded_by"],
    ["verification_divergences", "opened_by"],
    ["verification_divergences", "resolved_by"],
    ["professional_practice_areas", "verified_by"],
    ["professional_education_entries", "verified_by"],
    ["professional_career_entries", "verified_by"],
    ["professional_experience", "verified_by"],
    ["professional_care_model", "verified_by"],
    ["professional_communication", "verified_by"],
    ["professional_documents", "uploaded_by"],
    // Auditoria: `actor_id` é SET NULL, então a linha sobreviveria apontando
    // para ninguém. Auditoria não é desligada em lugar nenhum — só o rastro
    // das entidades temporárias sai junto com elas.
    ["audit_logs", "actor_id"],
    ["audit_logs", "target_profile_id"],
  ];

  await emLotes(criado.perfis, async (lote) => {
    // OS PAPÉIS SAEM PRIMEIRO — e a ordem aqui não é preferência.
    //
    // `auth.users` → `profiles` → `user_roles` cascateiam, e `user_roles` tem
    // o gatilho `log_user_roles_delete`, que INSERE em `audit_logs` com
    // `target_profile_id = old.profile_id`. No meio da cascata o perfil já
    // não existe mais, e o insert de auditoria viola a própria FK:
    //
    //   ERROR: insert or update on table "audit_logs" violates foreign key
    //   constraint "audit_logs_target_profile_id_fkey"
    //
    // A conta então NUNCA é removida — e a Admin API devolve um 500 vazio,
    // que os teardowns antigos engoliam. Era esta a origem real do resíduo.
    //
    // Revogando o papel antes, o gatilho dispara com o perfil ainda de pé, a
    // auditoria é gravada corretamente, e a cascata depois não tem mais nada
    // que a acione. A auditoria não é desligada em lugar nenhum.
    await admin.from("user_roles").delete().in("profile_id", lote);

    for (const [tabela, coluna] of DEPENDENTES_DE_PERFIL) {
      // O registro de descarte da ADR-038 é o rastro que sobrevive ao Case,
      // de propósito. Ele aponta para o paciente como alvo — e sem esta
      // ressalva a própria limpeza apagaria a prova do que apagou.
      const consulta = admin.from(tabela).delete().in(coluna, lote);
      await (tabela === "audit_logs" ? consulta.neq("action", "case_discarded") : consulta);
    }
  });

  // Papéis concedidos durante a janela a contas que NÃO nasceram nela — o
  // caso de um teste que concede e revoga e deixa um a mais. Sem isto, o
  // papel sobrevive indefinidamente numa conta permanente.
  for (const par of criado.papeis) {
    const [profileId, roleId] = par.split(":");
    await admin.from("user_roles").delete().eq("profile_id", profileId).eq("role_id", roleId);
  }

  // Profissionais que um perfil da janela criou/atualizou/verificou, mas que
  // já existiam antes dela: soltar o vínculo em vez de apagar o profissional
  // alheio.
  await emLotes(criado.perfis, async (lote) => {
    for (const coluna of ["created_by", "updated_by", "registration_verified_by"]) {
      await admin.from("professional_profiles").update({ [coluna]: null }).in(coluna, lote);
    }
  });

  // 6. Contas — cascateiam para perfil, papéis, preferências, notificações.
  const permanentes = new Set<string>();
  for (let pagina = 1; ; pagina += 1) {
    const { data } = await admin.auth.admin.listUsers({ page: pagina, perPage: 1000 });
    for (const usuario of data?.users ?? []) {
      if (usuario.email && CONTAS_PERMANENTES.includes(usuario.email)) permanentes.add(usuario.id);
    }
    if ((data?.users.length ?? 0) < 1000) break;
  }

  // Falha silenciosa aqui foi a origem do vazamento — a conta sobrevivia e
  // ninguém ficava sabendo. Agora ela é reportada, com o motivo.
  const naoRemovidos: string[] = [];
  for (const id of criado.usuarios) {
    if (permanentes.has(id)) continue;
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) naoRemovidos.push(`${id}: ${error.message}`);
  }
  if (naoRemovidos.length > 0) {
    throw new Error(
      `limpeza: ${naoRemovidos.length} conta(s) não removida(s) —\n${naoRemovidos.join("\n")}`,
    );
  }

  // 7. Perfis sem conta (criados direto na tabela, sem passar pelo Auth).
  await emLotes(
    criado.perfis.filter(
      (id) => !criado.usuarios.includes(id) && !permanentes.has(id),
    ),
    async (lote) => {
      await admin.from("profiles").delete().in("id", lote);
    },
  );

  return criado;
}
