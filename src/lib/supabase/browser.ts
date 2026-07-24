import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { DB_SCHEMA, getSupabaseEnv } from "./env";

export function createBrowserSupabaseClient(): SupabaseClient {
  const { url, anonKey } = getSupabaseEnv();

  return createBrowserClient(url, anonKey, { db: { schema: DB_SCHEMA } });
}
