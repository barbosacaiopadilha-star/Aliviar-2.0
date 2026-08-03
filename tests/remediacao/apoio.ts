import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { createCuradoriaClient } from "../integration/curadoria-client";

/**
 * Apoio dos gates de remediação — os MESMOS padrões da casa:
 *
 *  - sessões reais por login (`signInWithPassword`), nunca `set role`;
 *  - contas permanentes de `test-users.local.json` para os papéis da equipe;
 *  - pacientes sintéticas criadas pela Admin API + papel real concedido;
 *  - estado preparado com service_role (fixture), ataque com sessão legítima.
 *
 * A limpeza é a de `setup-limpeza-remediacao.ts` (inventário por arquivo).
 */

type TestAccount = { role: string; email: string; password: string };

const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");

export function url(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL as string;
}

export function anonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
}

export function contasPermanentes(): TestAccount[] {
  if (!existsSync(TEST_USERS_PATH)) {
    throw new Error("test-users.local.json não existe. Rode `npm run bootstrap:test-users`.");
  }
  return JSON.parse(readFileSync(TEST_USERS_PATH, "utf-8")) as TestAccount[];
}

export type Sessao = { client: SupabaseClient; userId: string };

/** Sessão REAL de um papel permanente — login de verdade, nunca set role. */
export async function entrarComo(role: string): Promise<Sessao> {
  const conta = contasPermanentes().find((entrada) => entrada.role === role);
  if (!conta) throw new Error(`conta permanente do papel "${role}" não encontrada.`);

  const client = createCuradoriaClient(url(), anonKey());
  const { error } = await client.auth.signInWithPassword({
    email: conta.email,
    password: conta.password,
  });
  if (error) throw new Error(`login como ${role}: ${error.message}`);

  const {
    data: { user },
  } = await client.auth.getUser();
  return { client, userId: user!.id };
}

export type PacienteSintetica = Sessao & { email: string; password: string };

/** Paciente sintética com conta real, papel real e sessão autenticada. */
export async function novaPaciente(
  service: SupabaseClient,
  prefixo: string,
): Promise<PacienteSintetica> {
  const sufixo = randomUUID().slice(0, 8);
  const email = `${prefixo}-${sufixo}@aliviar-conexao.local`;
  const password = `Senha-${sufixo}-Ok!`;

  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: `Paciente ${prefixo}` },
  });
  if (error || !data?.user) throw new Error(`fixture paciente: ${error?.message ?? "?"}`);
  const id = data.user.id;

  const { data: papel } = await service.from("roles").select("id").eq("slug", "paciente").single();
  const { error: papelError } = await service
    .from("user_roles")
    .insert({ profile_id: id, role_id: papel!.id });
  if (papelError) throw new Error(`fixture papel paciente: ${papelError.message}`);

  await service.from("patient_profiles").insert({ profile_id: id });

  const client = createCuradoriaClient(url(), anonKey());
  const { error: loginError } = await client.auth.signInWithPassword({ email, password });
  if (loginError) throw new Error(`login paciente sintética: ${loginError.message}`);

  return { client, userId: id, email, password };
}

// ---------------------------------------------------------------------------
// Cadeia da Curadoria — estado preparado por service_role (fixture), pelo
// mesmo formato que o produto grava. O ataque de cada gate usa sessão real.
//
// Os profissionais das cadeias são sintéticos COMUNS (is_test_fixture=false):
// o emparelhamento fixture<->Case-de-certificação impede perfil de
// certificação em Case real, e `reject_demo_professional` impede que
// qualquer perfil sintético de certificação/demo chegue à Connection. Eles
// nunca são publicados — não entram na Rede de ninguém — e a limpeza por
// inventário os remove ao fim do arquivo.
// ---------------------------------------------------------------------------

/** N profissionais sintéticos comuns (nunca publicados, nunca fixture). */
export async function profissionaisSinteticos(
  service: SupabaseClient,
  quantidade: number,
  createdBy: string,
  prefixo: string,
): Promise<string[]> {
  const ids: string[] = [];
  for (let indice = 0; indice < quantidade; indice += 1) {
    const { data, error } = await service
      .from("professional_profiles")
      .insert({
        display_name: `Profissional Sintético ${prefixo}-${indice + 1}`,
        professional_identifier: `GATE-${prefixo.toUpperCase()}-${randomUUID().slice(0, 8)}`,
        professional_summary:
          "Perfil sintético criado exclusivamente pelos gates de remediação. Nunca publicado.",
        created_by: createdBy,
      })
      .select("id")
      .single();
    if (error) throw new Error(`fixture profissional sintético: ${error.message}`);
    ids.push(data!.id as string);
  }
  return ids;
}

export type CadeiaCuradoria = {
  paciente: PacienteSintetica;
  caseId: string;
  storyId: string;
};

/** História enviada + Case com o Curador permanente como responsável. */
export async function casoComCurador(
  service: SupabaseClient,
  curadorId: string,
  prefixo: string,
): Promise<CadeiaCuradoria> {
  const paciente = await novaPaciente(service, prefixo);

  const { data: story, error: storyError } = await service
    .from("patient_stories")
    .insert({
      profile_id: paciente.userId,
      created_by: paciente.userId,
      status: "enviada",
      data: { motivo: `Cenário sintético de gate (${prefixo}).` },
    })
    .select("id")
    .single();
  if (storyError) throw new Error(`fixture história: ${storyError.message}`);

  const { data: caso, error: caseError } = await service
    .from("cases")
    .insert({
      patient_profile_id: paciente.userId,
      source_story_id: story!.id as string,
      assigned_curator_id: curadorId,
      created_by: paciente.userId,
    })
    .select("id")
    .single();
  if (caseError) throw new Error(`fixture case: ${caseError.message}`);

  return { paciente, caseId: caso!.id as string, storyId: story!.id as string };
}

export async function perfilDePrioridades(
  service: SupabaseClient,
  caseId: string,
  curadorId: string,
  { validado = true }: { validado?: boolean } = {},
): Promise<string> {
  const { data, error } = await service
    .from("priority_profiles")
    .insert({
      case_id: caseId,
      curator_id: curadorId,
      status: validado ? "VALIDATED" : "DRAFT",
      validated_at: validado ? new Date().toISOString() : null,
      patient_history: "Histórico sintético do gate.",
    })
    .select("id")
    .single();
  if (error) throw new Error(`fixture priority_profile: ${error.message}`);
  return data!.id as string;
}

/**
 * Bloco C (gate C7): seleção NÃO nasce entregue — o banco recusa o INSERT
 * já-DELIVERED para qualquer sessão. A fixture percorre o caminho REAL da
 * entrega: nasce DRAFT com as três opções, ganha Relatório emitido (exigência
 * do gate B12 na transição) e só então transiciona para DELIVERED — o mesmo
 * UPDATE que `deliver_curadoria` executa. Quando `entregue: true`, o
 * Relatório emitido criado aqui é REUTILIZADO por `relatorioDaSelecao`
 * (idempotente por seleção), então os gates que pedem o Relatório depois
 * continuam recebendo o mesmo documento.
 */
export async function selecaoComOpcoes(
  service: SupabaseClient,
  caseId: string,
  priorityProfileId: string,
  curadorId: string,
  professionalIds: string[],
  { entregue = true }: { entregue?: boolean } = {},
): Promise<string> {
  const { data, error } = await service
    .from("curated_selections")
    .insert({
      case_id: caseId,
      priority_profile_id: priorityProfileId,
      selected_by: curadorId,
      composition_rationale: "Composição sintética do gate.",
      status: "DRAFT",
      delivered_at: null,
    })
    .select("id")
    .single();
  if (error) throw new Error(`fixture curated_selection: ${error.message}`);
  const selectionId = data!.id as string;

  const { error: optError } = await service.from("curated_selection_options").insert(
    professionalIds.map((professionalProfileId, index) => ({
      curated_selection_id: selectionId,
      professional_profile_id: professionalProfileId,
      position: index + 1,
      rationale: `Opção sintética ${index + 1}.`,
    })),
  );
  if (optError) throw new Error(`fixture selection_options: ${optError.message}`);

  if (entregue) {
    // A transição para DELIVERED exige Relatório emitido (gate B12).
    await relatorioDaSelecao(service, caseId, selectionId, curadorId, professionalIds, {
      emitido: true,
      entregue: false,
    });

    const { error: deliverError } = await service
      .from("curated_selections")
      .update({ status: "DELIVERED", delivered_at: new Date().toISOString() })
      .eq("id", selectionId);
    if (deliverError) throw new Error(`fixture entrega da seleção: ${deliverError.message}`);
  }

  return selectionId;
}

/**
 * Idempotente por seleção (Bloco C): se a cadeia entregue de
 * `selecaoComOpcoes` já criou o Relatório emitido desta seleção, ele é
 * REUTILIZADO (o conteúdo é o mesmo formato sintético) e só os carimbos
 * pedidos que ainda faltam são aplicados — um Relatório emitido é documento
 * congelado, e as opções não entram duas vezes.
 */
export async function relatorioDaSelecao(
  service: SupabaseClient,
  caseId: string,
  curatedSelectionId: string,
  curadorId: string,
  professionalIds: string[],
  { emitido = true, entregue = true }: { emitido?: boolean; entregue?: boolean } = {},
): Promise<string> {
  const agora = new Date().toISOString();

  const { data: existente, error: lookupError } = await service
    .from("curadoria_reports")
    .select("id, emitted_at, delivered_at")
    .eq("curated_selection_id", curatedSelectionId)
    .maybeSingle();
  if (lookupError) throw new Error(`fixture report (lookup): ${lookupError.message}`);

  let reportId: string;
  let jaEmitido = false;
  let jaEntregue = false;

  if (existente) {
    reportId = existente.id as string;
    jaEmitido = existente.emitted_at != null;
    jaEntregue = existente.delivered_at != null;
  } else {
    const { data, error } = await service
      .from("curadoria_reports")
      .insert({
        case_id: caseId,
        curated_selection_id: curatedSelectionId,
        composition_rationale: "Composição sintética do gate.",
        approved_at: agora,
        approved_by: curadorId,
      })
      .select("id")
      .single();
    if (error) throw new Error(`fixture report: ${error.message}`);
    reportId = data!.id as string;

    const { error: optError } = await service.from("curadoria_report_options").insert(
      professionalIds.map((professionalProfileId, index) => ({
        report_id: reportId,
        professional_profile_id: professionalProfileId,
        position: index + 1,
        justification: `Justificativa sintética ${index + 1}.`,
        relation_to_weights: `Relação sintética ${index + 1}.`,
        attention_points: [`Ponto de atenção sintético ${index + 1}.`],
        favorable_points: [`Ponto favorável sintético ${index + 1}.`],
      })),
    );
    if (optError) throw new Error(`fixture report_options: ${optError.message}`);
  }

  if (emitido && !jaEmitido) {
    const { error: emitError } = await service
      .from("curadoria_reports")
      .update({ emitted_at: agora })
      .eq("id", reportId);
    if (emitError) throw new Error(`fixture emissão: ${emitError.message}`);
  }

  if (entregue && !jaEntregue) {
    const { error: deliverError } = await service
      .from("curadoria_reports")
      .update({ delivered_at: new Date().toISOString() })
      .eq("id", reportId);
    if (deliverError) throw new Error(`fixture entrega do relatório: ${deliverError.message}`);
  }

  return reportId;
}

export function serviceClient(): SupabaseClient {
  return createAdminSupabaseClient();
}
