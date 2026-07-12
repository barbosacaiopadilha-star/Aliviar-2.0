import { createServerClient } from "@supabase/ssr";
import type { SetAllCookies } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "./env";

export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  const setAll: SetAllCookies = (cookiesToSet) => {
    try {
      cookiesToSet.forEach(({ name, value, options }) => {
        cookieStore.set(name, value, options);
      });
    } catch {
      // Ignorado em Server Components onde cookies são somente leitura.
    }
  };

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll,
    },
  });
}
