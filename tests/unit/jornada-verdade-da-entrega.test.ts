import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { MOCK_RECORDS } from "@/modules/curadoria/cos/mock-records";
import type { CuradoriaRecord } from "@/modules/curadoria/cos/types";
import { buildJornada } from "@/modules/curadoria/jornada";

/**
 * TRILHA B · 5A — VERDADE DA ENTREGA.
 *
 * Decisão de produto: três fatos independentes, nenhum implicando o outro.
 *
 *   `emittedAt`    → preparada dentro da Aliviar
 *   `presentedAt`  → houve conversa de apresentação
 *   `deliveredAt`  → conteúdo digital disponibilizado a ela
 *
 * O erro não era o critério do marco DOSSIE — ele se chama *"Dossiê
 * preparado"* e mede preparação. Era a frase, que dizia *"está pronto"* e se
 * lia como disponibilidade.
 *
 * A régua precisa suportar o estado legítimo em que a Curadora **apresentou os
 * caminhos** e o conteúdo digital **ainda não foi liberado** — sem apagar
 * nenhum dos dois fatos e sem inventar o terceiro.
 */

const base = Object.values(MOCK_RECORDS)[0]!;

function cenario(patch: {
  emittedAt?: string | null;
  deliveredAt?: string | null;
  presentedAt?: string | null;
}): CuradoriaRecord {
  return {
    ...base,
    relatorio: {
      ...base.relatorio,
      emittedAt: patch.emittedAt ?? null,
      deliveredAt: patch.deliveredAt ?? null,
    },
    devolutiva: { ...base.devolutiva, presentedAt: patch.presentedAt ?? null },
  };
}

const marco = (record: CuradoriaRecord, id: string) =>
  buildJornada(record).stages.find((s) => s.id === id)!;

const EMITIDO = "2026-07-20T09:00:00-03:00";
const APRESENTADO = "2026-07-21T16:00:00-03:00";
const ENTREGUE = "2026-07-22T10:00:00-03:00";

// §7 — os cenários que o domínio permite.
const A = cenario({ emittedAt: EMITIDO });
const B = cenario({ emittedAt: EMITIDO, presentedAt: APRESENTADO });
const C = cenario({ emittedAt: EMITIDO, deliveredAt: ENTREGUE });
const D = cenario({ emittedAt: EMITIDO, presentedAt: APRESENTADO, deliveredAt: ENTREGUE });
const E = cenario({});

describe("§6 · o estado da rosa: preparado + apresentado, NÃO entregue", () => {
  it("a preparação é reconhecida — a régua não diz que nada aconteceu", () => {
    expect(marco(B, "DOSSIE").status).toBe("CONCLUIDA");
  });

  it("a conversa é reconhecida — apresentar não depende de entregar", () => {
    expect(marco(B, "REUNIAO").status).toBe("CONCLUIDA");
  });

  it("mas o conteúdo digital NÃO é dado como disponível", () => {
    const texto = marco(B, "DOSSIE").description;
    expect(texto).not.toMatch(/disponível para você|está pronto/i);
    expect(texto).toMatch(/preparou/i);
  });

  it("e a régua não regride para um texto incompatível com a conversa já havida", () => {
    // A frase do Dossiê é a mesma antes e depois da conversa: quem conta que
    // ela aconteceu é o marco seguinte. Nenhum dos dois desmente o outro.
    expect(marco(B, "DOSSIE").description).toBe(marco(A, "DOSSIE").description);
    expect(marco(B, "REUNIAO").description).not.toBe(marco(A, "REUNIAO").description);
  });

  it("a fixture certificada segue exatamente como estava", () => {
    const fonte = readFileSync("src/modules/curadoria/cos/mock-records.ts", "utf8");
    expect(fonte).toContain('emittedAt: "2026-07-20T09:00:00-03:00"');
    expect(fonte).toContain("deliveredAt: null");
    expect(fonte).toContain('presentedAt: "2026-07-21T16:00:00-03:00"');
  });

  it("e o registro real dela continua produzindo a mesma etapa atual de antes", () => {
    // Guarda de não-regressão: a correção é de texto e de disponibilidade,
    // não de posição na régua.
    const rosa = Object.values(MOCK_RECORDS).find((r) => r.relatorio.emittedAt && !r.relatorio.deliveredAt);
    expect(rosa, "a fixture do cenário legítimo sumiu").toBeTruthy();
    expect(buildJornada(rosa!).currentStage).toBe("ESCOLHA");
  });
});

describe("§7 · os cenários possíveis, um a um", () => {
  it("A · emitido, sem apresentar, sem entregar", () => {
    expect(marco(A, "DOSSIE").status).toBe("CONCLUIDA");
    expect(marco(A, "REUNIAO").status).not.toBe("CONCLUIDA");
    expect(marco(A, "DOSSIE").description).not.toMatch(/disponível/i);
  });

  it("C · emitido e entregue, sem apresentar", () => {
    expect(marco(C, "DOSSIE").description).toMatch(/disponível para você/i);
    expect(marco(C, "REUNIAO").status).not.toBe("CONCLUIDA");
  });

  it("D · emitido, apresentado e entregue — os três reconhecidos", () => {
    expect(marco(D, "DOSSIE").status).toBe("CONCLUIDA");
    expect(marco(D, "DOSSIE").description).toMatch(/disponível para você/i);
    expect(marco(D, "REUNIAO").status).toBe("CONCLUIDA");
  });

  it("E · nada emitido, nada entregue — nada prometido", () => {
    expect(marco(E, "DOSSIE").status).not.toBe("CONCLUIDA");
    expect(marco(E, "DOSSIE").description).not.toMatch(/disponível|pronto/i);
  });

  it("a disponibilidade muda SÓ com `deliveredAt` — os outros dois não a movem", () => {
    const disponivel = (r: CuradoriaRecord) => /disponível para você/i.test(marco(r, "DOSSIE").description);
    expect(disponivel(A)).toBe(false); // emitido
    expect(disponivel(B)).toBe(false); // + apresentado
    expect(disponivel(C)).toBe(true); // + entregue
    expect(disponivel(D)).toBe(true);
  });
});

describe("§8 · a Curadoria digital só abre com entrega", () => {
  it("o carregador da paciente exige `delivered_at` — duas vezes, e sai vazio sem ele", () => {
    const fonte = readFileSync("src/modules/curadoria/patient-curadoria.ts", "utf8");
    const codigo = fonte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    expect(codigo).toContain("if (!selection?.delivered_at) return null");
    expect(codigo).toContain("if (!report?.delivered_at) return null");
    // E nenhum outro fato serve de porta.
    for (const atalho of ["emitted_at", "presented_at", "closed_at", "status_label"]) {
      expect(codigo, `${atalho} virou porta de entrada`).not.toContain(`!${atalho}`);
    }
  });
});

describe("§11 · provas de perda", () => {
  const fonte = readFileSync("src/modules/curadoria/jornada.ts", "utf8");
  const codigo = fonte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

  it("M1/M2 · a disponibilidade é declarada SÓ por `deliveredAt`", () => {
    const inicio = codigo.indexOf("const conteudoDisponivel");
    expect(inicio, "o critério de disponibilidade sumiu").toBeGreaterThan(-1);
    const linha = codigo.slice(inicio, codigo.indexOf(";", inicio));
    expect(linha).toContain("relatorio.deliveredAt");
    expect(linha).not.toContain("emittedAt");
    expect(linha).not.toContain("presentedAt");
  });

  it("M3 · a apresentação continua tendo marco próprio — ignorá-la derrubaria a rosa", () => {
    expect(codigo).toContain("devolutiva.presentedAt");
    expect(marco(B, "REUNIAO").status).toBe("CONCLUIDA");
  });

  it("M4 · nenhuma frase da régua promete conteúdo sem entrega", () => {
    for (const record of [A, B, E]) {
      for (const stage of buildJornada(record).stages) {
        expect(stage.description, stage.id).not.toMatch(/disponível para você/i);
      }
    }
  });
});
