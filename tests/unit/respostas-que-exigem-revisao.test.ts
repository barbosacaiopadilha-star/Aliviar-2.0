import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PERSON_PROTOCOL } from "@/modules/curadoria/protocolos";
import type { CaseNeedRecord } from "@/modules/curadoria/protocolos-repository";
import {
  NADA_A_REVISAR,
  ordenarPelaRevisao,
  respostasQueExigemRevisao,
} from "@/modules/curadoria/respostas-que-exigem-revisao";

/**
 * ITEM 1.10C-A — O RETORNO DOS DESFECHOS AO CURADOR.
 *
 * Desde o PP-03C ela discorda por conta própria. O que estes testes protegem é
 * que ele VEJA: que a discordância suba, que o texto dela chegue inteiro, que
 * o silêncio dela nunca vire cobrança a ele, e que a fonte seja `case_needs` —
 * nunca a trilha de auditoria, que existe para auditar, não para operar.
 */

const CODIGOS = PERSON_PROTOCOL.map((pergunta) => pergunta.subcriterionCode);

function need(overrides: Partial<CaseNeedRecord> & { subcriterionCode: string }): CaseNeedRecord {
  return {
    caseId: "c1",
    options: [],
    degree: "ESSENCIAL",
    flexibility: null,
    guidedText: null,
    origin: "TRADUCAO",
    proposedReading: "Entendi assim.",
    acknowledgment: "PENDENTE",
    correction: null,
    declaredBy: "curador",
    declaredAt: "2026-08-01T10:00:00.000Z",
    ...overrides,
  } as CaseNeedRecord;
}

describe("pré-condições do oráculo", () => {
  it("o Protocolo tem perguntas suficientes para a ordenação significar algo", () => {
    expect(CODIGOS.length).toBeGreaterThan(10);
    expect(new Set(CODIGOS).size).toBe(CODIGOS.length);
  });
});

describe("A1 · a ordem em que ele precisa ver", () => {
  it("RECUSADA vem antes de CORRIGIDA, e as duas antes de todo o resto", () => {
    const needs = [
      need({ subcriterionCode: CODIGOS[5]!, acknowledgment: "CORRIGIDA", correction: "ajuste" }),
      need({ subcriterionCode: CODIGOS[9]!, acknowledgment: "RECUSADA", correction: "não foi" }),
    ];

    expect(respostasQueExigemRevisao(needs).map((r) => r.desfecho)).toEqual([
      "RECUSADA",
      "CORRIGIDA",
    ]);
  });

  it("dentro de cada desfecho, a ordem é a do Protocolo — a da conversa", () => {
    const needs = [
      need({ subcriterionCode: CODIGOS[7]!, acknowledgment: "RECUSADA", correction: "b" }),
      need({ subcriterionCode: CODIGOS[2]!, acknowledgment: "RECUSADA", correction: "a" }),
      need({ subcriterionCode: CODIGOS[8]!, acknowledgment: "CORRIGIDA", correction: "d" }),
      need({ subcriterionCode: CODIGOS[3]!, acknowledgment: "CORRIGIDA", correction: "c" }),
    ];

    expect(respostasQueExigemRevisao(needs).map((r) => r.subcriterionCode)).toEqual([
      CODIGOS[2],
      CODIGOS[7],
      CODIGOS[3],
      CODIGOS[8],
    ]);
  });

  it("a lista do Protocolo sobe as contestadas e mantém o resto na ordem da conversa", () => {
    const needs = [
      need({ subcriterionCode: CODIGOS[10]!, acknowledgment: "CORRIGIDA", correction: "x" }),
      need({ subcriterionCode: CODIGOS[12]!, acknowledgment: "RECUSADA", correction: "y" }),
    ];

    const ordenadas = ordenarPelaRevisao(PERSON_PROTOCOL, needs).map((p) => p.subcriterionCode);

    expect(ordenadas.slice(0, 2)).toEqual([CODIGOS[12], CODIGOS[10]]);
    // Nenhuma pergunta some do painel dele: só a ordem muda.
    expect(new Set(ordenadas)).toEqual(new Set(CODIGOS));
    expect(ordenadas).toHaveLength(CODIGOS.length);
    // E o resto preserva a ordem do Protocolo.
    const resto = ordenadas.slice(2);
    const esperado = CODIGOS.filter((c) => c !== CODIGOS[10] && c !== CODIGOS[12]);
    expect(resto).toEqual(esperado);
  });

  it("sem nada a revisar, a lista do Protocolo fica exatamente como estava", () => {
    expect(ordenarPelaRevisao(PERSON_PROTOCOL, []).map((p) => p.subcriterionCode)).toEqual(CODIGOS);
  });
});

describe("A2 · o texto dela, inteiro", () => {
  it("chega palavra por palavra — nunca resumido, nunca cortado", () => {
    const texto =
      "Não foi isso que eu disse. Eu falei que aceito conversar sobre cirurgia, mas só depois " +
      "de tentar o tratamento clínico por pelo menos seis meses, e com a minha irmã presente na " +
      "consulta, porque ela é quem me acompanha nos retornos e lembra das coisas que eu esqueço.";

    const [resposta] = respostasQueExigemRevisao([
      need({ subcriterionCode: CODIGOS[0]!, acknowledgment: "RECUSADA", correction: texto }),
    ]);

    expect(resposta!.texto).toBe(texto);
    expect(resposta!.texto).not.toContain("…");
    expect(resposta!.texto).not.toContain("...");
  });

  it("a leitura DELE vem junto — ele precisa ver o que ela contestou", () => {
    const [resposta] = respostasQueExigemRevisao([
      need({
        subcriterionCode: CODIGOS[0]!,
        acknowledgment: "CORRIGIDA",
        correction: "quase",
        proposedReading: "Entendi que você aceita cirurgia.",
      }),
    ]);

    expect(resposta!.leituraProposta).toBe("Entendi que você aceita cirurgia.");
    expect(resposta!.pergunta.length).toBeGreaterThan(0);
  });

  it("registro antigo sem texto não vira string falsa — vira vazio, e a tela diz isso", () => {
    const [resposta] = respostasQueExigemRevisao([
      need({ subcriterionCode: CODIGOS[0]!, acknowledgment: "RECUSADA", correction: null }),
    ]);

    expect(resposta!.texto).toBe("");
  });
});

describe("A4 · PENDENTE é ausência de ato, nunca pendência dele", () => {
  it("PENDENTE não entra na lista", () => {
    const needs = CODIGOS.map((code) => need({ subcriterionCode: code }));
    expect(respostasQueExigemRevisao(needs)).toEqual([]);
  });

  it("RECONHECIDA também não entra — concordância não exige revisão", () => {
    const needs = CODIGOS.map((code) =>
      need({ subcriterionCode: code, acknowledgment: "RECONHECIDA" }),
    );
    expect(respostasQueExigemRevisao(needs)).toEqual([]);
  });

  it("o silêncio dela não vira cobrança a ele nem quando o Case é só silêncio", () => {
    const needs = [
      need({ subcriterionCode: CODIGOS[0]! }),
      need({ subcriterionCode: CODIGOS[1]!, acknowledgment: "RECONHECIDA" }),
    ];

    expect(respostasQueExigemRevisao(needs)).toHaveLength(0);
  });
});

describe("A3 · a pendência deriva de duas condições, e só delas", () => {
  it("sem tradução não há o que contestar — resposta direta fica de fora", () => {
    for (const origin of ["DIRETO", "DECLARACAO_CLINICA"] as const) {
      const needs = [
        need({
          subcriterionCode: CODIGOS[0]!,
          origin,
          acknowledgment: "RECUSADA",
          correction: "texto",
        }),
      ];
      expect(respostasQueExigemRevisao(needs), origin).toEqual([]);
    }
  });

  it("tradução contestada entra; tudo o mais fica fora", () => {
    const needs = [
      need({ subcriterionCode: CODIGOS[0]!, acknowledgment: "RECUSADA", correction: "a" }),
      need({ subcriterionCode: CODIGOS[1]!, acknowledgment: "CORRIGIDA", correction: "b" }),
      need({ subcriterionCode: CODIGOS[2]!, acknowledgment: "RECONHECIDA" }),
      need({ subcriterionCode: CODIGOS[3]! }),
      need({ subcriterionCode: CODIGOS[4]!, origin: "DIRETO", acknowledgment: "RECONHECIDA" }),
    ];

    expect(respostasQueExigemRevisao(needs).map((r) => r.subcriterionCode)).toEqual([
      CODIGOS[0],
      CODIGOS[1],
    ]);
  });
});

describe("A6/A7 · fonte única, e nenhuma autoridade nova", () => {
  const fonte = readFileSync(
    join(process.cwd(), "src/modules/curadoria/respostas-que-exigem-revisao.ts"),
    "utf8",
  );
  const painel = readFileSync(
    join(process.cwd(), "src/components/curadoria/protocolo-pessoa-panel.tsx"),
    "utf8",
  );

  it("A6 · nada vem de `audit_logs` — a trilha é evidência, não fonte", () => {
    // Sem os comentários: os dois arquivos citam `audit_logs` de propósito, ao
    // explicar por que NÃO a usam. O que se audita é o código.
    const semComentarios = (texto: string) =>
      texto
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .split("\n")
        .filter((linha) => !linha.trimStart().startsWith("//"))
        .join("\n");

    for (const arquivo of [fonte, painel]) {
      const codigo = semComentarios(arquivo);
      expect(codigo.includes("audit_logs")).toBe(false);
      expect(codigo.includes("need_acknowledged")).toBe(false);
      expect(codigo.includes("audit")).toBe(false);
    }

    // E a fonte de verdade é nomeada: o módulo só conhece `CaseNeedRecord`.
    expect(fonte).toContain("CaseNeedRecord");
  });

  it("nenhuma persistência nova: o módulo não escreve nem consulta", () => {
    for (const proibido of [".from(", ".rpc(", "insert(", "update(", "upsert(", "supabase"]) {
      expect(fonte.includes(proibido), `o módulo faz ${proibido}`).toBe(false);
    }
  });

  it("A7 · o bloco de revisão não oferece ação nenhuma", () => {
    const bloco = painel.slice(
      painel.indexOf("Respostas dela que exigem revisão"),
      painel.indexOf("<ul className=\"space-y-2\">"),
    );

    expect(bloco.length).toBeGreaterThan(200);
    expect(bloco.includes("<Button"), "o bloco de leitura ganhou um botão").toBe(false);
    expect(bloco.includes("onClick"), "o bloco de leitura ganhou uma ação").toBe(false);
    expect(bloco.includes("Action"), "o bloco de leitura chamou uma action").toBe(false);
  });

  it("nenhuma retradução ou resolução foi antecipada (DT-72 · 1.10C-B)", () => {
    for (const futuro of ["retraduz", "Retraduz", "resolver", "Resolver", "reabrir"]) {
      expect(painel.includes(futuro), `o painel antecipou "${futuro}"`).toBe(false);
    }
  });
});

describe("A5 · quando não há nada, o bloco diz que não há", () => {
  it("a frase existe e é a exigida", () => {
    expect(NADA_A_REVISAR).toBe("Nenhuma resposta da paciente exige revisão neste momento.");
  });

  it("o painel a exibe em vez de esconder o bloco", () => {
    const painel = readFileSync(
      join(process.cwd(), "src/components/curadoria/protocolo-pessoa-panel.tsx"),
      "utf8",
    );

    expect(painel).toContain("NADA_A_REVISAR");
    // O título do bloco fica FORA do condicional: ele nunca some.
    const titulo = painel.indexOf("Respostas dela que exigem revisão");
    const condicional = painel.indexOf("revisao.length === 0");
    expect(titulo).toBeLessThan(condicional);
  });
});
