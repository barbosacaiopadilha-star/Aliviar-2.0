import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  classificarCaso,
  motivoDeExclusao,
  montarFila,
  DEFINICOES_DA_FILA,
  GRUPOS_DA_FILA,
  type FatosDaFila,
  type GrupoDaFila,
} from "@/modules/curadoria/fila-por-ato-devido";

/**
 * T-12-1 · A FILA É DERIVADA, NÃO DECLARADA.
 *
 * Toda fila que já existiu neste produto começou como projeção e terminou como
 * tabela — porque alguém precisou de "um estadozinho só" e criou um segundo dono
 * do Caso. Este arquivo existe para tornar isso caro: se a classificação passar
 * a depender de coluna própria, de ordem de chegada ou de relógio, algo aqui cai.
 *
 * T-12-2 é a guarda de promessa: a Fila não pode inventar prazo. Não existe
 * regra temporal aprovada neste produto, e "há 3 dias" é um SLA disfarçado de
 * informação.
 */

const RAIZ = process.cwd();
const FONTE_DERIVACAO = path.join(RAIZ, "src/modules/curadoria/fila-por-ato-devido.ts");
const FONTE_SUPERFICIE = path.join(RAIZ, "src/components/curadoria/fila-por-ato-devido.tsx");
const FONTE_ROTA = path.join(RAIZ, "src/app/portal-curador/page.tsx");

/** Um Caso recém-nascido: nenhum fato adiante. */
function caso(sobre: Partial<FatosDaFila> = {}): FatosDaFila {
  return {
    caseId: sobre.caseId ?? "caso-1",
    patientName: sobre.patientName ?? "Paciente Sintética",
    status: sobre.status ?? "NEW",
    closedAt: sobre.closedAt ?? null,
    understandingConfirmedAt: sobre.understandingConfirmedAt ?? null,
    priorityProfileId: sobre.priorityProfileId ?? null,
    meetingHeldAt: sobre.meetingHeldAt ?? null,
    validatedAt: sobre.validatedAt ?? null,
    reportEmittedAt: sobre.reportEmittedAt ?? null,
    reportDeliveredAt: sobre.reportDeliveredAt ?? null,
    decisionAt: sobre.decisionAt ?? null,
    legadoSemCuradoria: sobre.legadoSemCuradoria ?? false,
  };
}

const QUANDO = "2026-08-12T10:00:00.000Z";

/** Os dez cortes da matriz CR, como fatos — o mesmo recorte que o banco produz. */
const CORTES: Array<{ cr: string; fatos: FatosDaFila; grupo: GrupoDaFila | null }> = [
  { cr: "CR-01", fatos: caso({ caseId: "cr-01" }), grupo: "AGUARDA_ACOLHIMENTO" },
  {
    cr: "CR-02",
    fatos: caso({ caseId: "cr-02", understandingConfirmedAt: QUANDO, priorityProfileId: "p2" }),
    grupo: "AGUARDA_PRIMEIRO_ENCONTRO",
  },
  {
    cr: "CR-03",
    fatos: caso({
      caseId: "cr-03",
      understandingConfirmedAt: QUANDO,
      priorityProfileId: "p3",
      meetingHeldAt: QUANDO,
    }),
    grupo: "AGUARDA_RECONHECIMENTO_DELA",
  },
  {
    cr: "CR-04",
    fatos: caso({
      caseId: "cr-04",
      understandingConfirmedAt: QUANDO,
      priorityProfileId: "p4",
      meetingHeldAt: QUANDO,
      validatedAt: QUANDO,
    }),
    grupo: "CURADORIA_EM_CURSO",
  },
  {
    cr: "CR-05",
    fatos: caso({
      caseId: "cr-05",
      understandingConfirmedAt: QUANDO,
      priorityProfileId: "p5",
      meetingHeldAt: QUANDO,
      validatedAt: QUANDO,
    }),
    grupo: "CURADORIA_EM_CURSO",
  },
  {
    cr: "CR-06",
    fatos: caso({
      caseId: "cr-06",
      understandingConfirmedAt: QUANDO,
      priorityProfileId: "p6",
      meetingHeldAt: QUANDO,
      validatedAt: QUANDO,
      reportEmittedAt: QUANDO,
    }),
    grupo: "AGUARDA_ENTREGA",
  },
  {
    cr: "CR-07",
    fatos: caso({
      caseId: "cr-07",
      understandingConfirmedAt: QUANDO,
      priorityProfileId: "p7",
      meetingHeldAt: QUANDO,
      validatedAt: QUANDO,
      reportEmittedAt: QUANDO,
      reportDeliveredAt: QUANDO,
    }),
    grupo: "AGUARDA_DECISAO_DELA",
  },
  {
    cr: "CR-08",
    fatos: caso({
      caseId: "cr-08",
      understandingConfirmedAt: QUANDO,
      priorityProfileId: "p8",
      meetingHeldAt: QUANDO,
      validatedAt: QUANDO,
      reportEmittedAt: QUANDO,
      reportDeliveredAt: QUANDO,
      decisionAt: QUANDO,
    }),
    grupo: "COM_O_CONCIERGE",
  },
  {
    cr: "CR-09",
    fatos: caso({
      caseId: "cr-09",
      understandingConfirmedAt: QUANDO,
      priorityProfileId: "p9",
      meetingHeldAt: QUANDO,
      validatedAt: QUANDO,
      reportEmittedAt: QUANDO,
      reportDeliveredAt: QUANDO,
      decisionAt: QUANDO,
    }),
    grupo: "COM_O_CONCIERGE",
  },
  {
    cr: "CR-10",
    fatos: caso({
      caseId: "cr-10",
      understandingConfirmedAt: QUANDO,
      priorityProfileId: "p10",
      meetingHeldAt: QUANDO,
      validatedAt: QUANDO,
      reportEmittedAt: QUANDO,
      reportDeliveredAt: QUANDO,
      decisionAt: QUANDO,
    }),
    grupo: "COM_O_CONCIERGE",
  },
  { cr: "CR-11", fatos: caso({ caseId: "cr-11", status: "CLOSED", closedAt: QUANDO }), grupo: null },
  { cr: "CR-12", fatos: caso({ caseId: "cr-12", legadoSemCuradoria: true }), grupo: null },
];

describe("T-12-1 · os sete grupos, derivados de fatos", () => {
  it("os sete grupos existem, na ordem do contrato", () => {
    expect(GRUPOS_DA_FILA).toEqual([
      "AGUARDA_ACOLHIMENTO",
      "AGUARDA_PRIMEIRO_ENCONTRO",
      "AGUARDA_RECONHECIMENTO_DELA",
      "CURADORIA_EM_CURSO",
      "AGUARDA_ENTREGA",
      "AGUARDA_DECISAO_DELA",
      "COM_O_CONCIERGE",
    ]);
  });

  it("os títulos são exatamente os do contrato", () => {
    expect(GRUPOS_DA_FILA.map((g) => DEFINICOES_DA_FILA[g].titulo)).toEqual([
      "Aguarda Acolhimento",
      "Aguarda o Primeiro Encontro",
      "Aguarda o reconhecimento dela",
      "Curadoria em curso",
      "Aguarda entrega",
      "Aguarda a decisão dela",
      "Com o Concierge",
    ]);
  });

  it.each(CORTES)("$cr cai no grupo previsto pela matriz", ({ fatos, grupo }) => {
    expect(classificarCaso(fatos)).toBe(grupo);
  });

  it("CR-11 e CR-12 saem da Fila, cada um pelo seu motivo", () => {
    expect(motivoDeExclusao(caso({ status: "CLOSED", closedAt: QUANDO }))).toBe("ENCERRADO");
    expect(motivoDeExclusao(caso({ status: "CANCELLED" }))).toBe("ENCERRADO");
    expect(motivoDeExclusao(caso({ legadoSemCuradoria: true }))).toBe("LEGADO");
    expect(motivoDeExclusao(caso())).toBeNull();
  });

  it("um grupo vazio continua existindo, e diz que está vazio", () => {
    const { grupos } = montarFila([]);
    expect(grupos).toHaveLength(7);
    for (const grupo of grupos) {
      expect(grupo.contagem).toBe(0);
      expect(grupo.definicao.vazio.length).toBeGreaterThan(10);
    }
  });
});

describe("T-12-1 · precedência: nenhum Case duplicado, nenhum perdido", () => {
  it("cada Caso aparece em exatamente um grupo", () => {
    const ativos = CORTES.filter((c) => c.grupo !== null).map((c) => c.fatos);
    const { grupos } = montarFila(ativos);
    const vistos = grupos.flatMap((g) => g.casos.map((c) => c.caseId));

    expect(new Set(vistos).size, "um Case apareceu em mais de um grupo").toBe(vistos.length);
    expect(vistos).toHaveLength(ativos.length);
  });

  it("nenhum Caso ativo se perde entre os grupos", () => {
    const ativos = CORTES.filter((c) => c.grupo !== null).map((c) => c.fatos);
    const { grupos, total } = montarFila(ativos);
    expect(total).toBe(ativos.length);
    expect(grupos.reduce((s, g) => s + g.contagem, 0)).toBe(ativos.length);
  });

  it("Case encerrado sai da Fila mesmo tendo todos os fatos anteriores", () => {
    // Encerrar depois de decidir é comum. Sem a precedência do encerramento,
    // este Caso voltaria a aparecer "Com o Concierge" como se fosse trabalho.
    const encerradoTardio = caso({
      status: "CLOSED",
      closedAt: QUANDO,
      understandingConfirmedAt: QUANDO,
      priorityProfileId: "p",
      meetingHeldAt: QUANDO,
      validatedAt: QUANDO,
      reportEmittedAt: QUANDO,
      reportDeliveredAt: QUANDO,
      decisionAt: QUANDO,
    });
    expect(classificarCaso(encerradoTardio)).toBeNull();
  });

  it("a Connection NÃO substitui a decisão: sem decisão, o Caso aguarda ela", () => {
    // CR-10 tem `connection_records`, mas a Fila não os lê — e é assim de
    // propósito: acompanhamento aberto não é a decisão dela.
    const entregueSemDecisao = CORTES.find((c) => c.cr === "CR-07")!.fatos;
    expect(classificarCaso(entregueSemDecisao)).toBe("AGUARDA_DECISAO_DELA");
    const fonte = readFileSync(FONTE_DERIVACAO, "utf8");
    expect(fonte, "a Fila passou a ler Connection para classificar").not.toMatch(
      /connection_records|connectionId|connectionAt/,
    );
  });

  it("entregar não substitui decidir: os dois grupos são distintos", () => {
    const entregue = CORTES.find((c) => c.cr === "CR-07")!.fatos;
    const decidido = CORTES.find((c) => c.cr === "CR-08")!.fatos;
    expect(classificarCaso(entregue)).not.toBe(classificarCaso(decidido));
  });

  it("`NONE_OF_THEM` e escolha positiva vão para o MESMO grupo", () => {
    // O handoff vigente é o mesmo: decidiu, segue com o Concierge. Separar os
    // dois criaria um julgamento sobre a decisão dela.
    expect(classificarCaso(CORTES.find((c) => c.cr === "CR-08")!.fatos)).toBe("COM_O_CONCIERGE");
    expect(classificarCaso(CORTES.find((c) => c.cr === "CR-09")!.fatos)).toBe("COM_O_CONCIERGE");
  });

  it("a ordem de entrada não muda a classificação", () => {
    const ativos = CORTES.filter((c) => c.grupo !== null).map((c) => c.fatos);
    const direto = montarFila(ativos);
    const invertido = montarFila([...ativos].reverse());

    const mapa = (r: ReturnType<typeof montarFila>) =>
      Object.fromEntries(r.grupos.map((g) => [g.definicao.id, g.casos.map((c) => c.caseId).sort()]));

    expect(mapa(invertido), "inverter a criação mudou o grupo de alguém").toEqual(mapa(direto));
  });
});

describe("T-12-2 · a Fila não inventa tempo, autoridade nem clínica", () => {
  const derivacao = readFileSync(FONTE_DERIVACAO, "utf8");
  const superficie = readFileSync(FONTE_SUPERFICIE, "utf8");
  const rota = readFileSync(FONTE_ROTA, "utf8");

  /** Só o código, sem comentários: a doutrina fala dos termos que proíbe. */
  const semComentarios = (fonte: string) =>
    fonte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  it("nenhum prazo, SLA ou contagem de dias na superfície", () => {
    const proibidos = [
      /atrasad/i,
      /\bSLA\b/i,
      /\bprazo\b/i,
      /há \d+ dias?/i,
      /\bhoje\b/i,
      /\bvencid/i,
      /\burgen/i,
      /\d+\s*horas?/i,
      /diffDays|daysSince|dias(De|Desde)/,
    ];
    for (const fonte of [semComentarios(derivacao), semComentarios(superficie)]) {
      for (const padrao of proibidos) {
        expect(fonte, `a Fila passou a prometer tempo: ${padrao}`).not.toMatch(padrao);
      }
    }
  });

  it("a classificação não lê relógio nenhum", () => {
    const codigo = semComentarios(derivacao);
    expect(codigo, "a Fila comparou datas para classificar").not.toMatch(
      /Date\.now\(\)|new Date\(|getTime\(\)|Date\.parse/,
    );
  });

  it("nenhum ato da paciente é oferecido ao Curador", () => {
    for (const fonte of [derivacao, superficie, rota]) {
      expect(fonte, "a Fila expôs o reconhecimento do Perfil").not.toMatch(
        /acknowledge_priority_profile|acknowledgePriorityProfile|reconhecerPerfil/,
      );
    }
    // Onde o ato é dela, não existe CTA de execução.
    expect(DEFINICOES_DA_FILA.AGUARDA_RECONHECIMENTO_DELA.temAcaoDoCurador).toBe(false);
    expect(DEFINICOES_DA_FILA.AGUARDA_RECONHECIMENTO_DELA.responsavel).toBe("PACIENTE");
    expect(DEFINICOES_DA_FILA.AGUARDA_DECISAO_DELA.temAcaoDoCurador).toBe(false);
    expect(DEFINICOES_DA_FILA.COM_O_CONCIERGE.temAcaoDoCurador).toBe(false);
  });

  it("nenhum conteúdo clínico atravessa a fronteira de fatos", () => {
    // O tipo `FatosDaFila` É a fronteira: o que não está nele não chega à tela.
    const bloco = derivacao.slice(
      derivacao.indexOf("export type FatosDaFila"),
      derivacao.indexOf("export const GRUPOS_DA_FILA"),
    );
    for (const proibido of [
      "narrative",
      "motivation",
      "diagnosis",
      "hypothesis",
      "parecer",
      "justification",
      "compositionRationale",
      "note",
      "email",
      "phone",
      "telefone",
    ]) {
      expect(bloco, `\`${proibido}\` entrou no recorte da Fila`).not.toContain(proibido);
    }
  });

  it("a superfície não renderiza nada clínico nem identificador interno", () => {
    const codigo = semComentarios(superficie);
    for (const proibido of [
      "narrative",
      "diagnosis",
      "hypothesis",
      "compositionRationale",
      "justification",
      ".note",
      "patientEmail",
      "profileId",
    ]) {
      expect(codigo, `a Fila renderizou \`${proibido}\``).not.toContain(proibido);
    }
    // O `caseId` aparece SÓ como destino de link, nunca como texto na tela.
    expect(codigo).toMatch(/href=\{`\/coa\/curadoria\/casos\/\$\{caso\.caseId\}`\}/);
    expect(codigo).not.toMatch(/>\{caso\.caseId\}</);
  });

  it("nenhum Concierge antes da decisão", () => {
    // "Com o Concierge" é o ÚNICO grupo que menciona Concierge, e ele exige
    // decisão registrada. Antes disso o responsável é o Curador ou a paciente.
    const comConcierge = GRUPOS_DA_FILA.filter((g) =>
      /concierge/i.test(DEFINICOES_DA_FILA[g].titulo + DEFINICOES_DA_FILA[g].atoDevido),
    );
    expect(comConcierge).toEqual(["COM_O_CONCIERGE"]);
    expect(classificarCaso(CORTES.find((c) => c.cr === "CR-07")!.fatos)).not.toBe("COM_O_CONCIERGE");
  });

  it("nenhuma tabela, coluna ou writer de fila foi criado", () => {
    const codigo = semComentarios(derivacao);
    for (const padrao of [/\.insert\(/, /\.update\(/, /\.upsert\(/, /\.delete\(/, /supabase/i]) {
      expect(codigo, "a projeção da Fila virou escrita").not.toMatch(padrao);
    }
  });
});
