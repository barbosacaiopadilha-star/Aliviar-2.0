import { assertSupabaseCredential } from "./env-validation";

// Schema Postgres onde vive o app aliviar-conexao. No banco unificado
// (aliviar-2-prod) o `public` pertence ao produto de jornadas; o
// aliviar-conexao vive no schema `curadoria`. Todos os clientes Supabase
// abaixo usam este schema por padrão (precisa estar exposto no PostgREST).
// Anotado como `string`, e não inferido como o literal "curadoria", de
// propósito: o literal fazia o `createClient` estreitar o tipo do cliente
// para aquele schema específico, que então deixava de ser atribuível ao
// `SupabaseClient` (schema "public") declarado nos retornos — quebrando o
// build de produção (achado B1, MISSÃO 207). O schema é uma configuração de
// runtime, não parte do contrato de tipo.
export const DB_SCHEMA: string = "curadoria";

export type SupabaseEnvConfig = {
  url: string;
  anonKey: string;
};

export function getSupabaseEnv(): SupabaseEnvConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias.",
    );
  }

  assertSupabaseCredential("NEXT_PUBLIC_SUPABASE_ANON_KEY", anonKey);

  return { url, anonKey };
}
