"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRoleForAction } from "@/modules/auth/guard";

import { professionalProfileSchema } from "./professional-schema";
import {
  createProfessionalProfile,
  setProfessionalPublicationStatus,
  setProfessionalStatus,
  updateProfessionalProfile,
} from "./professional-repository";
import type { ActionResult, ProfileStatus, PublicationStatus } from "./types";

function parseProfessionalForm(formData: FormData) {
  return professionalProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    professionalIdentifier: formData.get("professionalIdentifier"),
    crm: formData.get("crm"),
    crmUf: formData.get("crmUf"),
    professionalSummary: formData.get("professionalSummary"),
    institutionName: formData.get("institutionName"),
  });
}

// Nunca por autocadastro: só administrador chega até aqui (checagem
// server-side, além da RLS — "rotas e ações do servidor validam
// autorização, não apenas a interface").
export async function createProfessionalProfileAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  let authState;
  try {
    authState = await requireRoleForAction("administrador");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = parseProfessionalForm(formData);
  if (!parsed.success) {
    return { success: false, error: "Confira os dados informados e tente novamente." };
  }

  const supabase = await createServerSupabaseClient();
  let created;
  try {
    created = await createProfessionalProfile(supabase, {
      displayName: parsed.data.displayName,
      professionalIdentifier: parsed.data.professionalIdentifier,
      crm: parsed.data.crm ?? null,
      crmUf: parsed.data.crmUf ?? null,
      professionalSummary: parsed.data.professionalSummary ?? null,
      institutionName: parsed.data.institutionName ?? null,
      createdBy: authState.user.id,
    });
  } catch {
    return { success: false, error: "Não foi possível criar o profissional agora. Tente novamente." };
  }

  revalidatePath("/admin/profissionais");
  redirect(`/admin/profissionais/${created.id}`);
}

export async function updateProfessionalProfileAction(
  id: string,
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  let authState;
  try {
    authState = await requireRoleForAction("administrador");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = parseProfessionalForm(formData);
  if (!parsed.success) {
    return { success: false, error: "Confira os dados informados e tente novamente." };
  }

  const supabase = await createServerSupabaseClient();
  try {
    await updateProfessionalProfile(supabase, id, {
      displayName: parsed.data.displayName,
      professionalIdentifier: parsed.data.professionalIdentifier,
      crm: parsed.data.crm ?? null,
      crmUf: parsed.data.crmUf ?? null,
      professionalSummary: parsed.data.professionalSummary ?? null,
      institutionName: parsed.data.institutionName ?? null,
      updatedBy: authState.user.id,
    });
  } catch {
    return { success: false, error: "Não foi possível atualizar o profissional agora. Tente novamente." };
  }

  revalidatePath(`/admin/profissionais/${id}`);
  revalidatePath("/admin/profissionais");
  return { success: true };
}

// Toggles simples — usados diretamente como `action` de um <form>, sem
// useActionState (não há estado de campo para validar). Erro de
// autorização propaga para o error.tsx do segmento /admin.
export async function setProfessionalStatusAction(
  id: string,
  status: ProfileStatus,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- exigido pela assinatura de `action` de <form>
  _formData: FormData,
): Promise<void> {
  const authState = await requireRoleForAction("administrador");
  const supabase = await createServerSupabaseClient();
  await setProfessionalStatus(supabase, id, status, authState.user.id);
  revalidatePath(`/admin/profissionais/${id}`);
  revalidatePath("/admin/profissionais");
}

export async function setProfessionalPublicationStatusAction(
  id: string,
  publicationStatus: PublicationStatus,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- exigido pela assinatura de `action` de <form>
  _formData: FormData,
): Promise<void> {
  const authState = await requireRoleForAction("administrador");
  const supabase = await createServerSupabaseClient();
  await setProfessionalPublicationStatus(supabase, id, publicationStatus, authState.user.id);
  revalidatePath(`/admin/profissionais/${id}`);
  revalidatePath("/admin/profissionais");
}
