import { createServerClient } from "@supabase/ssr";
import type { SetAllCookies } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv } from "./env";

export type MiddlewareSupabase = {
  supabase: SupabaseClient;
  /** Chamar depois de qualquer operação de auth para obter a resposta com os cookies renovados. */
  getResponse: () => NextResponse;
};

/**
 * Client Supabase para uso em middleware.ts. Diferente do client de server
 * component/action (src/lib/supabase/server.ts): aqui os cookies precisam ser
 * espelhados tanto na request (para o resto do pipeline nesta mesma
 * requisição) quanto na response (para o navegador receber o cookie
 * renovado) — é o padrão recomendado pelo @supabase/ssr para middleware.
 */
export function createMiddlewareSupabaseClient(request: NextRequest): MiddlewareSupabase {
  const { url, anonKey } = getSupabaseEnv();

  let response = NextResponse.next({ request });

  const setAll: SetAllCookies = (cookiesToSet) => {
    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
    response = NextResponse.next({ request });
    cookiesToSet.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options),
    );
  };

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll,
    },
  });

  return { supabase, getResponse: () => response };
}
