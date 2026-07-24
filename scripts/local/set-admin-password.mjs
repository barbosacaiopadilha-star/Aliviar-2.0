/**
 * Sincroniza ADMIN_NEW_PASSWORD com o usuário admin no Supabase Auth.
 * Compatível com chaves sb_secret_* (não-JWT) via header apikey.
 */
import { ADMIN_USER_ID, loadValidationEnv } from "./validation-lib.mjs";

async function main() {
  const env = loadValidationEnv();

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.ADMIN_NEW_PASSWORD) {
    console.error("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e ADMIN_NEW_PASSWORD são obrigatórios.");
    process.exit(2);
  }

  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${ADMIN_USER_ID}`, {
    method: "PUT",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password: env.ADMIN_NEW_PASSWORD }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`SET_ADMIN_PASSWORD_FAILED:${response.status}:${body.slice(0, 200)}`);
    process.exit(1);
  }

  console.log("SET_ADMIN_PASSWORD_OK");
}

main().catch((error) => {
  console.error(`SET_ADMIN_PASSWORD_FATAL:${error.message}`);
  process.exit(1);
});
