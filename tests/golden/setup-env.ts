import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// Mesmo padrão de tests/integration/setup-env.ts: carrega .env.local
// manualmente (sem dependência extra), só para variáveis ainda não
// definidas no ambiente. CLAUDE_API_KEY é lida daqui quando presente
// localmente — nunca commitada, nunca logada.
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
