import { describe, expect, it } from "vitest";

import {
  decisaoDaPaciente,
  deQuemEAVez,
  lerEstado,
  type FatosDoCaso,
} from "@/foundation/contrato-de-estado";
import { PAPEIS_VISUAIS } from "@/foundation/estado-visual";

/**
 * FUNDAÇÃO · o contrato de estado, testado pelas contradições que ele fecha.
 *
 * Cada caso abaixo é uma divergência que a auditoria encontrou de verdade na
 * aplicação — não um cenário imaginado. O teste existe para que ela não possa
 * voltar por um caminho novo.
 */

/** Fatos vazios: nada aconteceu ainda, e sabemos disso. */
const NADA: FatosDoCaso = {
  historia: { existe: false, enviadaEm: null },
  caso: null,
  relatorio: null,
  pendencia: null,
};

function fatos(patch: Partial<FatosDoCaso>): FatosDoCaso {
  return { ...NADA, ...patch };
}

describe("CASO 1 · história enviada + Curadoria entregue", () => {
  const entregue = fatos({
    historia: { existe: true, enviadaEm: "2026-07-01T10:00:00Z" },
    caso: { curadorResponsavel: "curador-1", encerradoEm: null, cancelado: false },
    relatorio: { existe: true, emitidoEm: "2026-08-01T10:00:00Z", entregueEm: "2026-08-02T10:00:00Z" },
  });

  it("nunca exibe 'você ainda não contou sua história'", () => {
    const leitura = lerEstado(entregue);
    expect(leitura.estado).toBe("CURADORIA_ENTREGUE");
    expect(leitura.rotuloPaciente).not.toMatch(/conte sua história/i);
    expect(leitura.rotuloPaciente).not.toMatch(/ainda não/i);
  });

  it("e o defeito é estrutural, não textual: não há caminho até o estado inicial", () => {
    // A ordem de derivação vai do fato mais avançado para o menos. Com entrega
    // registrada, os ramos da história ficam inalcançáveis por construção.
    for (const historia of [null, { existe: false, enviadaEm: null }]) {
      expect(lerEstado({ ...entregue, historia }).estado).toBe("CURADORIA_ENTREGUE");
    }
  });
});

describe("CASO 2 · relatório emitido mas não entregue", () => {
  const emitido = fatos({
    historia: { existe: true, enviadaEm: "2026-07-01T10:00:00Z" },
    caso: { curadorResponsavel: "curador-1", encerradoEm: null, cancelado: false },
    relatorio: { existe: true, emitidoEm: "2026-08-01T10:00:00Z", entregueEm: null },
  });

  it("a paciente NÃO o vê como entregue", () => {
    const leitura = lerEstado(emitido);
    expect(leitura.estado).toBe("RELATORIO_EMITIDO");
    expect(leitura.rotuloPaciente).not.toMatch(/pronta|entregue|disponível/i);
  });

  it("e não há conteúdo para ela abrir — emitir não é entregar", () => {
    expect(lerEstado(emitido).temConteudoParaPaciente).toBe(false);
    expect(lerEstado(emitido).acoesPaciente).toHaveLength(0);
  });

  it("o ato que falta é da equipe, e o Curador lê isso sem ambiguidade", () => {
    const leitura = lerEstado(emitido);
    expect(leitura.quemAge).toBe("EQUIPE");
    expect(leitura.rotuloCurador).toContain("ainda não entregue");
    expect(leitura.acoesCurador).toContain("ENTREGAR_CURADORIA");
  });
});

describe("CASO 3 · relatório entregue ⇒ Documentos pode identificá-lo", () => {
  it("`temConteudoParaPaciente` é o sinal que a Central de Documentos lê", () => {
    const entregue = fatos({
      historia: { existe: true, enviadaEm: "2026-07-01T10:00:00Z" },
      caso: { curadorResponsavel: "c", encerradoEm: null, cancelado: false },
      relatorio: { existe: true, emitidoEm: "2026-08-01T10:00:00Z", entregueEm: "2026-08-02T10:00:00Z" },
    });
    expect(lerEstado(entregue).temConteudoParaPaciente).toBe(true);
    expect(lerEstado(entregue).acoesPaciente).toContain("VER_CURADORIA");
  });

  it("e antes da entrega ele é falso — Documentos não pode anunciar o que não saiu", () => {
    const soEmitido = fatos({
      relatorio: { existe: true, emitidoEm: "2026-08-01T10:00:00Z", entregueEm: null },
    });
    expect(lerEstado(soEmitido).temConteudoParaPaciente).toBe(false);
  });
});

describe("CASO 4 · Curadoria entregue ⇒ Home e Jornada derivam o mesmo macroestado", () => {
  it("a mesma função, os mesmos fatos, o mesmo estado — não há duas montagens", () => {
    const entregue = fatos({
      historia: { existe: true, enviadaEm: "2026-07-01T10:00:00Z" },
      caso: { curadorResponsavel: "c", encerradoEm: null, cancelado: false },
      relatorio: { existe: true, emitidoEm: "2026-08-01T10:00:00Z", entregueEm: "2026-08-02T10:00:00Z" },
    });
    // Duas superfícies = duas chamadas. Se divergirem, é porque alguém deduziu.
    const home = lerEstado(entregue);
    const jornada = lerEstado(entregue);
    expect(home).toEqual(jornada);
    expect(home.estado).toBe("CURADORIA_ENTREGUE");
  });
});

describe("CASO 5 · sinalizar não é decidir", () => {
  it("a decisão da paciente permanece não registrada — depende de [D-2]", () => {
    expect(decisaoDaPaciente()).toEqual({ registrada: false, motivo: "AGUARDA_DECISAO_D2" });
  });

  it("e nenhum estado do catálogo afirma decisão", () => {
    const entregue = fatos({
      relatorio: { existe: true, emitidoEm: "2026-08-01T10:00:00Z", entregueEm: "2026-08-02T10:00:00Z" },
    });
    for (const leitura of [lerEstado(entregue), lerEstado(NADA)]) {
      expect(leitura.rotuloPaciente).not.toMatch(/decid|escolheu|optou/i);
      expect(leitura.rotuloCurador).not.toMatch(/decid|escolheu|optou/i);
    }
  });
});

describe("CASO 6 · pendência que exige a paciente", () => {
  it("waitingOn = PACIENTE, e a pendência não some atrás do progresso", () => {
    const comPendencia = fatos({
      historia: { existe: true, enviadaEm: "2026-07-01T10:00:00Z" },
      caso: { curadorResponsavel: "c", encerradoEm: null, cancelado: false },
      pendencia: { aberta: true, aguardando: "PACIENTE" },
    });
    const leitura = lerEstado(comPendencia);
    expect(leitura.quemAge).toBe("PACIENTE");
    expect(leitura.temPendencia).toBe(true);
    expect(leitura.tom).toBe("atencao");
  });
});

describe("CASO 7 · pendência que exige o Curador", () => {
  it("waitingOn = CURADOR", () => {
    const comPendencia = fatos({
      historia: { existe: true, enviadaEm: "2026-07-01T10:00:00Z" },
      caso: { curadorResponsavel: "c", encerradoEm: null, cancelado: false },
      pendencia: { aberta: true, aguardando: "CURADOR" },
    });
    expect(deQuemEAVez(comPendencia)).toBe("CURADOR");
  });

  it("pendência sem destinatário determinável NÃO vira palpite", () => {
    const semDestinatario = fatos({
      caso: { curadorResponsavel: "c", encerradoEm: null, cancelado: false },
      pendencia: { aberta: true, aguardando: "INDETERMINADO" },
    });
    expect(deQuemEAVez(semDestinatario)).toBe("INDETERMINADO");
  });
});

describe("CASO 8 · estado não determinável ⇒ fallback seguro", () => {
  const desconhecido = fatos({ historia: null, caso: null, relatorio: null });

  it("responde INDETERMINADO, nunca um estado inventado", () => {
    expect(lerEstado(desconhecido).estado).toBe("INDETERMINADO");
    expect(deQuemEAVez(desconhecido)).toBe("INDETERMINADO");
  });

  it("e o fallback é seguro: tom neutro, sem conteúdo, sem ação, sem promessa", () => {
    const leitura = lerEstado(desconhecido);
    expect(leitura.tom).toBe("neutro");
    expect(leitura.temConteudoParaPaciente).toBe(false);
    expect(leitura.acoesPaciente).toHaveLength(0);
    expect(leitura.acoesCurador).toHaveLength(0);
    // Nem sucesso, nem falha, nem prazo.
    expect(leitura.rotuloPaciente).not.toMatch(/pronta|erro|falha|dias|prazo|em breve/i);
  });

  it("ausência de dado NUNCA vira afirmação — `null` ≠ `false`", () => {
    // "não sei se há história" e "sei que não há história" são estados
    // diferentes, e só o segundo autoriza pedir que ela comece.
    expect(lerEstado(fatos({ historia: null })).estado).toBe("INDETERMINADO");
    expect(lerEstado(fatos({ historia: { existe: false, enviadaEm: null } })).estado).toBe(
      "HISTORIA_NAO_INICIADA",
    );
  });
});

describe("Regras de segurança da camada (§17)", () => {
  const TODOS: FatosDoCaso[] = [
    NADA,
    fatos({ historia: null }),
    fatos({ historia: { existe: true, enviadaEm: null } }),
    fatos({ historia: { existe: true, enviadaEm: "2026-07-01T10:00:00Z" } }),
    fatos({ caso: { curadorResponsavel: null, encerradoEm: null, cancelado: false } }),
    fatos({ caso: { curadorResponsavel: "c", encerradoEm: null, cancelado: false } }),
    fatos({ relatorio: { existe: true, emitidoEm: "2026-08-01T10:00:00Z", entregueEm: null } }),
    fatos({ relatorio: { existe: true, emitidoEm: "2026-08-01T10:00:00Z", entregueEm: "2026-08-02T10:00:00Z" } }),
    fatos({ caso: { curadorResponsavel: "c", encerradoEm: "2026-08-05T10:00:00Z", cancelado: false } }),
  ];

  it("nenhum rótulo de paciente expõe enum, id ou detalhe interno", () => {
    for (const f of TODOS) {
      const { rotuloPaciente, estado } = lerEstado(f);
      expect(rotuloPaciente).not.toContain("_");
      expect(rotuloPaciente).not.toMatch(/caseId|case_id|uuid|null|undefined/i);
      // O enum técnico não vaza para a frase.
      expect(rotuloPaciente).not.toContain(estado);
    }
  });

  it("nenhum rótulo promete prazo que ninguém garantiu", () => {
    for (const f of TODOS) {
      const { rotuloPaciente } = lerEstado(f);
      expect(rotuloPaciente).not.toMatch(/em breve|\d+\s*(dias?|horas?|semanas?)|até (amanhã|hoje)/i);
    }
  });

  it("`temConteudoParaPaciente` só é verdadeiro com entrega ou conclusão reais", () => {
    for (const f of TODOS) {
      const leitura = lerEstado(f);
      if (!leitura.temConteudoParaPaciente) continue;
      expect(Boolean(f.relatorio?.entregueEm) || Boolean(f.caso?.encerradoEm)).toBe(true);
    }
  });

  it("todo tom pertence à gramática certificada — nenhuma cor avulsa", () => {
    for (const f of TODOS) {
      expect(PAPEIS_VISUAIS).toContain(lerEstado(f).tom);
    }
  });

  it("todo estado responde 'de quem é a vez' com um papel do vocabulário", () => {
    const PAPEIS = ["PACIENTE", "CURADOR", "EQUIPE", "SISTEMA", "NINGUEM", "INDETERMINADO"];
    for (const f of TODOS) {
      expect(PAPEIS).toContain(deQuemEAVez(f));
    }
  });

  it("verde nunca aparece antes de haver processo concluído", () => {
    for (const f of TODOS) {
      const leitura = lerEstado(f);
      if (leitura.tom !== "resolvido") continue;
      const concluido =
        Boolean(f.caso?.encerradoEm) ||
        Boolean(f.relatorio?.entregueEm) ||
        Boolean(f.historia?.enviadaEm);
      expect(concluido, `verde sem processo concluído em ${leitura.estado}`).toBe(true);
    }
  });
});

/**
 * F-1 · O GATE ENCONTROU CONCLUSÃO VIRANDO ENTREGA.
 *
 * O gatilho do banco grava `closed_at` para `CLOSED` **e** para `CANCELLED` —
 * reproduzido por mim em transação revertida contra o banco local:
 *
 *   PROVA >> status=CANCELLED closed_preenchido=t entregues=0
 *
 * Então encerrar não prova concluir, e concluir não prova entregar. Estes
 * testes existem para que nenhuma das duas confusões volte.
 */
describe("F-1 · encerrar não é concluir; concluir não é entregar", () => {
  const encerrado = (cancelado: boolean | null, entregueEm: string | null): FatosDoCaso =>
    fatos({
      historia: { existe: true, enviadaEm: "2026-07-01T10:00:00Z" },
      caso: { curadorResponsavel: "c", encerradoEm: "2026-08-03T10:00:00Z", cancelado },
      relatorio: { existe: true, emitidoEm: "2026-08-01T10:00:00Z", entregueEm },
    });

  it("A · CANCELLED com closed_at e sem entrega ⇒ nunca CASO_CONCLUIDO", () => {
    const leitura = lerEstado(encerrado(true, null));
    expect(leitura.estado).toBe("CASO_CANCELADO");
    expect(leitura.temConteudoParaPaciente).toBe(false);
    expect(leitura.acoesPaciente).not.toContain("VER_CURADORIA");
    expect(leitura.rotuloPaciente).not.toMatch(/concluída|pronta/i);
  });

  it("B · CLOSED com closed_at e sem entrega ⇒ conteúdo indisponível", () => {
    const leitura = lerEstado(encerrado(false, null));
    expect(leitura.estado).toBe("CASO_ENCERRADO_SEM_ENTREGA");
    expect(leitura.temConteudoParaPaciente).toBe(false);
    expect(leitura.acoesPaciente).toHaveLength(0);
    expect(leitura.rotuloPaciente).not.toMatch(/concluída/i);
  });

  it("C · emitido sem entrega ⇒ conteúdo indisponível", () => {
    const leitura = lerEstado(
      fatos({ relatorio: { existe: true, emitidoEm: "2026-08-01T10:00:00Z", entregueEm: null } }),
    );
    expect(leitura.temConteudoParaPaciente).toBe(false);
  });

  it("D · entregue ⇒ conteúdo disponível, e encerrar vira concluir de verdade", () => {
    const comEntrega = encerrado(false, "2026-08-04T10:00:00Z");
    expect(lerEstado(comEntrega).estado).toBe("CASO_CONCLUIDO");
    expect(lerEstado(comEntrega).temConteudoParaPaciente).toBe(true);
  });

  it("E · história ausente + relatório entregue ⇒ a entrega continua prevalecendo", () => {
    const semHistoria = fatos({
      historia: null,
      relatorio: {
        existe: true,
        emitidoEm: "2026-08-01T10:00:00Z",
        entregueEm: "2026-08-02T10:00:00Z",
      },
    });
    expect(lerEstado(semHistoria).estado).toBe("CURADORIA_ENTREGUE");
  });

  it("F · cancelamento nunca regride para pedir a história de novo", () => {
    const historias = [
      null,
      { existe: false, enviadaEm: null },
      { existe: true, enviadaEm: null },
      { existe: true, enviadaEm: "2026-07-01T10:00:00Z" },
    ];
    for (const historia of historias) {
      const leitura = lerEstado({
        historia,
        caso: { curadorResponsavel: null, encerradoEm: "2026-08-03T10:00:00Z", cancelado: true },
        relatorio: null,
        pendencia: null,
      });
      expect(leitura.estado).toBe("CASO_CANCELADO");
      expect(leitura.rotuloPaciente).not.toMatch(/conte sua/i);
    }
  });

  it("G · cancelamento desconhecido ⇒ não infere conclusão", () => {
    const leitura = lerEstado(encerrado(null, null));
    // `null` é "não sei se foi cancelado" — e não sabendo, não se afirma desfecho.
    expect(leitura.estado).toBe("CASO_ENCERRADO_SEM_ENTREGA");
    expect(leitura.temConteudoParaPaciente).toBe(false);
    expect(leitura.rotuloPaciente).not.toMatch(/concluída/i);
  });

  it("precedência: o fato mais específico vence — cancelamento acima de tudo", () => {
    const cancelado = encerrado(true, "2026-08-04T10:00:00Z");
    expect(lerEstado(cancelado).estado).toBe("CASO_CANCELADO");
    expect(lerEstado(cancelado).temConteudoParaPaciente).toBe(false);
  });
});

describe("F-1 · o invariante, varrido sobre todas as combinações", () => {
  const UNIVERSO: FatosDoCaso[] = [];
  for (const cancelado of [true, false, null] as const) {
    for (const encerradoEm of [null, "2026-08-03T10:00:00Z"]) {
      for (const entregueEm of [null, "2026-08-04T10:00:00Z"]) {
        for (const emitidoEm of [null, "2026-08-01T10:00:00Z"]) {
          UNIVERSO.push({
            historia: { existe: true, enviadaEm: "2026-07-01T10:00:00Z" },
            caso: { curadorResponsavel: "c", encerradoEm, cancelado },
            relatorio: emitidoEm || entregueEm ? { existe: true, emitidoEm, entregueEm } : null,
            pendencia: null,
          });
        }
      }
    }
  }

  it("são 24 combinações, e nenhuma escapa", () => {
    expect(UNIVERSO).toHaveLength(24);
  });

  it("conteúdo disponível ⟹ houve ENTREGA. Sem exceção.", () => {
    for (const f of UNIVERSO) {
      const leitura = lerEstado(f);
      if (!leitura.temConteudoParaPaciente) continue;
      const houveEntrega = Boolean(f.relatorio?.entregueEm);
      expect(houveEntrega, leitura.estado + " ofereceu conteúdo sem entrega").toBe(true);
    }
  });

  it("VER_CURADORIA ⟹ houve ENTREGA. Sem exceção.", () => {
    for (const f of UNIVERSO) {
      const leitura = lerEstado(f);
      if (!leitura.acoesPaciente.includes("VER_CURADORIA")) continue;
      const houveEntrega = Boolean(f.relatorio?.entregueEm);
      expect(houveEntrega, leitura.estado + " ofereceu ver sem entrega").toBe(true);
    }
  });

  it("cancelado ⟹ nunca conteúdo, nunca ação, nunca rótulo de conclusão", () => {
    for (const f of UNIVERSO.filter((x) => x.caso?.cancelado === true)) {
      const leitura = lerEstado(f);
      expect(leitura.temConteudoParaPaciente).toBe(false);
      expect(leitura.acoesPaciente).toHaveLength(0);
      expect(leitura.rotuloPaciente).not.toMatch(/concluída|pronta/i);
    }
  });
});

describe("F-3 · nenhuma ação pública sem produtor", () => {
  it("toda ação declarada é realmente produzida por algum ramo", async () => {
    const { readFileSync } = await import("node:fs");
    const fonte = readFileSync("src/foundation/contrato-de-estado.ts", "utf8");
    const inicio = fonte.indexOf("export type AcaoPermitida");
    expect(inicio, "o tipo sumiu — o recorte seria vazio").toBeGreaterThan(-1);
    const tipo = fonte.slice(inicio, fonte.indexOf(";", inicio));
    const declaradas = [...tipo.matchAll(/"([A-Z_]+)"/g)].map((m) => m[1]!);
    expect(declaradas.length).toBeGreaterThan(0);

    const corpo = fonte.slice(fonte.indexOf("export function lerEstado"));
    for (const acao of declaradas) {
      expect(corpo.includes('"' + acao + '"'), acao + " é API morta: declarada e nunca produzida").toBe(
        true,
      );
    }
  });

  it("RESPONDER_PENDENCIA saiu — e não volta por engano", async () => {
    const { readFileSync } = await import("node:fs");
    const fonte = readFileSync("src/foundation/contrato-de-estado.ts", "utf8");
    const inicio = fonte.indexOf("export type AcaoPermitida");
    const tipo = fonte.slice(inicio, fonte.indexOf(";", inicio));
    expect(tipo).not.toContain("RESPONDER_PENDENCIA");
  });

  it("mas a pendência continua mandando em quem age — o fato não sumiu", () => {
    const comPendencia = fatos({
      caso: { curadorResponsavel: "c", encerradoEm: null, cancelado: false },
      pendencia: { aberta: true, aguardando: "PACIENTE" },
    });
    expect(deQuemEAVez(comPendencia)).toBe("PACIENTE");
    expect(lerEstado(comPendencia).temPendencia).toBe(true);
  });
});
