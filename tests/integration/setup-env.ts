import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// Carrega .env.local manualmente (sem dependência extra) para os testes de
// integração terem NEXT_PUBLIC_SUPABASE_URL/ANON_KEY disponíveis. Só lê
// valores públicos já gerados por `npm run supabase:env` — nunca a service
// role key, que não é lida nem usada por nenhum teste aqui.
const envPath = path.resolve(__dirname, "../../.env.local");

if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  }
}
