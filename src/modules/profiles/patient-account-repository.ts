import "server-only";
import { erroDeBanco } from "@/lib/observability/erros";

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
    throw erroDeBanco("Não foi possível criar a conta do paciente.", error);
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
    throw erroDeBanco("Não foi possível conceder o papel de paciente.", roleError);
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
    throw erroDeBanco("Não foi possível redefinir a senha.", error);
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
    throw erroDeBanco("Não foi possível atualizar o acesso do paciente.", error);
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

  // O nome vem EMBUTIDO na mesma consulta (join do PostgREST), nunca por um
  // segundo `.in()` com todos os ids: com N pacientes, o `.in()` vira uma URL
  // de N×37 bytes, e a partir de ~200 pacientes ela estoura o limite de 8 KB
  // do gateway — a listagem passava a voltar vazia. Encontrado pela
  // certificação, com 276 contas acumuladas no banco local.
  const { data: userRoleRows } = await regularClient
    .from("user_roles")
    // FK nomeada: user_roles aponta duas vezes para profiles (profile_id e
    // granted_by) e o PostgREST recusa o embed ambíguo.
    .select("profile_id, profiles!user_roles_profile_id_fkey(id, display_name)")
    .eq("role_id", roleRow.id);

  type EmbeddedProfile = { id: string; display_name: string | null };
  const profileRows = (userRoleRows ?? [])
    .map((row) => {
      const embedded = row.profiles as EmbeddedProfile | EmbeddedProfile[] | null;
      return Array.isArray(embedded) ? embedded[0] : embedded;
    })
    .filter((profile): profile is EmbeddedProfile => profile !== null && profile !== undefined);

  if (profileRows.length === 0) {
    return [];
  }

  // Sem filtro de ids pelo mesmo motivo: toda linha de patient_profiles já é
  // de paciente — filtrar por id só encurtaria o resultado e alongaria a URL.
  const { data: patientProfileRows } = await regularClient
    .from("patient_profiles")
    .select("profile_id, status");

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
