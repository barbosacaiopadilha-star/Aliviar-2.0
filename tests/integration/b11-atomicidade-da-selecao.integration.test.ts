import { describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { cleanupFixture, seedDeliveredCase } from "../apoio/apoio-curadoria-entregue";

/**
 * BLOCO 11 · §7 — A SELEÇÃO É UM ATO, NÃO UMA ACUMULAÇÃO.
 *
 * O D-6 tornou o rascunho da Mesa sobrevivente à troca de etapa, e isso levanta
 * imediatamente a pergunta que importa: **um rascunho que dura vira fato?**
 * Não. Estado em memória é trabalho do Curador; fato é o que o writer grava
 * quando ele confirma. Entre os dois não existe meio-termo gravado.
 *
 * Esta suíte prova os dois lados sobre o banco REAL:
 *  - **antes** da confirmação — o Case existe, e nada da seleção existe;
 *  - **depois** — existe exatamente uma seleção, com exatamente três opções,
 *    justificativa do conjunto não vazia e autoria registrada.
 *
 * O corte CR-04 é o Case com o Perfil já reconhecido pela paciente e nenhuma
 * seleção; o CR-05 é o mesmo Case depois do ato. A distância entre os dois é
 * exatamente o que esta suíte mede.
 */

const service = createAdminSupabaseClient();

async function linhas(tabela: string, coluna: string, valor: string) {
  const { data, error } = await service.from(tabela).select("*").eq(coluna, valor);
  if (error) throw new Error(`${tabela}.${coluna}: ${error.message}`);
  return data ?? [];
}

describe("§7 · antes da confirmação, nada da seleção existe", () => {
  it("CR-04 — Perfil reconhecido, e o banco não tem seleção, relatório, decisão nem conexão", async () => {
    const caso = await seedDeliveredCase({ estagio: "CR-04" });
    if (caso.estagio !== "CR-04") throw new Error(`estágio errado: ${caso.estagio}`);
    try {
      // O Case é real: se este ancoradouro falhar, as ausências abaixo seriam
      // verdadeiras por vacuidade — provariam que a fixture não nasceu.
      expect(await linhas("cases", "id", caso.caseId)).toHaveLength(1);
      expect(caso.priorityProfileId, "o corte CR-04 exige o Perfil aberto").toBeTruthy();

      const selecoes = await linhas("curated_selections", "case_id", caso.caseId);
      expect(selecoes, "havia seleção gravada antes de o Curador confirmar").toHaveLength(0);

      for (const tabela of ["patient_curadoria_decisions", "connection_records"]) {
        expect(
          await linhas(tabela, "case_id", caso.caseId),
          `${tabela} tinha linha antes da seleção existir`,
        ).toHaveLength(0);
      }

      // Sem seleção não há relatório: as opções penduram na seleção, então a
      // ausência da âncora é a ausência de todas elas.
      expect(selecoes).toHaveLength(0);
    } finally {
      await cleanupFixture(caso as never);
    }
  });
});

describe("§7 · depois da confirmação, o ato é um só", () => {
  it("CR-05 — exatamente uma seleção, três opções, justificativa e autoria", async () => {
    const caso = await seedDeliveredCase({ estagio: "CR-05" });
    if (caso.estagio !== "CR-05") throw new Error(`estágio errado: ${caso.estagio}`);
    try {
      const selecoes = await linhas("curated_selections", "case_id", caso.caseId);
      expect(selecoes, "confirmar duas vezes gravaria duas seleções").toHaveLength(1);

      const selecao = selecoes[0] as Record<string, unknown>;
      expect(selecao.id).toBe(caso.curatedSelectionId);

      // A justificativa do conjunto não é decoração: é a regra do Método que
      // impede três opções soltas de passarem por Curadoria.
      expect(
        String(selecao.composition_rationale ?? "").trim(),
        "seleção gravada sem justificativa da composição",
      ).not.toBe("");

      // Autoria: a seleção é de um Curador com nome, nunca do sistema.
      expect(selecao.selected_by, "seleção sem autor").toBeTruthy();

      const opcoes = await linhas("curated_selection_options", "curated_selection_id", caso.curatedSelectionId);
      expect(opcoes, "a Curadoria são três caminhos — nem dois, nem quatro").toHaveLength(3);

      const profissionais = new Set(
        opcoes.map((opcao) => String((opcao as Record<string, unknown>).professional_profile_id)),
      );
      expect(profissionais.size, "o mesmo profissional entrou duas vezes").toBe(3);
    } finally {
      await cleanupFixture(caso as never);
    }
  });

  it("repetir o corte não duplica: cada Case tem a sua seleção, e uma só", async () => {
    const primeiro = await seedDeliveredCase({ estagio: "CR-05" });
    const segundo = await seedDeliveredCase({ estagio: "CR-05" });
    try {
      expect(primeiro.caseId).not.toBe(segundo.caseId);
      for (const caso of [primeiro, segundo]) {
        expect(
          await linhas("curated_selections", "case_id", caso.caseId),
          "um Case ficou com mais de uma seleção",
        ).toHaveLength(1);
      }
    } finally {
      await cleanupFixture(segundo as never);
      await cleanupFixture(primeiro as never);
    }
  });
});
