"use server";

import { revalidatePath } from "next/cache";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRoleForAction } from "@/modules/auth/guard";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";

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
 * Conversão do lead em Patient.
 *
 * @metodo Correção do Administrador §2 — Caminho B, quem executa no fluxo normal é o Atendente
 *
 * A divisão de responsabilidade aqui é deliberada:
 *
 * - A **mecânica privilegiada** (criar conta de autenticação, conceder o papel
 *   de paciente) roda com a chave de serviço, porque só ela pode.
 * - A **decisão de autorização** roda no banco, sob a identidade real de quem
 *   clicou: `convert_lead_to_patient` lê `auth.uid()` e revalida tudo.
 *
 * Ou seja: a chave de serviço executa, mas não decide. Se a pessoa não podia
 * converter, o banco recusa mesmo tendo a conta já sido criada — e a conversão
 * não acontece, porque conversão é o vínculo, não a conta.
 *
 * Idempotência: se o lead já aponta para um paciente, nada é criado e a ação
 * devolve o mesmo paciente. Dois cliques não geram duas pessoas.
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

  if (!patientProfileId) {
    if (!email || !displayName) {
      return { success: false, error: "Para criar um paciente novo, informe nome e e-mail." };
    }
    try {
      const created = await createPatientAccount(
        createAdminSupabaseClient(),
        supabase,
        { email, displayName },
        authState.user.id,
      );
      patientProfileId = created.profileId;
      credentials = { email: created.email, password: created.password };
    } catch {
      return { success: false, error: "Não foi possível criar a conta do paciente." };
    }
  }

  const { error } = await db.rpc("convert_lead_to_patient", {
    _contact_id: leadId,
    _patient_profile_id: patientProfileId,
    _administrative_exception: administrativeException ?? false,
    _reason: reason ?? null,
  });

  if (error) return { success: false, error: error.message };

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
