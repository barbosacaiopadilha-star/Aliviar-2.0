import { afterAll, beforeAll, expect } from "vitest";

/**
 * Limpeza automática por arquivo — mesma mecânica da suíte de integração
 * (`tests/integration/setup-limpeza.ts`), reutilizando o inventário da casa.
 *
 * Diferença única: os arquivos de gates PURAMENTE locais (unit com clients
 * falsos, componentes jsdom) não tocam o banco — para eles o par
 * snapshot/limpeza é pulado, para não exigir Supabase de pé onde ele não é
 * usado nem pagar duas varreduras de inventário por nada.
 */

function arquivoTocaOBanco(): boolean {
  const caminho = expect.getState().testPath ?? "";
  return caminho.includes(".integration.");
}

type Inventario = import("../integration/limpeza/inventario").Inventario;

let inicial: Inventario | null = null;

beforeAll(async () => {
  if (!arquivoTocaOBanco()) return;
  const { snapshot } = await import("../integration/limpeza/inventario");
  const { createAdminSupabaseClient } = await import("@/lib/supabase/admin");
  inicial = await snapshot(createAdminSupabaseClient());
}, 60_000);

afterAll(async () => {
  if (!inicial) return;
  const { limpar } = await import("../integration/limpeza/inventario");
  const { createAdminSupabaseClient } = await import("@/lib/supabase/admin");
  await limpar(createAdminSupabaseClient(), inicial);
}, 120_000);
