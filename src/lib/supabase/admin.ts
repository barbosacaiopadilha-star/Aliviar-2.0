import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente com a service role key — nunca importável de código de cliente
// (o pacote `server-only` falha o build se isso acontecer). Só usado para
// operações que a Admin API do Supabase Auth exige (criar conta,
// redefinir senha, bloquear/desbloquear acesso de login) — nunca para
// leitura/escrita de dado de negócio, que sempre passa pelo cliente
// autenticado normal + RLS.
//
// Toda função que chama este cliente já deve ter passado por
// `requireRoleForAction("administrador")` antes — este cliente ignora RLS
// por definição (service role), então a autorização é inteiramente
// responsabilidade de quem chama.
export function createAdminSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias para operações administrativas.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
