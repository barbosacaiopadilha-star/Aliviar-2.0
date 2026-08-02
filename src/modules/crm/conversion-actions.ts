"use server";

import { revalidatePath } from "next/cache";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { registrarErro } from "@/lib/observability/erros";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRoleForAction } from "@/modules/auth/guard";
import {
  createPatientAccount,
  resetPatientPassword,
} from "@/modules/profiles/patient-account-repository";

import { convertLeadInputSchema, openCaseInputSchema, qualifyLeadInputSchema } from "./schema";

export type QualifyLeadResult = { success: true } | { success: false; error: string };

/**
 * Qualificação do lead — Nível 1.
 *
 * @metodo Correção do Administrador §3 — não criar paciente antes da qualificação
 */
export async function qualifyLeadAction(input: unknown): Promise<QualifyLeadResult> {
  try {
    await requireAnyRoleForAction(["atendente", "administrador"]);
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = qualifyLeadInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.schema("curadoria").rpc("qualify_lead", {
    _contact_id: parsed.data.leadId,
    _notes: parsed.data.notes ?? null,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export type ConvertLeadResult =
  | { success: true; patientProfileId: string; created: boolean; credentials?: { email: string; password: string } }
  | { success: false; error: string };

/**
 * Conversão do lead em Patient — agora uma SAGA com compensação (Bloco B/AT-02).
 *
 * @metodo Correção do Administrador §2 — Caminho B, quem executa no fluxo normal é o Atendente
 *
 * A divisão de responsabilidade é deliberada:
 *
 * - A **mecânica privilegiada** (criar conta de autenticação) roda com a
 *   chave de serviço, porque só ela pode — e é o único passo fora do banco.
 * - O **registro do provisionamento** (`register_provisioned_patient`) e a
 *   **decisão da conversão** (`convert_lead_to_patient`) rodam no banco, sob
 *   a identidade real de quem clicou, cada um numa transação única.
 *
 * O contrato da saga:
 * - a operação é idempotente por `convert-lead:<lead>`: um retry reencontra a
 *   conta registrada e não trava mais no e-mail duplicado;
 * - recusa da RPC de conversão ⇒ compensação (deleteUser + registro
 *   COMPENSATED). Se a compensação falhar, a operação permanece REGISTERED em
 *   `patient_provisioning` — retomável, nunca invisível;
 * - "já convertido" é distinguido de erro real (a própria RPC devolve o
 *   mesmo lead sem reescrever carimbos);
 * - credenciais ("boas-vindas") só existem no retorno de SUCESSO — nunca são
 *   expostas para uma conversão que o banco recusou.
 */
export async function convertLeadToPatientAction(input: unknown): Promise<ConvertLeadResult> {
  let authState;
  try {
    authState = await requireAnyRoleForAction(["atendente", "administrador"]);
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = convertLeadInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { leadId, email, displayName, existingPatientProfileId, administrativeException, reason } = parsed.data;

  const supabase = await createServerSupabaseClient();
  const db = supabase.schema("curadoria");
  const operationKey = `convert-lead:${leadId}`;

  // Já convertido? Sai antes de criar qualquer coisa.
  const { data: lead, error: leadError } = await db
    .from("crm_contacts")
    .select("id, patient_profile_id, qualified_at")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError) return { success: false, error: "Não foi possível ler o lead." };
  if (!lead) return { success: false, error: "Lead não encontrado." };
  if (lead.patient_profile_id) {
    return { success: true, patientProfileId: lead.patient_profile_id as string, created: false };
  }

  // Reaproveitar um paciente existente é o caminho preferido quando a pessoa
  // já está cadastrada: converter não deve criar uma segunda ficha da mesma
  // pessoa só porque ela escreveu de novo.
  let patientProfileId = existingPatientProfileId ?? null;
  let credentials: { email: string; password: string } | undefined;
  // Conta pertencente à operação de provisionamento (criada agora ou
  // retomada) — é a que a compensação desfaz se o banco recusar o vínculo.
  let provisionedAccount = false;

  if (!patientProfileId) {
    if (!email || !displayName) {
      return { success: false, error: "Para criar um paciente novo, informe nome e e-mail." };
    }

    // Retomada: uma tentativa anterior pode ter criado a conta e parado antes
    // do vínculo. A operação registrada devolve a MESMA conta — nunca uma
    // segunda pessoa, nunca o beco do e-mail duplicado.
    const { data: pendente } = await db
      .from("patient_provisioning")
      .select("profile_id, status")
      .eq("operation_key", operationKey)
      .maybeSingle();

    if (pendente?.status === "REGISTERED" && pendente.profile_id) {
      patientProfileId = pendente.profile_id as string;
      provisionedAccount = true;
      try {
        const password = await resetPatientPassword(createAdminSupabaseClient(), patientProfileId);
        credentials = { email, password };
      } catch (erro) {
        registrarErro("crm.convertLead.retomada", erro, { leadId, patientProfileId });
        return {
          success: false,
          error: "Uma tentativa anterior desta conversão ficou pendente e não pôde ser retomada.",
        };
      }
    } else {
      try {
        const created = await createPatientAccount(
          createAdminSupabaseClient(),
          supabase,
          { email, displayName, originLeadId: leadId, operationKey },
          authState.user.id,
        );
        patientProfileId = created.profileId;
        provisionedAccount = true;
        credentials = { email: created.email, password: created.password };
      } catch (erro) {
        // O erro real chega ao operador — nunca mais o genérico que escondia
        // o e-mail duplicado sem saída (AT-02).
        return {
          success: false,
          error: erro instanceof Error ? erro.message : "Não foi possível criar a conta do paciente.",
        };
      }
    }
  }

  const { error } = await db.rpc("convert_lead_to_patient", {
    _contact_id: leadId,
    _patient_profile_id: patientProfileId,
    _administrative_exception: administrativeException ?? false,
    _reason: reason ?? null,
  });

  if (error) {
    // Recusa do banco ⇒ compensação da conta provisionada. Ordem deliberada:
    // primeiro a RPC de compensação (revoga o papel com o perfil ainda de pé
    // — a cascata do deleteUser dispararia o trigger de auditoria de
    // user_roles com o profile já removido e violaria a própria FK, travando
    // a remoção), depois o deleteUser. Se qualquer passo falhar, o resíduo é
    // logado com referência e a operação permanece visível e retomável em
    // patient_provisioning — nunca um órfão invisível.
    if (provisionedAccount && patientProfileId) {
      const { error: resolveError } = await db.rpc("compensate_patient_provisioning", {
        _operation_key: operationKey,
      });
      if (resolveError) {
        registrarErro("crm.convertLead.compensacao.registro", resolveError, { leadId });
      } else {
        const { error: compensationError } = await createAdminSupabaseClient().auth.admin.deleteUser(
          patientProfileId,
        );
        if (compensationError) {
          registrarErro("crm.convertLead.compensacao", compensationError, {
            leadId,
            patientProfileId,
          });
        }
      }
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/pacientes");
  revalidatePath("/atendimento");
  revalidatePath(`/atendimento/${leadId}`);
  return { success: true, patientProfileId, created: credentials !== undefined, credentials };
}

export type OpenCaseResult = { success: true; caseId: string } | { success: false; error: string };

/**
 * Abertura do Case a partir do lead — Nível 1.
 *
 * @metodo Correção do Administrador §4 — o Atendente abre o Case
 *
 * Idempotente no banco: se o lead já produziu um Case, devolve o mesmo. Um
 * duplo clique não cria a segunda ficha da mesma pessoa.
 */
export async function openCaseFromLeadAction(input: unknown): Promise<OpenCaseResult> {
  try {
    await requireAnyRoleForAction(["atendente", "administrador"]);
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = openCaseInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.schema("curadoria").rpc("open_case_from_lead", {
    _contact_id: parsed.data.leadId,
    _initial_story: parsed.data.initialStory ?? null,
  });

  if (error) return { success: false, error: error.message };

  const row = Array.isArray(data) ? data[0] : data;
  const caseId = (row as { id?: string } | null)?.id;
  if (!caseId) return { success: false, error: "O Case foi aberto, mas não foi possível lê-lo." };

  revalidatePath("/atendimento");
  revalidatePath(`/atendimento/${parsed.data.leadId}`);
  revalidatePath("/admin");
  return { success: true, caseId };
}
