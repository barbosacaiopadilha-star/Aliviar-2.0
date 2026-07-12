import "server-only";

import { randomBytes } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ProfileStatus } from "./types";

// Alta entropia (18 bytes = 144 bits), base64url (sem caracteres que
// confundem leitura manual como +/=). Nunca logada, nunca persistida —
// só existe no valor de retorno desta função, para exibição única na UI.
function generateSecurePassword(): string {
  return randomBytes(18).toString("base64url");
}

export type PatientAccountSummary = {
  profileId: string;
  email: string;
  displayName: string;
  accountStatus: ProfileStatus;
};

export type CreatePatientAccountFields = {
  email: string;
  displayName: string;
};

export type CreatePatientAccountResult = {
  profileId: string;
  email: string;
  password: string;
};

// Cria a conta (auth.users, via Admin API), concede o papel "paciente" e
// retorna a senha gerada — a única vez que ela existe fora do provedor de
// autenticação. `handle_new_user` (TASK-003) já cria profiles/user_settings
// automaticamente a partir do INSERT em auth.users; não duplicado aqui.
export async function createPatientAccount(
  adminClient: SupabaseClient,
  regularClient: SupabaseClient,
  input: CreatePatientAccountFields,
  grantedBy: string,
): Promise<CreatePatientAccountResult> {
  const password = generateSecurePassword();

  const { data, error } = await adminClient.auth.admin.createUser({
    email: input.email,
    password,
    email_confirm: true,
    user_metadata: { display_name: input.displayName },
  });

  if (error || !data.user) {
    throw new Error("Não foi possível criar a conta do paciente.");
  }

  const profileId = data.user.id;

  const { data: roleRow, error: roleLookupError } = await regularClient
    .from("roles")
    .select("id")
    .eq("slug", "paciente")
    .single();

  if (roleLookupError || !roleRow) {
    throw new Error("Papel 'paciente' não encontrado no catálogo.");
  }

  const { error: roleError } = await regularClient
    .from("user_roles")
    .insert({ profile_id: profileId, role_id: roleRow.id, granted_by: grantedBy });

  if (roleError) {
    throw new Error("Não foi possível conceder o papel de paciente.");
  }

  return { profileId, email: input.email, password };
}

// Gera uma nova senha e a define via Admin API — nunca reaproveita ou
// consulta a senha anterior (não é possível: o Supabase Auth nunca
// armazena senha em texto puro, apenas hash).
export async function resetPatientPassword(
  adminClient: SupabaseClient,
  profileId: string,
): Promise<string> {
  const password = generateSecurePassword();

  const { error } = await adminClient.auth.admin.updateUserById(profileId, { password });

  if (error) {
    throw new Error("Não foi possível redefinir a senha.");
  }

  return password;
}

// Bloqueia/desbloqueia o LOGIN de verdade (Admin API, auth.users) — nunca
// apenas o campo de status cosmético em patient_profiles. As duas coisas
// são atualizadas juntas por quem chama esta função (ver
// patient-account-actions.ts), nunca uma sem a outra.
export async function setPatientAccountAccess(
  adminClient: SupabaseClient,
  profileId: string,
  active: boolean,
): Promise<void> {
  const { error } = await adminClient.auth.admin.updateUserById(profileId, {
    // ~100 anos: efetivamente permanente até uma nova chamada com "none".
    ban_duration: active ? "none" : "876000h",
  });

  if (error) {
    throw new Error("Não foi possível atualizar o acesso do paciente.");
  }
}

export async function listPatientAccounts(
  regularClient: SupabaseClient,
  adminClient: SupabaseClient,
): Promise<PatientAccountSummary[]> {
  const { data: roleRow } = await regularClient.from("roles").select("id").eq("slug", "paciente").single();

  if (!roleRow) {
    return [];
  }

  const { data: userRoleRows } = await regularClient
    .from("user_roles")
    .select("profile_id")
    .eq("role_id", roleRow.id);

  const profileIds = (userRoleRows ?? []).map((row) => row.profile_id as string);

  if (profileIds.length === 0) {
    return [];
  }

  const { data: profileRows } = await regularClient
    .from("profiles")
    .select("id, display_name")
    .in("id", profileIds);

  const { data: patientProfileRows } = await regularClient
    .from("patient_profiles")
    .select("profile_id, status")
    .in("profile_id", profileIds);

  const statusByProfileId = new Map(
    (patientProfileRows ?? []).map((row) => [row.profile_id as string, row.status as ProfileStatus]),
  );

  const { data: usersData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  const authUserById = new Map((usersData?.users ?? []).map((user) => [user.id, user]));

  return (profileRows ?? []).map((profile) => {
    const authUser = authUserById.get(profile.id);
    const isBanned = Boolean(
      authUser?.banned_until && new Date(authUser.banned_until).getTime() > Date.now(),
    );

    return {
      profileId: profile.id,
      email: authUser?.email ?? "",
      displayName: profile.display_name ?? "Sem nome",
      accountStatus: isBanned ? "inativo" : statusByProfileId.get(profile.id) ?? "ativo",
    };
  });
}

export async function getPatientAccount(
  regularClient: SupabaseClient,
  adminClient: SupabaseClient,
  profileId: string,
): Promise<PatientAccountSummary | null> {
  const { data: profile } = await regularClient
    .from("profiles")
    .select("id, display_name")
    .eq("id", profileId)
    .maybeSingle();

  if (!profile) {
    return null;
  }

  const { data: patientProfile } = await regularClient
    .from("patient_profiles")
    .select("status")
    .eq("profile_id", profileId)
    .maybeSingle();

  const { data: authUserData } = await adminClient.auth.admin.getUserById(profileId);
  const isBanned = Boolean(
    authUserData.user?.banned_until && new Date(authUserData.user.banned_until).getTime() > Date.now(),
  );

  return {
    profileId: profile.id,
    email: authUserData.user?.email ?? "",
    displayName: profile.display_name ?? "Sem nome",
    accountStatus: isBanned ? "inativo" : (patientProfile?.status as ProfileStatus | undefined) ?? "ativo",
  };
}
