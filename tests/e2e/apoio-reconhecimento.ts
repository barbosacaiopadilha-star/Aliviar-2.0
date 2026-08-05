import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

import { PERSON_QUESTIONS_BY_CODE } from "@/modules/curadoria/protocolos";

/**
 * MR-02 — O CENÁRIO DO RECONHECIMENTO, DESCARTÁVEL E ISOLADO.
 *
 * A versão anterior do spec logava com a paciente PERMANENTE e consumia uma
 * tradução pendente pré-semeada. Consequência: a segunda execução encontrava
 * tudo já respondido e falhava, e cada rodada deixava resíduo no banco. Um
 * teste que só passa uma vez não é teste — é uma inspeção.
 *
 * Aqui cada execução cria a própria paciente, o próprio Case e as próprias
 * traduções, com identificadores que ninguém mais usa, e apaga exatamente o
 * que criou. Nada é reaproveitado entre execuções; nada de outra execução é
 * tocado.
 *
 * As opções vêm do Catálogo em tempo de fixture, não de uma lista colada aqui:
 * é o mesmo mapa que o MR-01 usa para traduzir, então o teste continua válido
 * quando o Catálogo mudar — e a asserção de rótulo continua sendo sobre dado
 * real, nunca sobre um literal que alguém esqueceu de atualizar.
 */

/** Os três conceitos do cenário — todos com pergunta à pessoa e opções. */
export const CONCEITOS_DO_CENARIO = [
  "MODELO_COMUNICACAO",
  "MODELO_ALTERNATIVAS",
  "MODELO_PARTICIPACAO_FAMILIAR",
] as const;

export type Cenario = {
  /** Identificador desta execução — some do banco no fim dela. */
  marca: string;
  email: string;
  password: string;
  patientProfileId: string;
  caseId: string;
  storyId: string;
  /** Por conceito: o código da opção e o rótulo que a tela deve exibir. */
  opcoes: { code: string; valor: string; rotulo: string; leitura: string }[];
};

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("MR-02: rode sob `scripts/with-local-supabase.mjs` — faltam as chaves locais.");
  }
  return createClient(url, key, { auth: { persistSession: false }, db: { schema: "curadoria" } });
}

/** A primeira opção ATIVA do conceito, direto do Catálogo. */
function primeiraOpcao(code: string): { valor: string; rotulo: string } {
  const opcoes = PERSON_QUESTIONS_BY_CODE.get(code)?.options ?? {};
  const [valor, rotulo] = Object.entries(opcoes)[0] ?? [];
  if (!valor || !rotulo) {
    throw new Error(`MR-02: o conceito ${code} não tem opção ativa no Catálogo.`);
  }
  return { valor, rotulo };
}

/**
 * Cria a paciente, o Case e as traduções pendentes desta execução.
 *
 * O Curador é o permanente e NÃO é criado nem apagado aqui: ele é referência,
 * não fixture. O que nasce nesta função é só o que morre em `limparCenario`.
 */
export async function criarCenario(): Promise<Cenario> {
  const service = admin();
  const marca = randomUUID().slice(0, 8);
  const email = `e2e-reconhecimento-${marca}@aliviar-conexao.local`;
  const password = `Senha-${marca}-Ok!`;

  const { data: criada, error: erroConta } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: `Paciente E2E ${marca}` },
  });
  if (erroConta || !criada?.user) {
    throw new Error(`MR-02 conta: ${erroConta?.message ?? "sem usuário"}`);
  }
  const patientProfileId = criada.user.id;

  const { data: papel } = await service.from("roles").select("id").eq("slug", "paciente").single();
  const { error: erroPapel } = await service
    .from("user_roles")
    .insert({ profile_id: patientProfileId, role_id: papel!.id });
  if (erroPapel) throw new Error(`MR-02 papel: ${erroPapel.message}`);

  const { error: erroPerfil } = await service
    .from("patient_profiles")
    .insert({ profile_id: patientProfileId });
  if (erroPerfil) throw new Error(`MR-02 perfil: ${erroPerfil.message}`);

  const { data: curador } = await service
    .from("user_roles")
    .select("profile_id, roles!inner(slug)")
    .eq("roles.slug", "curador_medico")
    .limit(1)
    .single();
  const curadorId = curador!.profile_id as string;

  const { data: story, error: erroStory } = await service
    .from("patient_stories")
    .insert({
      profile_id: patientProfileId,
      created_by: patientProfileId,
      status: "enviada",
      data: { motivo: `Cenário E2E do reconhecimento (${marca}).` },
    })
    .select("id")
    .single();
  if (erroStory) throw new Error(`MR-02 história: ${erroStory.message}`);

  const { data: caso, error: erroCaso } = await service
    .from("cases")
    .insert({
      patient_profile_id: patientProfileId,
      source_story_id: story!.id as string,
      assigned_curator_id: curadorId,
      created_by: patientProfileId,
    })
    .select("id")
    .single();
  if (erroCaso) throw new Error(`MR-02 case: ${erroCaso.message}`);
  const caseId = caso!.id as string;

  const opcoes = CONCEITOS_DO_CENARIO.map((code) => {
    const { valor, rotulo } = primeiraOpcao(code);
    return { code, valor, rotulo, leitura: `Leitura do Curador sobre ${code} (${marca}).` };
  });

  for (const { code, valor, leitura } of opcoes) {
    const { error } = await service.from("case_needs").insert({
      case_id: caseId,
      subcriterion_code: code,
      options: [valor],
      degree: "ESSENCIAL",
      origin: "TRADUCAO",
      proposed_reading: leitura,
      acknowledgment: "PENDENTE",
      declared_by: curadorId,
    });
    if (error) throw new Error(`MR-02 tradução ${code}: ${error.message}`);
  }

  // O Mapa dá a coluna 2 da comparação. `declared_by` fica NULO de propósito:
  // o oráculo do PP-02 conta a tabela inteira exigindo zero autoria, e uma
  // fixture não pode derrubar a suíte de outro pacote.
  const { data: conceitos } = await service
    .from("method_subcriteria")
    .select("id, code")
    .in("code", [...CONCEITOS_DO_CENARIO]);

  for (const conceito of conceitos ?? []) {
    const { error } = await service.from("case_priority_map").insert({
      case_id: caseId,
      subcriterion_id: conceito.id as string,
      importance: "MUITO_IMPORTANTE",
    });
    if (error) throw new Error(`MR-02 mapa ${conceito.code}: ${error.message}`);
  }

  const { error: erroProfile } = await service
    .from("priority_profiles")
    .insert({ case_id: caseId, curator_id: curadorId, status: "DRAFT" });
  if (erroProfile) throw new Error(`MR-02 priority_profile: ${erroProfile.message}`);

  return { marca, email, password, patientProfileId, caseId, storyId: story!.id as string, opcoes };
}

/**
 * Apaga EXATAMENTE o que esta execução criou, na ordem em que as FKs pedem.
 *
 * Cada `delete` é filtrado pelo id desta execução — nunca por nome, prefixo ou
 * data. Dado de outra execução, ou dado real, não é alcançável daqui nem que
 * a limpeza rode duas vezes.
 *
 * Tolerante a cenário parcial: uma preparação interrompida no meio precisa
 * conseguir limpar o que já existia, senão o resíduo volta pela porta dos
 * fundos.
 */
export async function limparCenario(cenario: Partial<Cenario> | null): Promise<void> {
  if (!cenario?.patientProfileId) return;
  const service = admin();
  const { patientProfileId, caseId } = cenario;

  // A trilha primeiro: `actor_id` referencia a conta que sai por último.
  await service.from("audit_logs").delete().eq("actor_id", patientProfileId);

  if (caseId) {
    await service.from("case_needs").delete().eq("case_id", caseId);
    await service.from("case_priority_map").delete().eq("case_id", caseId);
    await service.from("priority_profiles").delete().eq("case_id", caseId);
    await service.from("cases").delete().eq("id", caseId);
  }

  await service.from("patient_stories").delete().eq("profile_id", patientProfileId);
  await service.from("patient_profiles").delete().eq("profile_id", patientProfileId);
  await service.from("user_roles").delete().eq("profile_id", patientProfileId);
  await service.auth.admin.deleteUser(patientProfileId);
}

/** Quanto sobrou desta execução no banco. Usado pelo próprio teste. */
export async function residuosDe(cenario: Cenario): Promise<Record<string, number>> {
  const service = admin();

  const contar = async (tabela: string, coluna: string, valor: string) => {
    const { count } = await service
      .from(tabela)
      .select("*", { count: "exact", head: true })
      .eq(coluna, valor);
    return count ?? 0;
  };

  return {
    cases: await contar("cases", "id", cenario.caseId),
    case_needs: await contar("case_needs", "case_id", cenario.caseId),
    case_priority_map: await contar("case_priority_map", "case_id", cenario.caseId),
    priority_profiles: await contar("priority_profiles", "case_id", cenario.caseId),
    patient_stories: await contar("patient_stories", "profile_id", cenario.patientProfileId),
    audit_logs: await contar("audit_logs", "actor_id", cenario.patientProfileId),
  };
}
