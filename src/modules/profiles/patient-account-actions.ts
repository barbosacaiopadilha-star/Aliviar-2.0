"use server";

import { falhaParaUsuario } from "@/lib/observability/erros";
import { revalidatePath } from "next/cache";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRoleForAction } from "@/modules/auth/guard";

import { adminPatientProfileSchema, createPatientAccountSchema } from "./patient-account-schema";
import { createPatientAccount, resetPatientPassword, setPatientAccountAccess } from "./patient-account-repository";
import { createPatientNotification } from "./patient-notification-repository";
import type { ActionResult } from "./types";

// Resultado exibido apenas uma vez, na resposta desta própria ação — nunca
// persistido, nunca logado, nunca recuperável depois (correção de regra
// de negócio, seção 2 e 3).
export type CreatePatientAccountActionResult =
  | { success: true; profileId: string; email: string; password: string }
  | { success: false; error: string };

export async function createPatientAccountAction(
  _prevState: CreatePatientAccountActionResult | undefined,
  formData: FormData,
): Promise<CreatePatientAccountActionResult> {
  let authState;
  try {
    authState = await requireRoleForAction("administrador");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = createPatientAccountSchema.safeParse({
    email: formData.get("email"),
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    return { success: false, error: "Confira os dados informados e tente novamente." };
  }

  const adminClient = createAdminSupabaseClient();
  const regularClient = await createServerSupabaseClient();

  try {
    const result = await createPatientAccount(
      adminClient,
      regularClient,
      { email: parsed.data.email, displayName: parsed.data.displayName },
      authState.user.id,
    );

    revalidatePath("/admin/pacientes");
    return {
      success: true,
      profileId: result.profileId,
      email: result.email,
      password: result.password,
    };
  } catch (erro) {
    return { success: false, error: falhaParaUsuario("profiles.patient-account-actions", erro, { mensagem: "Não foi possível criar o paciente agora. Tente novamente." }) };
  }
}

export type ResetPatientPasswordActionResult =
  | { success: true; password: string }
  | { success: false; error: string };

export async function resetPatientPasswordAction(
  profileId: string,
): Promise<ResetPatientPasswordActionResult> {
  try {
    await requireRoleForAction("administrador");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const adminClient = createAdminSupabaseClient();

  try {
    const password = await resetPatientPassword(adminClient, profileId);
    return { success: true, password };
  } catch (erro) {
    return { success: false, error: falhaParaUsuario("profiles.patient-account-actions", erro, { mensagem: "Não foi possível redefinir a senha agora." }) };
  }
}

// Bloqueia/desbloqueia o login (Admin API) e mantém o status refletido em
// patient_profiles.status para exibição — nunca o contrário (o status
// exibido segue o bloqueio real, não define ele).
export async function setPatientAccessAction(
  profileId: string,
  active: boolean,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- exigido pela assinatura de `action` de <form>
  _formData: FormData,
): Promise<void> {
  await requireRoleForAction("administrador");

  const adminClient = createAdminSupabaseClient();
  const regularClient = await createServerSupabaseClient();

  await setPatientAccountAccess(adminClient, profileId, active);
  await regularClient
    .from("patient_profiles")
    .upsert({ profile_id: profileId, status: active ? "ativo" : "inativo" }, { onConflict: "profile_id" });

  await createPatientNotification(
    regularClient,
    profileId,
    active ? "Seu acesso foi reativado" : "Seu acesso foi pausado",
    active
      ? "Você já pode entrar normalmente na plataforma novamente."
      : "Seu acesso foi pausado pela nossa equipe. Se tiver dúvidas, fale com a Aliviar.",
  );

  revalidatePath(`/admin/pacientes/${profileId}`);
  revalidatePath("/admin/pacientes");
  revalidatePath("/paciente");
}

export async function updatePatientProfileByAdminAction(
  profileId: string,
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireRoleForAction("administrador");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = adminPatientProfileSchema.safeParse({
    phone: formData.get("phone"),
    city: formData.get("city"),
    state: formData.get("state"),
  });

  if (!parsed.success) {
    return { success: false, error: "Confira os dados informados e tente novamente." };
  }

  const regularClient = await createServerSupabaseClient();

  try {
    const { error } = await regularClient.from("patient_profiles").upsert(
      {
        profile_id: profileId,
        phone: parsed.data.phone ?? null,
        city: parsed.data.city ?? null,
        state: parsed.data.state ?? null,
      },
      { onConflict: "profile_id" },
    );

    if (error) {
      throw error;
    }

    await createPatientNotification(
      regularClient,
      profileId,
      "Seus dados foram atualizados",
      "A equipe Aliviar atualizou algumas informações do seu cadastro.",
    );
  } catch (erro) {
    return { success: false, error: falhaParaUsuario("profiles.patient-account-actions", erro, { mensagem: "Não foi possível salvar os dados agora. Tente novamente." }) };
  }

  revalidatePath(`/admin/pacientes/${profileId}`);
  revalidatePath("/paciente");
  return { success: true };
}
