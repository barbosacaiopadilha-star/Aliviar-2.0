import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { cleanupFixture, MATRIZ_CR, seedDeliveredCase } from "../apoio/apoio-curadoria-entregue";

/**
 * T-CR-1 · CADA CORTE NASCE PELO WRITER REAL, E PARA ONDE DEVE PARAR.
 *
 * Duas coisas são provadas por estágio: **o fato que o define existe** e **os
 * fatos posteriores não existem**. A segunda metade é a que pega fixture
 * generosa demais — um cenário que produz mais do que declara faz a Fila
 * classificar certo por acidente.
 *
 * E há uma prova de autoria que não é opcional: **quem reconhece o Perfil é a
 * paciente** (ADR-042). Até esta passagem, a fixture escrevia `VALIDATED`
 * direto em `priority_profiles` com a sessão do **Curador** — reintroduzindo,
 * em cenário sintético, a autoridade que a ADR removeu. Agora o ato passa por
 * `acknowledge_priority_profile`, cujo gate `is_patient_for_case` só ela
 * atravessa.
 */

const service = createAdminSupabaseClient();
const RAIZ = process.cwd();

async function contar(tabela: string, coluna: string, valor: string) {
  const { data, error } = await service.from(tabela).select(coluna).eq(coluna, valor);
  if (error) throw new Error(`${tabela}: ${error.message}`);
  return (data ?? []).length;
}

describe("T-CR-1 · a matriz CR, corte a corte", () => {
  it("a matriz declara os onze casos, com grupo e responsável", () => {
    expect(Object.keys(MATRIZ_CR)).toHaveLength(11);
    // CR-11 fica FORA da Fila, por decisão do contrato §10.1. CR-12 — a
    // entrega do motor ACE — saiu com o motor.
    expect(MATRIZ_CR["CR-11"].grupoDaFila).toBeNull();
    // E o corte do reconhecimento é dela, não do Curador.
    expect(MATRIZ_CR["CR-04"].ator).toBe("paciente");
    expect(MATRIZ_CR["CR-04"].fato).toContain("acknowledge_priority_profile");
  });

  /**
   * FIX-A1 · o bypass não pode voltar ao caminho canônico. Um teste de estado
   * não pegaria isso: `VALIDATED` escrito à mão e `VALIDATED` reconhecido por
   * ela são indistinguíveis na linha da tabela.
   */
  it("a fixture canônica não chama o bypass de validação", () => {
    const fonte = readFileSync(
      path.join(RAIZ, "tests/apoio/apoio-curadoria-entregue.ts"),
      "utf8",
    ).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

    expect(
      fonte,
      "fixtureValidarPerfil escreve VALIDATED direto, com a sessão do Curador — " +
        "é a autoridade que a ADR-042 removeu, e não pode voltar à cadeia canônica",
    ).not.toContain("fixtureValidarPerfil");
    expect(fonte, "o reconhecimento precisa passar pelo writer real").toContain(
      "acknowledge_priority_profile",
    );
  });

  it("CR-01 · Case sem acolhimento", { timeout: 180_000 }, async () => {
    const caso = await seedDeliveredCase({ estagio: "CR-01" });
    try {
      if (caso.estagio !== "CR-01") throw new Error(`estágio errado: ${caso.estagio}`);
      expect(await contar("consultation_records", "case_id", caso.caseId)).toBe(0);
      expect(await contar("priority_profiles", "case_id", caso.caseId)).toBe(0);
      expect(await contar("curated_selections", "case_id", caso.caseId)).toBe(0);
    } finally {
      await cleanupFixture(caso as never);
    }
  });

  it("CR-02 · Mapa preparado, encontro ainda não realizado", { timeout: 180_000 }, async () => {
    const caso = await seedDeliveredCase({ estagio: "CR-02" });
    if (caso.estagio !== "CR-02") throw new Error(`estágio errado: ${caso.estagio}`);
    try {
      const { data } = await service
        .from("consultation_records")
        .select("understanding_confirmed_at, meeting_held_at")
        .eq("case_id", caso.caseId)
        .single();
      expect(data?.understanding_confirmed_at, "o acolhimento precisa existir").toBeTruthy();
      expect(data?.meeting_held_at, "o encontro ainda não aconteceu").toBeNull();

      const { data: perfil } = await service
        .from("priority_profiles")
        .select("status")
        .eq("id", caso.priorityProfileId)
        .single();
      expect(perfil?.status, "o Perfil não pode nascer reconhecido").not.toBe("VALIDATED");
      expect(await contar("curated_selections", "case_id", caso.caseId)).toBe(0);
    } finally {
      await cleanupFixture(caso as never);
    }
  });

  it("CR-03 · encontro realizado, aguardando o reconhecimento dela", { timeout: 180_000 }, async () => {
    const caso = await seedDeliveredCase({ estagio: "CR-03" });
    if (caso.estagio !== "CR-03") throw new Error(`estágio errado: ${caso.estagio}`);
    try {
      const { data } = await service
        .from("consultation_records")
        .select("meeting_held_at")
        .eq("case_id", caso.caseId)
        .single();
      expect(data?.meeting_held_at, "o encontro precisa estar registrado").toBeTruthy();

      const { data: perfil } = await service
        .from("priority_profiles")
        .select("status, validated_at")
        .eq("id", caso.priorityProfileId)
        .single();
      expect(perfil?.validated_at, "o reconhecimento é dela, e ainda não veio").toBeNull();
      expect(await contar("curated_selections", "case_id", caso.caseId)).toBe(0);
    } finally {
      await cleanupFixture(caso as never);
    }
  });

  it("CR-04 · Perfil reconhecido POR ELA, e nada além disso", { timeout: 180_000 }, async () => {
    const caso = await seedDeliveredCase({ estagio: "CR-04" });
    if (caso.estagio !== "CR-04") throw new Error(`estágio errado: ${caso.estagio}`);
    try {
      const { data: perfil } = await service
        .from("priority_profiles")
        .select("status, validated_at")
        .eq("id", caso.priorityProfileId)
        .single();
      expect(perfil?.status).toBe("VALIDATED");
      expect(perfil?.validated_at).toBeTruthy();

      // FIX-A3 · nenhum fato posterior: reconhecer não é analisar.
      expect(await contar("curated_selections", "case_id", caso.caseId)).toBe(0);
      expect(await contar("curadoria_reports", "case_id", caso.caseId)).toBe(0);
      expect(await contar("patient_curadoria_decisions", "case_id", caso.caseId)).toBe(0);
    } finally {
      await cleanupFixture(caso as never);
    }
  });

  it("CR-05 · seleção salva, Relatório não emitido", { timeout: 180_000 }, async () => {
    const caso = await seedDeliveredCase({ estagio: "CR-05" });
    if (caso.estagio !== "CR-05") throw new Error(`estágio errado: ${caso.estagio}`);
    try {
      expect(await contar("curated_selections", "case_id", caso.caseId)).toBe(1);
      expect(caso.professionalDisplayNames).toHaveLength(3);
      expect(await contar("curadoria_reports", "case_id", caso.caseId)).toBe(0);
    } finally {
      await cleanupFixture(caso as never);
    }
  });

  it("CR-06 · Relatório emitido, não entregue", { timeout: 180_000 }, async () => {
    const caso = await seedDeliveredCase({ estagio: "CR-06" });
    if (caso.estagio !== "CR-06") throw new Error(`estágio errado: ${caso.estagio}`);
    try {
      const { data } = await service
        .from("curadoria_reports")
        .select("emitted_at, delivered_at")
        .eq("id", caso.reportId)
        .single();
      expect(data?.emitted_at, "emitido").toBeTruthy();
      expect(data?.delivered_at, "e ainda não entregue").toBeNull();
      expect(await contar("patient_curadoria_decisions", "case_id", caso.caseId)).toBe(0);
    } finally {
      await cleanupFixture(caso as never);
    }
  });

  it("CR-07 · entregue, e a decisão ainda é dela", { timeout: 180_000 }, async () => {
    const caso = await seedDeliveredCase({ estagio: "CR-07" });
    if (caso.estagio !== "CR-07") throw new Error(`estágio errado: ${caso.estagio}`);
    try {
      const { data } = await service
        .from("curadoria_reports")
        .select("delivered_at")
        .eq("id", caso.reportId)
        .single();
      expect(data?.delivered_at).toBeTruthy();
      expect(await contar("patient_curadoria_decisions", "case_id", caso.caseId)).toBe(0);
      expect(await contar("connection_records", "case_id", caso.caseId)).toBe(0);
    } finally {
      await cleanupFixture(caso as never);
    }
  });

  it("CR-08 · decisão CHOSEN, sem conexão automática", { timeout: 180_000 }, async () => {
    const caso = await seedDeliveredCase({ estagio: "CR-08" });
    if (caso.estagio !== "CR-08") throw new Error(`estágio errado: ${caso.estagio}`);
    try {
      const { data } = await service
        .from("patient_curadoria_decisions")
        .select("id, outcome, chosen_option_id")
        .eq("id", caso.decisionId)
        .single();
      expect(data?.outcome).toBe("CHOSEN");
      expect(data?.chosen_option_id, "escolher nomeia alguém").toBeTruthy();
      expect(
        await contar("connection_records", "case_id", caso.caseId),
        "decidir não abre acompanhamento — são fatos distintos",
      ).toBe(0);
    } finally {
      await cleanupFixture(caso as never);
    }
  });

  it("CR-09 · recusa legítima, sem opção escolhida", { timeout: 180_000 }, async () => {
    const caso = await seedDeliveredCase({ estagio: "CR-09" });
    if (caso.estagio !== "CR-09") throw new Error(`estágio errado: ${caso.estagio}`);
    try {
      const { data } = await service
        .from("patient_curadoria_decisions")
        .select("outcome, chosen_option_id")
        .eq("id", caso.decisionId)
        .single();
      expect(data?.outcome).toBe("NONE_OF_THEM");
      expect(data?.chosen_option_id, "recusar não escolhe ninguém").toBeNull();
    } finally {
      await cleanupFixture(caso as never);
    }
  });

  it("CR-10 · acompanhamento aberto DEPOIS da decisão", { timeout: 180_000 }, async () => {
    const caso = await seedDeliveredCase({ estagio: "CR-10" });
    if (caso.estagio !== "CR-10") throw new Error(`estágio errado: ${caso.estagio}`);
    try {
      expect(await contar("connection_records", "case_id", caso.caseId)).toBe(1);
      // A Connection é continuidade; ela não substitui nem cria a decisão.
      const { data: decisoes } = await service
        .from("patient_curadoria_decisions")
        .select("id")
        .eq("case_id", caso.caseId);
      expect(decisoes ?? [], "a decisão existe por si, e é única").toHaveLength(1);
      expect(decisoes![0]!.id).toBe(caso.decisionId);
    } finally {
      await cleanupFixture(caso as never);
    }
  });

  it("CR-11 · Case encerrado, sem entrega inventada", { timeout: 180_000 }, async () => {
    const caso = await seedDeliveredCase({ estagio: "CR-11" });
    if (caso.estagio !== "CR-11") throw new Error(`estágio errado: ${caso.estagio}`);
    try {
      const { data } = await service
        .from("cases")
        .select("status, closed_at")
        .eq("id", caso.caseId)
        .single();
      expect(data?.status).toBe("CANCELLED");
      expect(data?.closed_at).toBeTruthy();
      expect(await contar("curated_selections", "case_id", caso.caseId)).toBe(0);
      expect(await contar("curadoria_reports", "case_id", caso.caseId)).toBe(0);
    } finally {
      await cleanupFixture(caso as never);
    }
  });

});

/**
 * A discriminação é do TIPO — e isto é verificado pelo compilador, não em
 * runtime. Cada `@ts-expect-error` FALHA o typecheck se o campo passar a ser
 * acessível no estágio errado: enfraquecer a união derruba este bloco.
 */
describe("T-CR-1 · a união discriminada não deixa ler fato de estágio posterior", () => {
  // Nunca é CHAMADA: o compilador confere o corpo, o runtime não o executa.
  function guardasDeTipo(caso: import("../apoio/apoio-curadoria-entregue").CasoSintetico) {

    if (caso.estagio === "CR-04") {
      void caso.priorityProfileId;
      // @ts-expect-error · reportId não existe antes de CR-06
      void caso.reportId;
      // @ts-expect-error · decisionId não existe antes de CR-08
      void caso.decisionId;
    }
    if (caso.estagio === "CR-06") {
      void caso.reportId;
      // @ts-expect-error · decisionId não existe antes de CR-08
      void caso.decisionId;
    }
    if (caso.estagio === "CR-08") {
      void caso.decisionId;
      // @ts-expect-error · connectionId só existe em CR-10
      void caso.connectionId;
    }
    if (caso.estagio === "CR-10") {
      void caso.connectionId;
    }
    if (caso.estagio === "CR-01") {
      // @ts-expect-error · CR-01 não tem Perfil de Prioridades
      void caso.priorityProfileId;
    }

  }

  it("compila apenas o que existe em cada corte", () => {
    expect(typeof guardasDeTipo).toBe("function");
  });
});
