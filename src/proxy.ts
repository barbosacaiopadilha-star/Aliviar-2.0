import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/workspace/:path*",
    "/patients/:path*",
    "/journeys/:path*",
    "/login",
    "/portal/:path*",
    "/curador/:path*",
  ],
};
