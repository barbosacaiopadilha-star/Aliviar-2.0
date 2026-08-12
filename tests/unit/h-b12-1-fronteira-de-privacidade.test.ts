import { describe, expect, it } from "vitest";

import {
  fatosDoRegistro,
  type FatosDaFila,
} from "@/modules/curadoria/fila-por-ato-devido";

/**
 * V-B12-1 · A FRONTEIRA DE PRIVACIDADE DA FILA, FALSEÁVEL POR FORMA.
 *
 * A guarda anterior procurava **vocabulário proibido** — `narrative`,
 * `diagnosis`, `compositionRationale` — na fonte do módulo. Ela pega quem
 * copia um campo com o nome antigo, e não pega mais nada: `observacao`,
 * `notaDaMesa`, `resumoClinico` ou qualquer nome novo atravessariam calados.
 * Procurar palavra é procurar o erro que já se conhece.
 *
 * Esta guarda inverte: declara o conjunto **fechado** de chaves aprovadas e
 * compara com `Object.keys()` dos objetos que `fatosDoRegistro` realmente
 * produz. Qualquer chave a mais reprova — inclusive com valor vazio,
 * `undefined` ou nunca renderizada, porque o que sai do servidor sai, tenha
 * pixel ou não.
 *
 * Os doze campos abaixo são os operacionais mínimos já aprovados. `patientName`
 * e `caseId` estão aqui por decisão explícita: um é como o Curador reconhece de
 * quem se trata, o outro é o destino do link. Nada além.
 */
const CHAVES_APROVADAS = [
  "caseId",
  "patientName",
  "status",
  "closedAt",
  "understandingConfirmedAt",
  "priorityProfileId",
  "meetingHeldAt",
  "validatedAt",
  "reportEmittedAt",
  "reportDeliveredAt",
  "decisionAt",
  "legadoSemCuradoria",
] as const;

/**
 * GUARDA ESTÁTICA — o tipo e a lista não podem divergir em silêncio.
 *
 * Se alguém acrescentar um campo a `FatosDaFila` sem acrescentá-lo aqui, ou o
 * contrário, `tsc` reprova antes de a suíte rodar. Sem `any`, sem cast largo,
 * sem index signature aberta: a igualdade é bidirecional, e é ela que impede a
 * lista de virar documentação desatualizada.
 */
type ChaveAprovada = (typeof CHAVES_APROVADAS)[number];
type ChaveDoTipo = keyof FatosDaFila;
type SaoIguais<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const FRONTEIRA_FECHADA: SaoIguais<ChaveAprovada, ChaveDoTipo> = true;

const QUANDO = "2026-08-12T10:00:00.000Z";

/**
 * O registro que a rota entrega a `fatosDoRegistro` — com muito mais do que a
 * Fila deve ver. É de propósito: se a função copiasse por spread, ou se alguém
 * a "simplificasse" para `{...registro}`, o excedente apareceria aqui.
 */
function registroCompleto(sobre: Record<string, unknown> = {}) {
  return {
    caseId: "caso-1",
    patientName: "Paciente Sintética",
    // Tudo abaixo é conteúdo que a Fila NÃO pode carregar.
    patientFirstName: "Paciente",
    curatorName: "Curador Sintético",
    historia: {
      understandingConfirmedAt: QUANDO,
      narrative: "A narrativa que ela contou, inteira.",
      motivation: "O que a fez procurar.",
    },
    acolhimento: { meetingHeldAt: QUANDO, knownFacts: ["fato clínico"] },
    priorityProfileId: "perfil-1",
    validacao: { validatedAt: QUANDO, validationNote: "nota da validação" },
    caso: { diagnosis: "diagnóstico", hypothesis: "hipótese", clinicalContext: "contexto" },
    relatorio: {
      emittedAt: QUANDO,
      deliveredAt: QUANDO,
      compositionRationale: "Por que estas três, juntas.",
      options: [{ justification: "parecer da opção" }],
    },
    devolutiva: { decision: { decidedAt: QUANDO }, observations: ["observação"] },
    filtros: [{ note: "nota do filtro" }],
    ...sobre,
  } as unknown as Parameters<typeof fatosDoRegistro>[0];
}

/** Um representante por grupo + os dois excluídos, como a rota os derivaria. */
const REPRESENTANTES: Array<{ grupo: string; fatos: FatosDaFila }> = [
  {
    grupo: "Aguarda Acolhimento",
    fatos: fatosDoRegistro(
      registroCompleto({
        historia: { understandingConfirmedAt: null },
        acolhimento: { meetingHeldAt: null },
        priorityProfileId: null,
        validacao: null,
        relatorio: { emittedAt: null, deliveredAt: null },
        devolutiva: { decision: null },
      }),
      { status: "NEW", closedAt: null, legadoSemCuradoria: false },
    ),
  },
  {
    grupo: "Aguarda o Primeiro Encontro",
    fatos: fatosDoRegistro(
      registroCompleto({
        acolhimento: { meetingHeldAt: null },
        validacao: null,
        relatorio: { emittedAt: null, deliveredAt: null },
        devolutiva: { decision: null },
      }),
      { status: "IN_CURATION", closedAt: null, legadoSemCuradoria: false },
    ),
  },
  {
    grupo: "Aguarda o reconhecimento dela",
    fatos: fatosDoRegistro(
      registroCompleto({
        validacao: null,
        relatorio: { emittedAt: null, deliveredAt: null },
        devolutiva: { decision: null },
      }),
      { status: "IN_CURATION", closedAt: null, legadoSemCuradoria: false },
    ),
  },
  {
    grupo: "Curadoria em curso",
    fatos: fatosDoRegistro(
      registroCompleto({
        relatorio: { emittedAt: null, deliveredAt: null },
        devolutiva: { decision: null },
      }),
      { status: "IN_CURATION", closedAt: null, legadoSemCuradoria: false },
    ),
  },
  {
    grupo: "Aguarda entrega",
    fatos: fatosDoRegistro(
      registroCompleto({
        relatorio: { emittedAt: QUANDO, deliveredAt: null },
        devolutiva: { decision: null },
      }),
      { status: "IN_CURATION", closedAt: null, legadoSemCuradoria: false },
    ),
  },
  {
    grupo: "Aguarda a decisão dela",
    fatos: fatosDoRegistro(registroCompleto({ devolutiva: { decision: null } }), {
      status: "DELIVERED",
      closedAt: null,
      legadoSemCuradoria: false,
    }),
  },
  {
    grupo: "Com o Concierge",
    fatos: fatosDoRegistro(registroCompleto(), {
      status: "DELIVERED",
      closedAt: null,
      legadoSemCuradoria: false,
    }),
  },
  {
    grupo: "fora da Fila · encerrado",
    fatos: fatosDoRegistro(registroCompleto(), {
      status: "CLOSED",
      closedAt: QUANDO,
      legadoSemCuradoria: false,
    }),
  },
  {
    grupo: "fora da Fila · legado",
    fatos: fatosDoRegistro(registroCompleto(), {
      status: "NEW",
      closedAt: null,
      legadoSemCuradoria: true,
    }),
  },
];

describe("V-B12-1 · a fronteira da Fila é um conjunto fechado", () => {
  it("o tipo e a lista aprovada não divergem (guarda estática)", () => {
    // Se `tsc` compilou, `FRONTEIRA_FECHADA` é `true` — e a igualdade das
    // chaves foi provada em tempo de compilação, não aqui.
    expect(FRONTEIRA_FECHADA).toBe(true);
    expect(new Set(CHAVES_APROVADAS).size, "chave repetida na lista").toBe(
      CHAVES_APROVADAS.length,
    );
  });

  it.each(REPRESENTANTES)(
    "$grupo — o objeto derivado tem exatamente as chaves aprovadas",
    ({ fatos }) => {
      const chaves = Object.keys(fatos).sort();
      expect(
        chaves,
        "chave não autorizada na fronteira de privacidade da Fila",
      ).toEqual([...CHAVES_APROVADAS].sort());
    },
  );

  it("nenhuma chave a mais escapa, mesmo vazia ou `undefined`", () => {
    // `Object.keys` enxerga a propriedade declarada com `undefined`. É por isso
    // que a comparação é de CHAVES, e não de valores: um campo clínico que
    // chegue vazio numa fixture continuaria chegando cheio em produção.
    for (const { fatos } of REPRESENTANTES) {
      const excedentes = Object.keys(fatos).filter(
        (chave) => !(CHAVES_APROVADAS as readonly string[]).includes(chave),
      );
      expect(excedentes, "chave não autorizada na fronteira de privacidade da Fila").toEqual([]);
    }
  });

  it("o registro cheio entra, e o conteúdo dele NÃO sai", () => {
    // A prova de que a fronteira separa: o registro de entrada carrega
    // narrativa, diagnóstico, parecer, rationale e nota de filtro; nenhum
    // desses valores aparece no que sai, em nenhuma chave.
    const valoresProibidos = [
      "A narrativa que ela contou, inteira.",
      "O que a fez procurar.",
      "diagnóstico",
      "hipótese",
      "contexto",
      "Por que estas três, juntas.",
      "parecer da opção",
      "nota da validação",
      "nota do filtro",
      "observação",
      "fato clínico",
      "Curador Sintético",
    ];
    for (const { grupo, fatos } of REPRESENTANTES) {
      const serializado = JSON.stringify(fatos);
      for (const proibido of valoresProibidos) {
        expect(serializado, `${grupo}: "${proibido}" atravessou a fronteira`).not.toContain(
          proibido,
        );
      }
    }
  });

  it("os dois identificadores operacionais continuam presentes, e são só eles", () => {
    // `patientName` e `caseId` estão na fronteira por decisão explícita. Se
    // sumirem, a Fila deixa de ser usável; se ganharem companhia (e-mail,
    // telefone, ID de perfil), a fronteira deixa de ser mínima.
    for (const { fatos } of REPRESENTANTES) {
      expect(fatos.caseId).toBeTruthy();
      expect(fatos.patientName).toBeTruthy();
    }
    const identificadores = CHAVES_APROVADAS.filter(
      (chave) => !/At$|^status$|^legado|^priorityProfileId$/.test(chave),
    );
    expect(identificadores, "a fronteira ganhou um identificador novo").toEqual([
      "caseId",
      "patientName",
    ]);
  });
});
