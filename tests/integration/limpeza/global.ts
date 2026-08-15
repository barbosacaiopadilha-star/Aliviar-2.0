import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

import { assertSupabaseLocal, lerArquivoEnv } from "../../../scripts/env-guard.mjs";

import { contagens, snapshot } from "./inventario";

/**
 * A LINHA DE BASE DA EXECUÇÃO.
 *
 * `globalSetup` roda uma vez, antes de qualquer arquivo, e `teardown` uma vez
 * depois de todos — inclusive quando a suíte quebra no meio. É aqui que se
 * registra o estado com que a execução começou, para o teste sentinela poder
 * comparar contra algo real em vez de contra um número escrito à mão.
 *
 * O arquivo de baseline vive fora do Git (`*.local.json`) e é apagado ao fim.
 */

// C7R: a baseline é POR STACK, não por repositório. Com um arquivo único, uma
// rodada apontada para a stack isolada e qualquer invocação paralela contra a
// stack padrão compartilhavam o mesmo caminho — e o teardown de uma apagava a
// baseline da outra no meio da rodada (a sentinela caía com ENOENT sem que
// nenhum teste tivesse falhado). O sufixo pelo contêiner dá a cada stack o seu.
const SUFIXO_DA_STACK = (process.env.SUPABASE_DB_CONTAINER ?? "padrao").replace(/[^a-z0-9-]/gi, "_");
export const BASELINE_PATH = path.resolve(__dirname, `baseline.${SUFIXO_DA_STACK}.local.json`);

function prepararAmbiente() {
  const raiz = path.resolve(__dirname, "../../..");
  for (const arquivo of [".env.test.local", ".env.development.local"]) {
    for (const [chave, valor] of Object.entries(lerArquivoEnv(path.join(raiz, arquivo)))) {
      if (!process.env[chave]) process.env[chave] = valor;
    }
  }
  // A guarda antes da primeira chamada externa — a mesma de todo comando
  // local. Ambiente remoto não chega a ser tocado.
  assertSupabaseLocal(process.env.NEXT_PUBLIC_SUPABASE_URL, "Suíte de integração");
}

export async function setup() {
  // Exclusão mútua com o E2E: o teardown desta suíte restaura a baseline e
  // apagaria os dados de um fluxo em voo. A trava transforma "não rodar as
  // duas juntas" de lembrete em garantia.
  const { adquirirTrava } = await import("../../execucao-exclusiva");
  adquirirTrava("integracao");

  prepararAmbiente();
  const { createAdminSupabaseClient } = await import("@/lib/supabase/admin");
  const admin = createAdminSupabaseClient();

  const baseline = {
    inventario: await snapshot(admin),
    contagens: await contagens(admin),
  };

  writeFileSync(BASELINE_PATH, JSON.stringify(baseline), "utf-8");
}

export async function teardown() {
  // Rede de segurança: se um arquivo morreu antes do `afterAll` da limpeza,
  // o que ele criou some aqui. Não substitui a limpeza por arquivo — o
  // sentinela roda ANTES disto e é ele quem denuncia a falha.
  //
  // Exceção única — a mesma de `setup-limpeza.ts`: o seed da sessão manual
  // (`SEED_MESA=1`) existe para DEIXAR dados vivos. Limpar aqui desfaria o
  // propósito do seed depois de ele passar verde.
  if (process.env.SEED_MESA) {
    console.log("[limpeza global] SEED_MESA ativo — o seed existe para deixar dados vivos; nada é removido.");
    if (existsSync(BASELINE_PATH)) unlinkSync(BASELINE_PATH);
    return;
  }
  try {
    prepararAmbiente();
    const { createAdminSupabaseClient } = await import("@/lib/supabase/admin");
    const { limpar } = await import("./inventario");
    if (existsSync(BASELINE_PATH)) {
      const { readFileSync } = await import("node:fs");
      const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf-8"));
      await limpar(createAdminSupabaseClient(), baseline.inventario);
    }
  } finally {
    if (existsSync(BASELINE_PATH)) unlinkSync(BASELINE_PATH);
    const { devolverTrava } = await import("../../execucao-exclusiva");
    devolverTrava("integracao");
  }
}
