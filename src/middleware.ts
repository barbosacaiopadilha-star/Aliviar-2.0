import { NextResponse, type NextRequest } from "next/server";

import { createMiddlewareSupabaseClient } from "@/lib/supabase/middleware";
import { isDemoPortalPath, shouldBlockDemoPortals } from "@/modules/auth/demo-portals";
import { isPublicPath } from "@/modules/auth/public-paths";

// Responsabilidade do middleware: só a checagem OTIMISTA (existe sessão?) e a
// renovação do cookie de sessão a cada request. A checagem AUTORITATIVA de
// papel (admin/profissional/paciente) acontece em cada layout protegido via
// requireRole() (src/modules/auth/guard.ts) — route groups não aparecem na
// URL, então o middleware não tem como saber, só pelo pathname, a qual grupo
// uma rota pertence. Ver comentário em guard.ts.
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { supabase, getResponse } = createMiddlewareSupabaseClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Portais de demonstração ficam indisponíveis em produção — antes de
  // qualquer checagem de sessão, porque a trava não depende de quem está
  // logado (ver demo-portals.ts).
  if (isDemoPortalPath(pathname) && shouldBlockDemoPortals(process.env.VERCEL_ENV)) {
    // `status: 404` é obrigatório aqui: um rewrite sem ele serve a página de
    // "não encontrado" com status 200 (soft 404). O conteúdo ficaria correto,
    // mas buscadores indexariam a rota como válida e qualquer verificação
    // automática leria 200 como "no ar".
    return NextResponse.rewrite(new URL("/404", request.url), { status: 404 });
  }

  if (!user && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return getResponse();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|vtt)$).*)",
  ],
};
