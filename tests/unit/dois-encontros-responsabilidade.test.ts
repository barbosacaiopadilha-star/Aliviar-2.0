import { describe, expect, it } from "vitest";

import { resolveCurrentResponsible } from "@/modules/coa/journey-responsibility";
import { MOCK_RECORDS } from "@/modules/curadoria/cos/mock-records";
import type { CuradoriaRecord } from "@/modules/curadoria/cos/types";
import { buildJornada } from "@/modules/curadoria/jornada";

/**
 * TRILHA B · OS DOIS ENCONTROS E A PASSAGEM DE RESPONSABILIDADE.
 *
 * Decisão de produto: há dois encontros com o Curador. O primeiro alinha o que
 * importa para ela; o segundo entrega a Curadoria e é onde a decisão nasce.
 * **O Concierge assume depois da decisão — nunca antes.**
 *
 * O defeito que isto fecha: `inferPhaseFromCuradoria` alcança a fase `escolha`
 * apenas com `relatorio.emittedAt` — Curadoria preparada dentro da Aliviar,
 * sem entrega, sem o encontro e sem decisão. E `escolha` estava na lista do
 * Concierge. A paciente via o Concierge como responsável no momento em que o
 * trabalho ainda era todo do Curador.
 */

const base = Object.values(MOCK_RECORDS)[0]!;

function registro(patch: {
  understandingConfirmedAt?: string | null;
  validatedAt?: string | null;
  emittedAt?: string | null;
  deliveredAt?: string | null;
  presentedAt?: string | null;
  decisao?: CuradoriaRecord["devolutiva"]["decision"];
}): CuradoriaRecord {
  return {
    ...base,
    historia: {
      ...base.historia,
      understandingConfirmedAt: patch.understandingConfirmedAt ?? null,
    },
    validacao: patch.validatedAt
      ? { ...(base.validacao ?? ({} as NonNullable<CuradoriaRecord["validacao"]>)), validatedAt: patch.validatedAt }
      : null,
    relatorio: {
      ...base.relatorio,
      emittedAt: patch.emittedAt ?? null,
      deliveredAt: patch.deliveredAt ?? null,
    },
    devolutiva: {
      ...base.devolutiva,
      presentedAt: patch.presentedAt ?? null,
      decision: patch.decisao ?? null,
    },
  };
}

const responsavel = (record: CuradoriaRecord) =>
  resolveCurrentResponsible({ curadoriaRecord: record, curatorName: "Dra. Curadora" });

const T1 = "2026-07-10T10:00:00-03:00";
const T2 = "2026-07-20T09:00:00-03:00";
const T3 = "2026-07-21T16:00:00-03:00";
const T4 = "2026-07-22T10:00:00-03:00";

const DECISAO: NonNullable<CuradoriaRecord["devolutiva"]["decision"]> = {
  ...(base.devolutiva.decision ?? ({} as NonNullable<CuradoriaRecord["devolutiva"]["decision"]>)),
  outcome: "CHOSEN",
  chosenProfessionalId: "prof-1",
  decidedAt: T4,
};

describe("§20 · H · o Concierge NUNCA é responsável antes da decisão", () => {
  const antesDaDecisao: Array<[string, CuradoriaRecord]> = [
    ["nada aconteceu", registro({})],
    ["primeiro encontro concluído", registro({ understandingConfirmedAt: T1, validatedAt: T1 })],
    ["Curadoria preparada (emitida)", registro({ understandingConfirmedAt: T1, validatedAt: T1, emittedAt: T2 })],
    [
      "segundo encontro realizado, sem decisão",
      registro({ understandingConfirmedAt: T1, validatedAt: T1, emittedAt: T2, presentedAt: T3 }),
    ],
    [
      "conteúdo digital entregue, sem decisão",
      registro({ understandingConfirmedAt: T1, validatedAt: T1, emittedAt: T2, deliveredAt: T4 }),
    ],
  ];

  for (const [nome, record] of antesDaDecisao) {
    it(`${nome} ⇒ responsável é o CURADOR`, () => {
      const quem = responsavel(record);
      expect(quem.role, `${nome} entregou o caso ao Concierge cedo demais`).toBe("curador");
      expect(quem.role).not.toBe("concierge");
    });
  }

  it("o caso mais perigoso é o da emissão — era exatamente ele que quebrava", () => {
    // `emittedAt` sozinho levava à fase `escolha`, que estava na lista do
    // Concierge. Nada tinha sido entregue nem decidido.
    const soEmitido = registro({ understandingConfirmedAt: T1, validatedAt: T1, emittedAt: T2 });
    expect(soEmitido.relatorio.deliveredAt).toBeNull();
    expect(soEmitido.devolutiva.presentedAt).toBeNull();
    expect(soEmitido.devolutiva.decision).toBeNull();
    expect(responsavel(soEmitido).role).toBe("curador");
  });
});

describe("§20 · G · depois da decisão, o Concierge assume", () => {
  it("decisão registrada com caminho escolhido ⇒ Concierge", () => {
    const decidido = registro({
      understandingConfirmedAt: T1,
      validatedAt: T1,
      emittedAt: T2,
      presentedAt: T3,
      deliveredAt: T4,
      decisao: DECISAO,
    });
    expect(responsavel(decidido).role).toBe("concierge");
  });

  it("o handoff é DERIVADO da decisão — não há fato próprio, e não foi inventado", () => {
    const semDecisao = registro({ emittedAt: T2, presentedAt: T3, deliveredAt: T4 });
    const comDecisao = { ...semDecisao, devolutiva: { ...semDecisao.devolutiva, decision: DECISAO } };
    // A única coisa que muda entre os dois é a decisão.
    expect(responsavel(semDecisao).role).toBe("curador");
    expect(responsavel(comDecisao).role).toBe("concierge");
  });
});

describe("§20 · I/J · nenhum fato implica o seguinte", () => {
  it("I · `presentedAt` não implica `deliveredAt`", () => {
    const apresentado = registro({ emittedAt: T2, presentedAt: T3 });
    expect(apresentado.devolutiva.presentedAt).toBeTruthy();
    expect(apresentado.relatorio.deliveredAt).toBeNull();
    // E a régua não promete conteúdo.
    const dossie = buildJornada(apresentado).stages.find((s) => s.id === "DOSSIE")!;
    expect(dossie.description).not.toMatch(/disponível para você/i);
  });

  it("J · `deliveredAt` não implica decisão — e o Curador segue responsável", () => {
    const entregue = registro({ emittedAt: T2, deliveredAt: T4 });
    expect(entregue.devolutiva.decision).toBeNull();
    expect(responsavel(entregue).role).toBe("curador");
  });

  it("C · Curadoria preparada não significa encontro realizado", () => {
    const preparada = registro({ emittedAt: T2 });
    expect(preparada.devolutiva.presentedAt).toBeNull();
    expect(buildJornada(preparada).stages.find((s) => s.id === "REUNIAO")!.status).not.toBe(
      "CONCLUIDA",
    );
  });
});

describe("§20 · A/B · o primeiro encontro na régua", () => {
  it("A · antes de tudo, o próximo marco é o alinhamento com o Curador", () => {
    const inicio = registro({});
    const jornada = buildJornada(inicio);
    expect(jornada.currentStage).toBe("CONSULTA_INICIAL");
    expect(jornada.currentResponsible.role).toBe("curador");
  });

  it("B · com o Perfil reconhecido, a Curadoria entra em elaboração", () => {
    const alinhado = registro({ understandingConfirmedAt: T1, validatedAt: T1 });
    const perfil = buildJornada(alinhado).stages.find((s) => s.id === "PERFIL_DE_PRIORIDADES")!;
    expect(perfil.status).toBe("CONCLUIDA");
    expect(responsavel(alinhado).role).toBe("curador");
  });
});

describe("§11 · a guarda não pode ser removida", () => {
  it("a decisão é verificada ANTES da fase — é o fato mais específico", async () => {
    const { readFileSync } = await import("node:fs");
    const fonte = readFileSync("src/modules/coa/journey-responsibility.ts", "utf8");
    const codigo = fonte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    const guarda = codigo.indexOf("!input.curadoriaRecord.devolutiva.decision");
    const concierge = codigo.indexOf('phase === "acompanhamento"');
    expect(guarda, "a guarda da decisão sumiu").toBeGreaterThan(-1);
    expect(concierge).toBeGreaterThan(-1);
    expect(guarda, "a guarda da decisão caiu para depois da fase").toBeLessThan(concierge);
  });
});
