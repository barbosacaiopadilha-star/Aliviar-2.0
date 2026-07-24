import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com service role — somente server-side (health/readiness).
 * Nunca expor ao browser. Usado apenas para probes de infraestrutura.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
