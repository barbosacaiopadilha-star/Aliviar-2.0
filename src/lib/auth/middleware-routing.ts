export const PROTECTED_ROUTE_PREFIXES = [
  "/workspace",
  "/patients",
  "/journeys",
  "/curador",
  "/operacao",
  "/admin",
] as const;

export const PATIENT_PORTAL_PREFIX = "/portal";

export const PATIENT_PORTAL_PUBLIC_PATHS = ["/portal/entrar"] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isPatientPortalPath(pathname: string): boolean {
  return pathname === PATIENT_PORTAL_PREFIX || pathname.startsWith(`${PATIENT_PORTAL_PREFIX}/`);
}

export function isPatientPortalPublicPath(pathname: string): boolean {
  return PATIENT_PORTAL_PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export type MiddlewareRoutingDecision =
  | { action: "continue" }
  | { action: "redirect_login"; redirectPath: string }
  | { action: "redirect_portal_login"; redirectPath: string };

export function resolveMiddlewareRouting(input: {
  pathname: string;
  hasUser: boolean;
  searchParams: URLSearchParams;
}): MiddlewareRoutingDecision {
  if (isProtectedPath(input.pathname) && !input.hasUser) {
    return {
      action: "redirect_login",
      redirectPath: input.pathname,
    };
  }

  if (
    isPatientPortalPath(input.pathname) &&
    !isPatientPortalPublicPath(input.pathname) &&
    !input.hasUser
  ) {
    return {
      action: "redirect_portal_login",
      redirectPath: input.pathname,
    };
  }

  return { action: "continue" };
}

export function buildLoginRedirectUrl(origin: string, protectedPath: string): string {
  const url = new URL("/login", origin);
  url.searchParams.set("redirect", protectedPath);
  return url.pathname + url.search;
}

export function buildPortalLoginRedirectUrl(protectedPath: string): string {
  const url = new URL("/portal/entrar", "http://localhost");
  url.searchParams.set("redirect", protectedPath);
  return url.pathname + url.search;
}

export function wouldCauseRedirectLoop(fromPath: string, toPath: string): boolean {
  const normalize = (path: string) => path.split("?")[0];
  return normalize(fromPath) === normalize(toPath);
}
