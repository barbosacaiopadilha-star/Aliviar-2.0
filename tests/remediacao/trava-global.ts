import path from "node:path";

import { assertSupabaseLocal, lerArquivoEnv } from "../../scripts/env-guard.mjs";

/**
 * Global setup da suíte de remediação.
 *
 * Adquire a MESMA trava "integracao" de `tests/execucao-exclusiva.ts`: esta
 * suíte cria e apaga contas, Cases e seleções no mesmo Supabase local que o
 * E2E usa — rodá-las juntas contaminaria as duas. Usar o nome "integracao"
 * (em vez de inventar um terceiro) faz o E2E enxergar esta execução com o
 * mecanismo que ele já conhece, sem mudar uma linha fora desta suíte.
 *
 * Não instala baseline nem sentinela: a limpeza aqui é por arquivo
 * (`setup-limpeza-remediacao.ts`).
 */

function prepararAmbiente() {
  const raiz = path.resolve(__dirname, "../..");
  for (const arquivo of [".env.test.local", ".env.development.local"]) {
    for (const [chave, valor] of Object.entries(lerArquivoEnv(path.join(raiz, arquivo)))) {
      if (!process.env[chave]) process.env[chave] = valor;
    }
  }
  assertSupabaseLocal(process.env.NEXT_PUBLIC_SUPABASE_URL, "Suíte de gates de remediação");
}

export async function setup() {
  const { adquirirTrava } = await import("../execucao-exclusiva");
  adquirirTrava("integracao");
  prepararAmbiente();
}

export async function teardown() {
  const { devolverTrava } = await import("../execucao-exclusiva");
  devolverTrava("integracao");
}
