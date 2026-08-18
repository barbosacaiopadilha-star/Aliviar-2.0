import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { DB_SCHEMA } from "./env";
import { assertSupabaseCredential } from "./env-validation";

// Cliente com a service role key — nunca importável de código de cliente
// (o pacote `server-only` falha o build se isso acontecer). Usos legítimos
// (CONTRATO_1_11 §17.4):
//
//   1. Operações que a Admin API do Supabase Auth exige (criar conta,
//      redefinir senha, bloquear/desbloquear acesso de login).
//   2. Invocar capabilities SQL nominalmente lavradas, read-only e de saída
//      mínima (SECURITY DEFINER com EXECUTE exclusivo de `service_role`) —
//      p.ex. o leitor agregado do Painel de Discordância.
//
// O que continua proibido: leitura DIRETA de tabelas de negócio (`.from()`
// sobre dado de negócio ignora RLS — dado de negócio passa pelo cliente
// autenticado normal + RLS), e qualquer uso arbitrário de `service_role`.
// Este cliente não é, e não se torna, um leitor genérico.
//
// Autorização humana: este cliente ignora RLS por definição, então o gate é
// inteiramente responsabilidade de quem chama — e é o gate de papel declarado
// pela LAVRATURA de cada capability/superfície (não necessariamente
// `administrador`; o painel da Mesa, p.ex., exige
// `requireAnyRole(["curador_medico", "administrador"])`).
// A conversão no retorno fecha o descompasso entre o cliente concreto
// (parametrizado pelo schema de `DB_SCHEMA`) e o `SupabaseClient` declarado,
// que assume "public" — o achado B1 da auditoria de readiness (MISSÃO 207),
// que quebrava o build de produção. Só é válida porque `DB_SCHEMA` é
// anotado como `string`; com o literal, TypeScript recusa a conversão.
//
// Isto não decide qual schema é o correto — essa decisão continua pendente e
// é independente. O schema é configuração de runtime, não contrato de tipo.
export function createAdminSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias para operações administrativas.",
    );
  }

  assertSupabaseCredential("SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey);

  return createClient(url, serviceRoleKey, {
    db: { schema: DB_SCHEMA },
    auth: { autoRefreshToken: false, persistSession: false },
  }) as SupabaseClient;
}
