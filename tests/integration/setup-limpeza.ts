import { afterAll, beforeAll } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { limpar, snapshot, type Inventario } from "./limpeza/inventario";

/**
 * LIMPEZA AUTOMÁTICA POR ARQUIVO.
 *
 * Este arquivo é `setupFiles`: o Vitest o executa uma vez para CADA arquivo
 * da suíte, o que instala o par snapshot/limpeza em todos eles sem uma linha
 * de edição em teste nenhum — inclusive nos que ainda não existem.
 *
 * Escolha deliberada sobre a alternativa de corrigir o cleanup arquivo a
 * arquivo: um `afterAll` esquecido num arquivo novo volta a sujar o banco em
 * silêncio, e o esquecimento só aparece semanas depois. Aqui o padrão é
 * limpar; esquecer não é possível.
 *
 * `afterAll` roda mesmo quando o teste falha — resíduo de execução quebrada é
 * justamente o que mais se acumula.
 *
 * Exceção única: o seed da sessão manual (`SEED_MESA=1`) existe para DEIXAR
 * dados vivos. Nele a limpeza se desliga, e isso está dito no próprio seed.
 */

const semLimpeza = Boolean(process.env.SEED_MESA);

let inicial: Inventario | null = null;

beforeAll(async () => {
  if (semLimpeza) return;
  inicial = await snapshot(createAdminSupabaseClient());
}, 60_000);

afterAll(async () => {
  if (semLimpeza || !inicial) return;
  await limpar(createAdminSupabaseClient(), inicial);
}, 120_000);
