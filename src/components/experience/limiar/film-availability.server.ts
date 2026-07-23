import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Verifica se o asset local do filme está presente no deploy.
 * URLs remotas são consideradas disponíveis e validadas em runtime.
 */
export function isFilmAssetDeployed(filmSrc: string): boolean {
  if (/^https?:\/\//i.test(filmSrc)) {
    return true;
  }

  const relative = filmSrc.replace(/^\//, "");
  return existsSync(join(process.cwd(), "public", relative));
}
