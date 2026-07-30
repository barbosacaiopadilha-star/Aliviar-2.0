import { describe, expect, it } from "vitest";

import { buildJornada } from "@/modules/curadoria/jornada";
import { MOCK_RECORDS } from "@/modules/curadoria/cos/mock-records";
import { derivePatientPending, patientStageHref } from "@/modules/paciente/next-action";
import type { PatientHomeState } from "@/modules/paciente/home-state";

const comCaso: PatientHomeState = { kind: "case_available", statusLabel: "Em curadoria" };

function jornadaDe(caseKey: string) {
  return buildJornada(MOCK_RECORDS[caseKey]!);
}

describe("toda pendência diz O QUE falta — nunca só que falta algo", () => {
  it("sem história: a pendência é a história, com o caminho até ela", () => {
    const pending = derivePatientPending({ homeState: { kind: "no_story" }, jornada: null });
    expect(pending.kind).toBe("action");
    if (pending.kind !== "action") return;
    expect(pending.action.title).toContain("sua história");
    expect(pending.action.cta?.href).toBe("/sua-historia");
  });

  it("rascunho: leva para continuar de onde parou, não para o começo", () => {
    const pending = derivePatientPending({ homeState: { kind: "draft" }, jornada: null });
    if (pending.kind !== "action") throw new Error("esperava ação");
    expect(pending.action.cta?.href).toBe("/sua-historia/continuar");
  });

  it("nenhuma pendência usa a frase genérica que motivou esta correção", () => {
    const estados: { homeState: PatientHomeState; jornada: ReturnType<typeof buildJornada> | null }[] = [
      { homeState: { kind: "no_story" }, jornada: null },
      { homeState: { kind: "draft" }, jornada: null },
      { homeState: { kind: "submitted_without_case" }, jornada: null },
      ...Object.keys(MOCK_RECORDS).map((key) => ({ homeState: comCaso, jornada: jornadaDe(key) })),
    ];

    for (const entrada of estados) {
      const pending = derivePatientPending(entrada);
      const texto =
        pending.kind === "action"
          ? `${pending.action.title} ${pending.action.why}`
          : pending.message;

      expect(texto.toLowerCase()).not.toContain("informação adicional");
      expect(texto.toLowerCase()).not.toContain("aguardando informação");
      expect(texto.toLowerCase()).not.toContain("pendência");
    }
  });
});

describe("toda pendência tem destino — ou declara que acontece na conversa", () => {
  it("nunca existe um terceiro caso: ou há link, ou o texto diz que é conversa", () => {
    for (const key of Object.keys(MOCK_RECORDS)) {
      const pending = derivePatientPending({ homeState: comCaso, jornada: jornadaDe(key) });
      if (pending.kind !== "action") continue;

      const { cta, happensInConversation, title } = pending.action;

      // A invariante, como XOR: ou tem destino, ou é conversa declarada.
      // Nunca os dois (o link contradiria a conversa), nunca nenhum (é o bug).
      expect(
        Boolean(cta) !== happensInConversation,
        `pendência ambígua — deveria ter destino OU ser conversa declarada: ${title}`,
      ).toBe(true);

      if (cta) {
        expect(cta.href.startsWith("/"), `link relativo esperado: ${cta.href}`).toBe(true);
        expect(cta.label.toLowerCase()).not.toBe("continuar");
      }
    }
  });

  it("validar o Perfil não ganha botão — o ato tem liturgia (Fundamentos §10)", () => {
    // Um caso cuja etapa aguardando é o Perfil de Prioridades.
    const jornada = Object.keys(MOCK_RECORDS)
      .map((key) => jornadaDe(key))
      .find((j) => j.stages.some((s) => s.id === "PERFIL_DE_PRIORIDADES" && s.status === "AGUARDANDO_VOCE"));

    expect(jornada, "nenhum mock cobre o Perfil aguardando o paciente").toBeDefined();
    const pending = derivePatientPending({ homeState: comCaso, jornada: jornada! });
    if (pending.kind !== "action") throw new Error("esperava ação");
    expect(pending.action.cta).toBeNull();
    expect(pending.action.title).toContain("prioridades");
  });

  it("escolher entre os três caminhos tem destino real", () => {
    const jornada = Object.keys(MOCK_RECORDS)
      .map((key) => jornadaDe(key))
      .find((j) => j.stages.some((s) => s.id === "ESCOLHA" && s.status === "AGUARDANDO_VOCE"));

    if (!jornada) return; // nenhum mock nesse ponto — nada a afirmar
    const pending = derivePatientPending({ homeState: comCaso, jornada });
    if (pending.kind !== "action") throw new Error("esperava ação");
    expect(pending.action.cta?.href).toBe("/paciente/curadoria");
  });
});

describe("quando nada depende dela, o silêncio é declarado", () => {
  it("diz com quem o caso está, e o que vem depois", () => {
    for (const key of Object.keys(MOCK_RECORDS)) {
      const pending = derivePatientPending({ homeState: comCaso, jornada: jornadaDe(key) });
      if (pending.kind !== "nothing") continue;
      expect(pending.message).toContain("Nada depende de você");
      expect(pending.whatHappensNext.length).toBeGreaterThan(10);
    }
  });

  it("história enviada sem Caso: nenhuma cobrança, e o que vem a seguir é dito", () => {
    const pending = derivePatientPending({
      homeState: { kind: "submitted_without_case" },
      jornada: null,
    });
    expect(pending.kind).toBe("nothing");
    if (pending.kind !== "nothing") return;
    expect(pending.whatHappensNext).toContain("Curador");
  });
});

describe("o vocabulário do paciente continua protegido", () => {
  it("nenhuma pendência traz score, ranking, protocolo ou nome de fase interna", () => {
    const proibidos = ["score", "ranking", "protocolo", "curadoria técnica", "devolutiva", "filtro"];

    for (const key of Object.keys(MOCK_RECORDS)) {
      const pending = derivePatientPending({ homeState: comCaso, jornada: jornadaDe(key) });
      const texto = (
        pending.kind === "action"
          ? `${pending.action.title} ${pending.action.why} ${pending.action.whatHappensNext}`
          : `${pending.message} ${pending.whatHappensNext}`
      ).toLowerCase();

      for (const termo of proibidos) {
        expect(texto, `vocabulário interno vazou: ${termo}`).not.toContain(termo);
      }
    }
  });
});

describe("a régua só vira link onde existe onde chegar", () => {
  it("etapas sem destino não fingem ter um", () => {
    expect(patientStageHref("PERFIL_DE_PRIORIDADES")).toBeUndefined();
    expect(patientStageHref("CURADORIA")).toBeUndefined();
    expect(patientStageHref("REUNIAO")).toBeUndefined();
  });

  it("etapas com destino apontam para uma rota do paciente", () => {
    expect(patientStageHref("CONSULTA_INICIAL")).toBe("/sua-historia");
    expect(patientStageHref("ESCOLHA")).toBe("/paciente/curadoria");
    expect(patientStageHref("DOSSIE")).toBe("/paciente/curadoria");
  });
});
