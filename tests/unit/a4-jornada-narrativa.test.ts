import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { lerEstado, type FatosDoCaso } from "@/foundation/contrato-de-estado";
import { buildJornada } from "@/modules/curadoria/jornada";
import { MOCK_RECORDS } from "@/modules/curadoria/cos/mock-records";
import type { CuradoriaRecord } from "@/modules/curadoria/cos/types";
import { projetarNarrativa, type MarcoId } from "@/modules/paciente/jornada-narrativa";
import { PATIENT_NAV_ITEMS } from "@/components/paciente/patient-nav-items";

/**
 * A4 · A JORNADA TEM UMA NARRATIVA SÓ — E ELA NÃO PODE MENTIR.
 *
 * A rota `/paciente/linha-do-tempo` mostrava um log de conta (conta criada,
 * documentos guardados, notificações) e chamava aquilo de "linha do tempo".
 * O percurso — encontros, análise, decisão — só existia como resumo na Home.
 * Não havia duas narrativas para consolidar: havia uma, e um registro com
 * nome de narrativa.
 *
 * Estas guardas protegem o que passou a existir: **uma projeção**, consumida
 * pelas duas superfícies, com os fatos governando cada marco.
 */

const CASO_ABERTO: FatosDoCaso = {
  historia: { existe: true, enviadaEm: "enviada" },
  caso: { curadorResponsavel: "c", encerradoEm: null, cancelado: false },
  relatorio: null,
  pendencia: null,
};

const CASO_CANCELADO: FatosDoCaso = {
  historia: { existe: true, enviadaEm: "enviada" },
  caso: { curadorResponsavel: "c", encerradoEm: "fechado", cancelado: true },
  relatorio: null,
  pendencia: null,
};

/** Um registro real dos mocks, com os fatos que o cenário exige sobrescritos. */
function narrativaDe(ajustes: Partial<CuradoriaRecord> = {}, fatos: FatosDoCaso = CASO_ABERTO) {
  const base = MOCK_RECORDS[Object.keys(MOCK_RECORDS)[0]!]!;
  const record = { ...base, ...ajustes } as CuradoriaRecord;
  return projetarNarrativa({
    record,
    jornada: buildJornada(record),
    leitura: lerEstado(fatos),
  });
}

function marco(narrativa: ReturnType<typeof narrativaDe>, id: MarcoId) {
  const encontrado = narrativa.marcos.find((m) => m.id === id);
  if (!encontrado) throw new Error(`marco ausente: ${id}`);
  return encontrado;
}

describe("T-A4-1 · Home e Jornada detalhada bebem da mesma projeção", () => {
  const HOME = "src/app/paciente/page.tsx";
  const JORNADA = "src/app/paciente/linha-do-tempo/page.tsx";
  const semComentarios = (caminho: string) =>
    readFileSync(caminho, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
      .replace(/\/\/.*$/gm, "");

  it("as duas rotas montam a jornada por `buildJornada` — não por switch próprio", () => {
    for (const rota of [HOME, JORNADA]) {
      expect(semComentarios(rota), `${rota} deixou de usar a projeção comum`).toContain(
        "buildJornada",
      );
    }
  });

  it("a rota detalhada não recria o percurso: ela projeta o que já existe", () => {
    const codigo = semComentarios(JORNADA);
    expect(codigo).toContain("projetarNarrativa");
    // Nenhum mapa de etapa escrito à mão na página.
    expect(codigo).not.toMatch(/CONSULTA_INICIAL|PERFIL_DE_PRIORIDADES|DOSSIE/);
  });

  it("existe UM projetor de narrativa no produto", () => {
    const modulo = readFileSync("src/modules/paciente/jornada-narrativa.ts", "utf8");
    expect(modulo).toContain("export function projetarNarrativa");
  });
});

describe("T-A4-2 · `meetingHeldAt` governa o Primeiro Encontro (D-9)", () => {
  it("sem `meetingHeldAt`, o encontro NÃO é concluído — nem com a história reconhecida", () => {
    const base = MOCK_RECORDS[Object.keys(MOCK_RECORDS)[0]!]!;
    const narrativa = narrativaDe({
      acolhimento: { ...base.acolhimento, meetingHeldAt: null },
      // Os dois fatos que já tentaram passar por prova do encontro.
      historia: { ...base.historia, understandingConfirmedAt: "2026-01-01T00:00:00Z" },
      validacao: { validatedAt: "2026-01-02T00:00:00Z", validationNote: "", correctionsMade: [] },
    });

    expect(marco(narrativa, "PRIMEIRO_ENCONTRO").status).not.toBe("CONCLUIDO");
  });

  it("com `meetingHeldAt`, o encontro é concluído", () => {
    const base = MOCK_RECORDS[Object.keys(MOCK_RECORDS)[0]!]!;
    const narrativa = narrativaDe({
      historia: { ...base.historia, registeredAt: "2026-01-01T00:00:00Z" },
      acolhimento: { ...base.acolhimento, meetingHeldAt: "2026-01-03T00:00:00Z" },
    });

    expect(marco(narrativa, "PRIMEIRO_ENCONTRO").status).toBe("CONCLUIDO");
  });
});

describe("T-A4-3 · apresentar não é entregar", () => {
  it("`presentedAt` presente e `deliveredAt` nulo: o conteúdo digital NÃO é dado como disponível", () => {
    const base = MOCK_RECORDS[Object.keys(MOCK_RECORDS)[0]!]!;
    const narrativa = narrativaDe({
      relatorio: { ...base.relatorio, emittedAt: "2026-02-01T00:00:00Z", deliveredAt: null },
      devolutiva: { ...base.devolutiva, presentedAt: "2026-02-02T00:00:00Z" },
    });

    const segundo = marco(narrativa, "SEGUNDO_ENCONTRO");
    const apresentacao = segundo.submarcos.find((s) => s.rotulo.includes("apresentadas"));
    const entrega = segundo.submarcos.find((s) => s.rotulo.includes("reler"));

    expect(apresentacao?.feito, "a apresentação aconteceu").toBe(true);
    expect(entrega?.feito, "entrega digital inferida da apresentação").toBe(false);
  });

  it("com `deliveredAt`, e só com ele, a entrega digital aparece como feita", () => {
    const base = MOCK_RECORDS[Object.keys(MOCK_RECORDS)[0]!]!;
    const narrativa = narrativaDe({
      relatorio: { ...base.relatorio, emittedAt: "2026-02-01T00:00:00Z", deliveredAt: "2026-02-03T00:00:00Z" },
      devolutiva: { ...base.devolutiva, presentedAt: "2026-02-02T00:00:00Z" },
    });

    expect(marco(narrativa, "SEGUNDO_ENCONTRO").submarcos.find((s) => s.rotulo.includes("reler"))?.feito).toBe(
      true,
    );
  });
});

describe("T-A4-4 · a decisão governa o handoff — e nada mais", () => {
  it("a responsabilidade vem da projeção da jornada, não de datas de encontro", () => {
    const base = MOCK_RECORDS[Object.keys(MOCK_RECORDS)[0]!]!;
    const record = {
      ...base,
      acolhimento: { ...base.acolhimento, meetingHeldAt: "2026-01-03T00:00:00Z" },
      relatorio: { ...base.relatorio, emittedAt: "2026-02-01T00:00:00Z", deliveredAt: "2026-02-03T00:00:00Z" },
      devolutiva: { ...base.devolutiva, presentedAt: "2026-02-02T00:00:00Z", decision: null },
    } as CuradoriaRecord;

    const narrativa = projetarNarrativa({
      record,
      jornada: buildJornada(record),
      leitura: lerEstado(CASO_ABERTO),
    });

    // Encontro realizado, Curadoria emitida, apresentada E entregue — e ainda
    // assim, sem decisão, quem responde continua sendo o Curador.
    expect(narrativa.responsavel.role).toBe("curador");
  });

  it("o projetor não escreve regra de handoff: ele repassa a que já existe", () => {
    const modulo = readFileSync("src/modules/paciente/jornada-narrativa.ts", "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    expect(modulo).toContain("jornada.currentResponsible");
    expect(modulo, "handoff recalculado dentro da projeção").not.toMatch(/concierge|Concierge/);
  });
});

describe("T-A4-5 · cancelado não aparece como concluído", () => {
  it("um caso cancelado é declarado, e nenhum marco vira o atual", () => {
    const narrativa = narrativaDe({}, CASO_CANCELADO);

    expect(narrativa.encerramento?.tipo).toBe("CANCELADO");
    expect(narrativa.marcos.some((m) => m.status === "ATUAL")).toBe(false);
    expect(narrativa.marcos.some((m) => m.aguardaVoce)).toBe(false);
  });

  it("e o rótulo do encerramento é o do contrato — não uma frase de conclusão", () => {
    const narrativa = narrativaDe({}, CASO_CANCELADO);
    expect(narrativa.encerramento?.rotulo).toBe(lerEstado(CASO_CANCELADO).rotuloPaciente);
    expect(narrativa.encerramento?.rotulo.toLowerCase()).not.toContain("concluí");
  });
});

describe("T-A4-6 · a navegação leva a UMA Jornada", () => {
  it("existe exatamente um item apontando para a rota da Jornada", () => {
    const jornada = PATIENT_NAV_ITEMS.filter((item) => item.href === "/paciente/linha-do-tempo");
    expect(jornada).toHaveLength(1);
  });

  it("e o rótulo dele fala de jornada — não de uma segunda superfície", () => {
    const item = PATIENT_NAV_ITEMS.find((i) => i.href === "/paciente/linha-do-tempo");
    expect(item?.label.toLowerCase()).toContain("jornada");
    // "Linha do tempo" era o nome que competia com "Sua jornada" da Home.
    expect(item?.label.toLowerCase()).not.toContain("linha do tempo");
  });
});

describe("A4.1 · nenhum submarco ausente é escrito no passado", () => {
  /**
   * O defeito que esta guarda existe para impedir apareceu na revisão visual:
   * sob o título "ainda por vir", a tela dizia "A conversa aconteceu", "As
   * opções foram apresentadas" e "Sua escolha foi registrada". A distinção
   * ficava só no símbolo — e símbolo não sustenta verdade sozinho.
   *
   * A asserção é sobre a RELAÇÃO fato × tempo verbal, não sobre frases exatas:
   * um marcador de passado num submarco não feito é o defeito, qualquer que
   * seja a redação escolhida depois.
   */
  // Sem `\b` no fim: em JS, `\b` é ASCII, e depois de "á"/"ã" ele não casa —
  // "acontecerá\b" nunca daria match. A fronteira à esquerda basta.
  const PASSADO = /\b(aconteceu|foram|foi|ficaram|ficou|reconheceu|contou|confirmou)/i;
  const FUTURO = /\b(vai|serão|será|acontecerá|quando|ficará)/i;

  const CENARIOS: Array<[string, Partial<CuradoriaRecord>]> = [
    ["nada aconteceu ainda", {}],
    [
      "tudo aconteceu",
      (() => {
        const base = MOCK_RECORDS[Object.keys(MOCK_RECORDS)[0]!]!;
        return {
          historia: {
            ...base.historia,
            registeredAt: "2026-01-01T00:00:00Z",
            understandingConfirmedAt: "2026-01-02T00:00:00Z",
          },
          acolhimento: { ...base.acolhimento, meetingHeldAt: "2026-01-03T00:00:00Z" },
          validacao: { validatedAt: "2026-01-04T00:00:00Z", validationNote: "", correctionsMade: [] },
          relatorio: {
            ...base.relatorio,
            emittedAt: "2026-02-01T00:00:00Z",
            deliveredAt: "2026-02-03T00:00:00Z",
          },
          devolutiva: {
            ...base.devolutiva,
            presentedAt: "2026-02-02T00:00:00Z",
            decision: {
              outcome: "CHOSEN" as const,
              chosenProfessionalId: null,
              justification: null,
              decidedAt: "2026-02-04T00:00:00Z",
            },
          },
        };
      })(),
    ],
  ];

  for (const [nome, ajustes] of CENARIOS) {
    it(`${nome}: cada submarco fala no tempo do seu fato`, () => {
      const narrativa = narrativaDe(ajustes);

      for (const m of narrativa.marcos) {
        for (const sub of m.submarcos) {
          if (sub.feito) {
            expect(sub.rotulo, `${m.id}: fato presente escrito como promessa — "${sub.rotulo}"`).toMatch(
              PASSADO,
            );
          } else {
            expect(
              sub.rotulo,
              `${m.id}: fato AUSENTE afirmado como ocorrido — "${sub.rotulo}"`,
            ).toMatch(FUTURO);
          }
        }
      }
    });
  }

  it("um marco FUTURO nunca traz submarco afirmado como feito", () => {
    const narrativa = narrativaDe();
    for (const m of narrativa.marcos.filter((x) => x.status === "FUTURO")) {
      for (const sub of m.submarcos) {
        expect(sub.feito, `${m.id} é futuro mas tem submarco concluído: ${sub.rotulo}`).toBe(false);
      }
    }
  });
});

describe("A4.1 · Home e Jornada mostram os mesmos seis marcos", () => {
  it("a régua da Home é montada pela projeção, não pelas sete etapas internas", () => {
    const codigo = readFileSync("src/app/paciente/page.tsx", "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
      .replace(/\/\/.*$/gm, "");

    expect(codigo).toContain("projetarNarrativa");
    expect(codigo).toContain("narrativa.marcos.map");
    // O vocabulário interno saiu da régua da Home.
    expect(codigo).not.toContain("WALK_LABELS");
    expect(codigo).not.toContain("walkStatusOf");
  });

  it("todo marco tem nome curto, e ele cabe numa trilha de celular", () => {
    for (const m of narrativaDe().marcos) {
      expect(m.rotuloCurto, m.id).toBeTruthy();
      expect(m.rotuloCurto.length, `${m.id}: "${m.rotuloCurto}" é longo demais`).toBeLessThanOrEqual(
        16,
      );
    }
  });

  it("o nome curto não reintroduz os conceitos técnicos aposentados", () => {
    const curtos = narrativaDe()
      .marcos.map((m) => m.rotuloCurto.toLowerCase())
      .join(" | ");
    for (const tecnico of ["consulta", "relatório", "conversa", "escolha", "perfil"]) {
      expect(curtos, `voltou o conceito técnico "${tecnico}"`).not.toContain(tecnico);
    }
  });
});

describe("A4 · a narrativa tem seis marcos, e nenhuma etapa fica órfã", () => {
  it("seis marcos, na ordem do percurso", () => {
    const esperada: MarcoId[] = [
      "HISTORIA",
      "PRIMEIRO_ENCONTRO",
      "ANALISE",
      "SEGUNDO_ENCONTRO",
      "DECISAO",
      "PROXIMOS_PASSOS",
    ];
    expect(narrativaDe().marcos.map((m) => m.id)).toEqual(esperada);
  });

  it("os fatos que deixaram de ser etapa continuam visíveis como submarcos", () => {
    const narrativa = narrativaDe();
    const analise = marco(narrativa, "ANALISE");
    const rotulos = analise.submarcos.map((s) => s.rotulo.toLowerCase()).join(" | ");

    // Perfil e Relatório saíram da régua principal — mas não do produto.
    expect(rotulos).toContain("prioridades");
    expect(rotulos).toContain("caminhos");
  });

  it("todo mock dos registros produz seis marcos, sem exceção", () => {
    for (const chave of Object.keys(MOCK_RECORDS)) {
      const record = MOCK_RECORDS[chave]!;
      const narrativa = projetarNarrativa({
        record,
        jornada: buildJornada(record),
        leitura: lerEstado(CASO_ABERTO),
      });
      expect(narrativa.marcos, chave).toHaveLength(6);
    }
  });
});
