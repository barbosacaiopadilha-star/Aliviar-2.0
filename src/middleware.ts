import { NextResponse, type NextRequest } from "next/server";

import { createMiddlewareSupabaseClient } from "@/lib/supabase/middleware";
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

  // A trava que devolvia 404 para os Portais em produção saiu na MISSÃO 209:
  // ela existia porque eles eram anônimos e mostravam dados de demonstração.
  // Agora leem o banco real e exigem sessão + papel (requireRole em cada rota,
  // RLS no banco) — a proteção mudou de "esconder" para "autorizar".

  if (!user && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return getResponse();
}

// `_vercel` fica de fora junto com os assets estáticos: é o prefixo que a
// própria plataforma serve (Analytics/Speed Insights), nunca uma rota do
// produto. Sem esta exclusão, `/_vercel/insights/script.js` cai na regra de
// "sem sessão → /login", devolve HTML no lugar de JavaScript, e o browser
// recusa o script por MIME type — a telemetria simplesmente não carrega para
// quem não está autenticado, que é justamente a Landing.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_vercel|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|vtt)$).*)",
  ],
};
