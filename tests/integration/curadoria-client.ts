import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Consolidação estrutural 2026-07-24: os testes de integração falam com o
// MESMO schema que os clients de produção (`curadoria` — src/lib/supabase/
// env.ts). Antes, batiam no `public`, que é o schema da AliCIA: os 133
// testes passavam ou falhavam contra um banco que não era o do produto.
//
// O `schema` é passado como `string` (não literal) pelo mesmo motivo do
// cast em src/lib/supabase/admin.ts: o literal "curadoria" contaminaria o
// genérico do client e quebraria a assinatura dos repositórios, que
// declaram `SupabaseClient` plano. O schema é configuração de runtime,
// não contrato de tipo.
const SCHEMA: string = "curadoria";

export function createCuradoriaClient(url: string, key: string): SupabaseClient {
  return createClient(url, key, { db: { schema: SCHEMA } }) as SupabaseClient;
}
