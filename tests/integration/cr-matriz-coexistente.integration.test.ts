import { describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import {
  cleanupFixture,
  ESTAGIOS_COEXISTENTES,
  MATRIZ_CR,
  seedDeliveredCase,
  semearMatrizCoexistente,
} from "../apoio/apoio-curadoria-entregue";

/**
 * T-12-5 · A BASELINE VOLTA — e é medida por FAMÍLIA, não por total.
 *
 * O banco local carrega dívida histórica (centenas de contas sintéticas de
 * execuções antigas). Um total global esconderia resíduo novo dentro dela: é
 * por isso que as contas são contadas por PREFIXO e os fatos por tabela.
 *
 * A auditoria é append-only: pode crescer por fato legítimo da própria
 * semeadura, e **nunca** encolher. Cleanup que apaga trilha é o defeito que
 * este critério existe para pegar.
 */

const service = createAdminSupabaseClient();

/** Toda leitura falha explicitamente: erro silencioso vira baseline falsa. */
async function contarTabela(tabela: string): Promise<number> {
  const { count, error } = await service.from(tabela).select("*", { count: "exact", head: true });
  if (error) throw new Error(`${tabela}: ${error.message}`);
  return count ?? 0;
}

async function contarPrefixo(prefixo: string): Promise<number> {
  let pagina = 1;
  let achados = 0;
  for (;;) {
    const { data, error } = await service.auth.admin.listUsers({ page: pagina, perPage: 1000 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    const usuarios = data?.users ?? [];
    achados += usuarios.filter((u) => (u.email ?? "").startsWith(prefixo)).length;
    if (usuarios.length < 1000) return achados;
    pagina += 1;
  }
}

/** As treze famílias do contrato §11, cada uma lida por si. */
const FAMILIAS = [
  "cases",
  "patient_stories",
  "consultation_records",
  "priority_profiles",
  "professional_profiles",
  "curated_selections",
  "curadoria_reports",
  "final_curadoria_deliveries",
  "patient_curadoria_decisions",
  "connection_records",
  "connection_events",
  "ace_executions",
  "patient_documents",
] as const;

type Baseline = {
  familias: Record<string, number>;
  contasPaciente: number;
  contasAdmin: number;
  contasLegado: number;
  auditoria: number;
};

async function medir(): Promise<Baseline> {
  const familias: Record<string, number> = {};
  for (const tabela of FAMILIAS) familias[tabela] = await contarTabela(tabela);
  return {
    familias,
    contasPaciente: await contarPrefixo("connection-e2e-patient-"),
    contasAdmin: await contarPrefixo("connection-e2e-admin-"),
    contasLegado: await contarPrefixo("h4-legado-"),
    auditoria: await contarTabela("audit_logs"),
  };
}

function exigirBaseline(antes: Baseline, depois: Baseline, contexto: string) {
  for (const tabela of FAMILIAS) {
    expect(
      depois.familias[tabela],
      `${contexto}: ${tabela} ficou com resíduo (${antes.familias[tabela]} → ${depois.familias[tabela]})`,
    ).toBe(antes.familias[tabela]);
  }
  expect(depois.contasPaciente, `${contexto}: contas de paciente`).toBe(antes.contasPaciente);
  expect(depois.contasAdmin, `${contexto}: contas de admin`).toBe(antes.contasAdmin);
  expect(depois.contasLegado, `${contexto}: contas do legado`).toBe(antes.contasLegado);
  // Append-only: cresce por fato legítimo, nunca encolhe.
  expect(depois.auditoria, `${contexto}: a trilha encolheu`).toBeGreaterThanOrEqual(
    antes.auditoria,
  );
}

describe("B11-FIX-B · dez casos coexistentes, e a baseline de volta", () => {
  it(
    "T-12-5 · CR-01..CR-10 coexistem, cada um no seu fato, e somem juntos",
    { timeout: 600_000 },
    async () => {
      const antes = await medir();

      const matriz = await semearMatrizCoexistente();
      try {
        // Coexistência: dez Cases DISTINTOS vivos na mesma leitura.
        expect(new Set(matriz.caseIds).size, "os dez Cases precisam ser distintos").toBe(10);
        expect(
          (await contarTabela("cases")) - antes.familias.cases!,
          "dez Cases vivos ao mesmo tempo",
        ).toBe(10);

        // Cada um continua sendo o que declarou ser — e a ordem de criação foi
        // INVERTIDA, então classificação por ordem apareceria aqui.
        for (const estagio of ESTAGIOS_COEXISTENTES) {
          const caso = matriz.casos[estagio];
          expect(caso.estagio, `${estagio} mudou de estágio na coexistência`).toBe(estagio);
          expect(MATRIZ_CR[estagio].grupoDaFila, `${estagio} precisa ter grupo`).not.toBeNull();
        }

        // E os fatos que separam os grupos continuam separados.
        const semAcolhimento = await service
          .from("consultation_records")
          .select("case_id")
          .eq("case_id", matriz.casos["CR-01"].caseId);
        expect(semAcolhimento.data ?? [], "CR-01 não pode ter acolhimento").toHaveLength(0);

        const comDecisao = await service
          .from("patient_curadoria_decisions")
          .select("id")
          .eq("case_id", matriz.casos["CR-08"].caseId);
        expect(comDecisao.data ?? [], "CR-08 decidiu").toHaveLength(1);

        const semDecisao = await service
          .from("patient_curadoria_decisions")
          .select("id")
          .eq("case_id", matriz.casos["CR-07"].caseId);
        expect(semDecisao.data ?? [], "CR-07 ainda não decidiu").toHaveLength(0);
      } finally {
        await matriz.limpar();
      }

      exigirBaseline(antes, await medir(), "volta 1");
    },
  );

  it(
    "duas voltas consecutivas devolvem a MESMA baseline",
    { timeout: 900_000 },
    async () => {
      const antes = await medir();

      for (const volta of [1, 2]) {
        const matriz = await semearMatrizCoexistente();
        try {
          expect(new Set(matriz.caseIds).size, `volta ${volta}`).toBe(10);
        } finally {
          await matriz.limpar();
        }
        exigirBaseline(antes, await medir(), `volta ${volta}`);
      }
    },
  );

  it(
    "falha no meio da semeadura limpa o que já nasceu, e o erro original sobrevive",
    { timeout: 600_000 },
    async () => {
      const antes = await medir();
      const criados: Array<{ caseId: string }> = [];

      const explosao = new Error("falha controlada depois de CR-05");
      await expect(
        (async () => {
          try {
            for (const estagio of ["CR-10", "CR-09", "CR-08", "CR-07", "CR-06"] as const) {
              const caso = await seedDeliveredCase({ estagio });
              criados.push(caso);
            }
            throw explosao;
          } finally {
            for (const caso of [...criados].reverse()) {
              await cleanupFixture(caso as never);
            }
          }
        })(),
      ).rejects.toThrow("falha controlada depois de CR-05");

      expect(criados.length, "a semeadura precisa ter avançado antes de falhar").toBe(5);
      exigirBaseline(antes, await medir(), "falha intermediária");
    },
  );

  it("CR-11 · Case encerrado, semeado de fato", { timeout: 300_000 }, async () => {
    const antes = await medir();
    const caso = await seedDeliveredCase({ estagio: "CR-11" });
    try {
      const { data } = await service
        .from("cases")
        .select("status")
        .eq("id", caso.caseId)
        .single();
      expect(data?.status).toBe("CANCELLED");
      expect(MATRIZ_CR["CR-11"].grupoDaFila, "encerrado fica fora da Fila").toBeNull();
    } finally {
      await cleanupFixture(caso as never);
    }
    exigirBaseline(antes, await medir(), "CR-11");
  });
});
