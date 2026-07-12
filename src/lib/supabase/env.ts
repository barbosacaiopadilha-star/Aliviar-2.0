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

  return { url, anonKey };
}
