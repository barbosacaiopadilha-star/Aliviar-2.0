export const ALICIA_STUDIO_PATH_PREFIX = "/alicia/studio";

export function isAliciaStudioPath(pathname: string): boolean {
  return (
    pathname === ALICIA_STUDIO_PATH_PREFIX ||
    pathname.startsWith(`${ALICIA_STUDIO_PATH_PREFIX}/`)
  );
}

/** Studio is internal-only; unavailable on production builds and deploys. */
export function isAliciaStudioEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}
