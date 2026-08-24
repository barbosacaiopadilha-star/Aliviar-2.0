import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { detectAlerts } from "@/modules/curadoria/cos/conduction";
import { buildMemory, runReconstructionTest } from "@/modules/curadoria/cos/memory";
import { MOCK_RECORDS } from "@/modules/curadoria/cos/mock-records";
import type { CuradoriaRecord } from "@/modules/curadoria/cos/types";

/**
 * M3 — O COS OPERA PELAS FONTES VIGENTES (executa a ADR-042).
 *
 * Guardas de texto + comportamento: o Motor de Condução, a Memória e as
 * superfícies do Curador não leem mais `priority_weights`,
 * `compatibility_analyses` nem derivados (score, banda, alignment).
 */

/** Comentário que EXPLICA a virada cita o vocabulário antigo de propósito. */
function semComentarios(fonte: string): string {
  return fonte
    .split("\n")
    .filter((linha) => {
      const limpa = linha.trimStart();
      return (
        !limpa.startsWith("//") &&
        !limpa.startsWith("*") &&
        !limpa.startsWith("/*") &&
        !limpa.startsWith("{/*")
      );
    })
    .join("\n");
}

const ler = (relativo: string) =>
  semComentarios(readFileSync(join(process.cwd(), relativo), "utf8"));

const joaquim = MOCK_RECORDS["caso-2038"]!;

describe("O record do COS não carrega dados legados", () => {
  const repo = ler("src/modules/curadoria/cos/repository.ts");

  it("não consulta priority_weights, compatibility_analyses nem criterion_results", () => {
    for (const proibido of [
      '"priority_weights"',
      '"compatibility_analyses"',
      '"compatibility_criterion_results"',
      "internal_score",
    ]) {
      expect(repo.includes(proibido), proibido).toBe(false);
    }
  });

  it("a elegibilidade e as leituras vêm da mesma fonte da Mesa", () => {
    expect(repo).toContain("loadMesaCruzamento");
  });

  it("o tipo entregue a conduct() não expõe analyses, score nem banda", () => {
    expect("analyses" in joaquim.curadoriaTecnica).toBe(false);
    expect("computedAt" in joaquim.curadoriaTecnica).toBe(false);
    expect("weights" in joaquim.prioridades).toBe(false);
    expect(JSON.stringify(joaquim).toLowerCase()).not.toMatch(/internalscore|"band"/);
  });

  it("nomes vêm da fonte canônica do record", () => {
    expect(joaquim.curadoriaTecnica.professionalNames["prof-114"]).toBe("Dra. Beatriz Fontenelle");
  });
});

describe("Coerência COS × Mesa", () => {
  it("os números dos alertas são os da elegibilidade da Mesa, nunca outro universo", () => {
    for (const eligible of [0, 1, 2, 3, 4]) {
      const record: CuradoriaRecord = {
        ...joaquim,
        curadoriaTecnica: {
          ...joaquim.curadoriaTecnica,
          elegibilidade: { found: 6, awaitingArea: 0, eligible, eliminated: 6 - eligible, pendingInfo: 0 },
          leituras: joaquim.curadoriaTecnica.leituras.slice(0, eligible),
        },
      };
      const alerts = detectAlerts(record);
      if (eligible === 0) {
        expect(alerts.some((a) => a.code === "E-01")).toBe(true);
      } else if (eligible < 3) {
        const e02 = alerts.find((a) => a.code === "E-02");
        expect(e02?.detail).toContain(`${eligible} profissiona`);
      } else {
        expect(alerts.some((a) => a.code === "E-01" || a.code === "E-02")).toBe(false);
      }
    }
  });

  it("pendente de verificação não é contado como elegível nem como eliminado definitivo", () => {
    const record: CuradoriaRecord = {
      ...joaquim,
      curadoriaTecnica: {
        ...joaquim.curadoriaTecnica,
        elegibilidade: { found: 4, awaitingArea: 0, eligible: 0, eliminated: 1, pendingInfo: 3 },
        leituras: [],
      },
    };
    const alert = detectAlerts(record).find((a) => a.code === "E-01");
    expect(alert?.detail).toContain("3 pendentes");
  });
});

describe("A Memória não carrega o modelo aposentado", () => {
  it("linha do tempo e reconstrução sem score, banda ou pontos", () => {
    for (const record of Object.values(MOCK_RECORDS)) {
      const texto = JSON.stringify([buildMemory(record), runReconstructionTest(record)]).toLowerCase();
      expect(texto).not.toMatch(/internalscore|coveredweight|\bscore\b|banda|\d+ pontos/);
    }
  });

  it("a reconstrução responde pela leitura do Motor", () => {
    const leitura = runReconstructionTest(joaquim).find((entry) =>
      entry.question.includes("leitura do Motor"),
    );
    expect(leitura?.answered).toBe(true);
    expect(leitura?.answer).toContain("sem nota");
  });
});

describe("Superfícies do Curador sem o legado", () => {
  // CORTE DE 24/08 · o MesaPriorityPanel saiu com substituto vivo: ele
  // duplicava, no aside, a etapa Mapa de Prioridades da própria Mesa. A
  // guarda contra pesos passa a valer sobre quem ficou com o papel.
  it("MapaPrioridadesPanel não lê nem exibe pesos", () => {
    const painel = ler("src/components/curadoria/mesa/mapa-prioridades-panel.tsx");
    for (const proibido of ["weight", "priority_weights", "PesoRecord", "pontos"]) {
      expect(painel.includes(proibido), proibido).toBe(false);
    }
  });

  it("as páginas do Case não usam analyses para nomes", () => {
    for (const relativo of [
      "src/app/portal-curador/casos/[id]/page.tsx",
      "src/app/portal-curador/casos/[id]/[etapa]/page.tsx",
      "src/app/portal-curador/casos/[id]/curadoria_tecnica/page.tsx",
    ]) {
      expect(ler(relativo), relativo).not.toContain(".analyses");
    }
  });

  // Item 1.7 (P20): a guarda "a página de prioridades da paciente fala níveis,
  // nunca pontos" lia `src/app/portal-paciente/prioridades/page.tsx` —
  // superfície morta, interceptada por redirect permanente e removida por este
  // pacote. A página viva do Perfil dela é `/paciente/perfil`, coberta pela
  // varredura de vocabulário de `unificacao-experiencia.test.ts`.
});
