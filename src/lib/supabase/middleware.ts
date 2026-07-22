import { createServerClient } from "@supabase/ssr";

import { NextResponse, type NextRequest } from "next/server";

import {

  buildLoginRedirectUrl,

  buildPortalLoginRedirectUrl,

  resolveMiddlewareRouting,

  wouldCauseRedirectLoop,

} from "@/lib/auth/middleware-routing";



export async function updateSession(request: NextRequest) {

  let supabaseResponse = NextResponse.next({ request });



  const supabase = createServerClient(

    process.env.NEXT_PUBLIC_SUPABASE_URL!,

    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,

    {

      cookies: {

        getAll() {

          return request.cookies.getAll();

        },

        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {

          cookiesToSet.forEach(({ name, value }) => {

            request.cookies.set(name, value);

          });

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {

            supabaseResponse.cookies.set(name, value, options);

          });

        },

      },

    },

  );



  const {

    data: { user },

  } = await supabase.auth.getUser();



  const pathname = request.nextUrl.pathname;

  const routing = resolveMiddlewareRouting({

    pathname,

    hasUser: Boolean(user),

    searchParams: request.nextUrl.searchParams,

  });



  if (routing.action === "redirect_login") {

    const loginPath = buildLoginRedirectUrl(request.nextUrl.origin, routing.redirectPath);



    if (wouldCauseRedirectLoop(pathname, loginPath)) {

      return supabaseResponse;

    }



    const url = request.nextUrl.clone();

    url.pathname = "/login";

    url.searchParams.set("redirect", routing.redirectPath);

    return NextResponse.redirect(url);

  }



  if (routing.action === "redirect_portal_login") {

    const loginPath = buildPortalLoginRedirectUrl(routing.redirectPath);



    if (wouldCauseRedirectLoop(pathname, loginPath)) {

      return supabaseResponse;

    }



    const url = request.nextUrl.clone();

    url.pathname = "/portal/entrar";

    url.searchParams.set("redirect", routing.redirectPath);

    return NextResponse.redirect(url);

  }



  return supabaseResponse;

}


