import "server-only";
import { ErroDaAplicacao, erroDeBanco, registrarErro } from "@/lib/observability/erros";

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
  /**
   * Lead de origem, quando a conta nasce dentro de uma conversão de lead.
   * Sem ele, o banco cria a ficha CRM de origem da própria conta — nenhuma
   * conta de paciente nasce invisível ao CRM (Bloco B/AT-02).
   */
  originLeadId?: string;
  /**
   * Chave idempotente da operação de provisionamento, fornecida pelo
   * CHAMADOR quando existe uma "solicitação" estável a proteger (Bloco
   * B.6/B3): a conversão usa `convert-lead:<lead>`; o caminho admin usa a
   * chave gerada no render do formulário (ver provisionPatientAccount).
   *
   * Fallbacks quando ausente: `convert-lead:<lead>` (estável — o lead é a
   * própria solicitação) ou `patient-account:<conta>` — este último deriva
   * do id gerado NA PRÓPRIA tentativa e portanto NÃO dá idempotência entre
   * tentativas (achado B3 da validação B.5); serve apenas como rastro da
   * operação para chamadas avulsas (fixtures/testes). Todo caminho de
   * PRODUÇÃO fornece uma chave estável.
   */
  operationKey?: string;
};

export type CreatePatientAccountResult = {
  profileId: string;
  email: string;
  password: string;
};

/**
 * Recusa de DOMÍNIO do Auth: já existe conta com este e-mail. Erro nomeado
 * para o chamador decidir (recuperar a operação ou recusar com clareza) sem
 * inspecionar mensagem por substring (Bloco B.6/B3).
 */
export class ContaComEsteEmailJaExisteError extends ErroDaAplicacao {
  constructor(email: string, cause: unknown) {
    super(`Já existe uma conta com o e-mail ${email}. Nenhuma conta nova foi criada.`, {
      tipo: "validacao",
      cause,
      contexto: { email },
    });
    this.name = "ContaComEsteEmailJaExisteError";
  }
}

// Detecção por CÓDIGO da Admin API (nunca substring de mensagem): o GoTrue
// devolve `code: "email_exists"` (HTTP 422) quando o e-mail já tem conta.
// O status 422 só decide quando NÃO veio código nenhum (versões antigas) —
// um 422 com outro código (ex.: validation_failed) não é e-mail duplicado.
function emailJaTemConta(error: unknown): boolean {
  const bruto = error as { code?: unknown; status?: unknown } | null;
  if (bruto?.code !== undefined && bruto?.code !== null) return bruto.code === "email_exists";
  return bruto?.status === 422;
}

// Cria a conta (auth.users, via Admin API) e registra o provisionamento no
// banco pela RPC transacional `register_provisioned_patient` (Bloco B/AT-05):
// papel "paciente", registro retomável da operação e — sem lead de origem —
// a ficha CRM de nascimento da conta, tudo num único ato. Se o registro
// falha, a conta recém-criada é COMPENSADA (deleteUser) antes de propagar o
// erro real: nunca sobra auth órfão sem papel e sem rastro.
//
// A senha retornada é a única vez que ela existe fora do provedor de
// autenticação. `handle_new_user` (TASK-003) já cria profiles/user_settings
// automaticamente a partir do INSERT em auth.users; não duplicado aqui.
export async function createPatientAccount(
  adminClient: SupabaseClient,
  regularClient: SupabaseClient,
  input: CreatePatientAccountFields,
  grantedBy: string,
): Promise<CreatePatientAccountResult> {
  void grantedBy; // o ator real vem de auth.uid() na RPC — nunca do cliente.
  const password = generateSecurePassword();

  const { data, error } = await adminClient.auth.admin.createUser({
    email: input.email,
    password,
    email_confirm: true,
    user_metadata: { display_name: input.displayName },
  });

  if (error || !data.user) {
    // E-mail já usado é recusa de DOMÍNIO, dita com todas as letras — nunca
    // mais o genérico que escondia o e-mail duplicado sem saída (AT-02/B3).
    if (emailJaTemConta(error)) {
      throw new ContaComEsteEmailJaExisteError(input.email, error);
    }
    throw erroDeBanco("Não foi possível criar a conta do paciente.", error);
  }

  const profileId = data.user.id;
  const operationKey =
    input.operationKey ??
    (input.originLeadId ? `convert-lead:${input.originLeadId}` : `patient-account:${profileId}`);

  const { error: provisioningError } = await regularClient.rpc("register_provisioned_patient", {
    _profile_id: profileId,
    _operation_key: operationKey,
    _origin_lead_id: input.originLeadId ?? null,
  });

  if (provisioningError) {
    // Compensação: a conta não pode sobreviver sem papel e sem registro. Se a
    // própria compensação falhar, o resíduo é logado com referência — nunca
    // silencioso (AT-05).
    const { error: compensationError } = await adminClient.auth.admin.deleteUser(profileId);
    if (compensationError) {
      registrarErro("profiles.createPatientAccount.compensacao", compensationError, {
        profileId,
        operationKey,
      });
    }
    throw erroDeBanco(provisioningError.message, provisioningError, { operationKey });
  }

  return { profileId, email: input.email, password };
}

export type ProvisioningOperation = {
  profileId: string | null;
  status: "REGISTERED" | "CONVERTED" | "COMPENSATED";
};

/**
 * Lê a operação de provisionamento pela `operation_key` — a decisão de
 * retomada/recuperação parte SEMPRE daqui.
 *
 * Contrato (Bloco B.6/B2, gate B18): erro de consulta LANÇA e propaga —
 * nunca é tratado como "não há operação pendente". Era exatamente esse
 * silêncio (o `error` descartado em conversion-actions.ts) que fazia uma
 * falha de leitura cair no `createUser` e reabrir o beco do e-mail
 * duplicado (AT-02). Ausência legítima (sem error, sem linha) devolve null
 * e o fluxo de criação segue normal.
 *
 * Por que a decisão NÃO foi movida para a RPC `register_provisioned_patient`
 * (preferência levantada no B.5): a retomada precisa ser decidida ANTES do
 * `createUser` — com a conta ainda por criar, não existe `_profile_id` para
 * chamar a RPC; e o passo que a decisão evita (criar conta no Auth) vive
 * fora do banco, onde nenhuma RPC alcança. A leitura fica no servidor; o
 * que o banco já garante segue no banco (idempotência por operation_key,
 * FOR UPDATE, conflito 23505 na própria RPC).
 */
export async function getProvisioningOperation(
  client: SupabaseClient,
  operationKey: string,
): Promise<ProvisioningOperation | null> {
  const { data, error } = await client
    .from("patient_provisioning")
    .select("profile_id, status")
    .eq("operation_key", operationKey)
    .maybeSingle();

  if (error) {
    throw erroDeBanco(
      "Não foi possível consultar a operação de provisionamento.",
      error,
      { operationKey },
    );
  }

  if (!data) return null;
  return {
    profileId: (data.profile_id as string | null) ?? null,
    status: data.status as ProvisioningOperation["status"],
  };
}

export type ProvisionPatientAccountInput = {
  email: string;
  displayName: string;
  /**
   * Chave ESTÁVEL da solicitação, gerada pelo chamador NA SUBMISSÃO (no
   * caminho admin: uuid criado no render do formulário e enviado como campo
   * oculto — reenviar o mesmo formulário repete a mesma chave). Nunca
   * derivada do id da conta (que só nasce durante a tentativa — achado B3)
   * e nunca o e-mail sozinho (mutável no próprio formulário e reutilizável
   * ao longo do tempo — uma chave permanente por e-mail travaria para
   * sempre uma recriação legítima futura).
   */
  operationKey: string;
};

export type ProvisionPatientAccountResult =
  | { outcome: "created"; profileId: string; email: string; password: string }
  | { outcome: "already_provisioned"; profileId: string };

/**
 * Operação IDEMPOTENTE do caminho admin de criação de conta (Bloco B.6/B3,
 * gate B19). `createPatientAccount` é a mecânica; aqui vive o contrato de
 * retry sobre a chave estável do chamador:
 *
 * - retry com a MESMA chave, operação já concluída => recupera o resultado
 *   (`already_provisioned` com a MESMA conta), sem segundo `createUser` e
 *   sem senha nova — credenciais só existem na execução que concluiu;
 * - mesma chave em PARALELO => o e-mail único do Auth garante um só
 *   `createUser`; o perdedor relê a operação e recupera (ou recusa com
 *   erro de domínio, e o retry seguinte recupera);
 * - chave DIFERENTE com o mesmo e-mail => recusa clara de domínio
 *   (`ContaComEsteEmailJaExisteError`), nunca uma segunda conta;
 * - falha de leitura NUNCA vira ausência (lição do B2): propaga antes de
 *   qualquer efeito — zero `createUser` em cima de dúvida.
 */
export async function provisionPatientAccount(
  adminClient: SupabaseClient,
  regularClient: SupabaseClient,
  input: ProvisionPatientAccountInput,
  grantedBy: string,
): Promise<ProvisionPatientAccountResult> {
  // 1) A solicitação já concluiu? (leitura com erro tratado — gate B18.)
  const operacao = await getProvisioningOperation(regularClient, input.operationKey);
  if (operacao && operacao.status !== "COMPENSATED" && operacao.profileId) {
    return { outcome: "already_provisioned", profileId: operacao.profileId };
  }

  // 2) Criação de verdade (mecânica + registro transacional na RPC).
  try {
    const created = await createPatientAccount(
      adminClient,
      regularClient,
      { email: input.email, displayName: input.displayName, operationKey: input.operationKey },
      grantedBy,
    );
    return { outcome: "created", ...created };
  } catch (erro) {
    if (erro instanceof ContaComEsteEmailJaExisteError) {
      // Corrida da MESMA chave: a execução vencedora pode ter registrado a
      // operação entre a leitura do passo 1 e o createUser — reler recupera.
      const corrida = await getProvisioningOperation(regularClient, input.operationKey);
      if (corrida && corrida.status !== "COMPENSATED" && corrida.profileId) {
        return { outcome: "already_provisioned", profileId: corrida.profileId };
      }
      // Chave diferente (outra solicitação) com o mesmo e-mail: conflito de
      // domínio de verdade — propaga com todas as letras.
    }
    throw erro;
  }
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
