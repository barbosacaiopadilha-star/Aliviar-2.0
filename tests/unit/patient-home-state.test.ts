import { describe, expect, it } from "vitest";

import { lerEstado, type FatosDoCaso } from "@/foundation/contrato-de-estado";
import { derivePatientPending } from "@/modules/paciente/next-action";

/**
 * TRILHA A · 4A — ESTADO COMO VERDADE.
 *
 * Este arquivo testava `derivePatientHomeState`, um segundo motor de
 * macroestado que decidia a Home sem saber de entrega, emissão, encerramento
 * ou cancelamento. **Ele foi aposentado**, e o que se testa agora é a verdade
 * única: fatos reais → contrato congelado → pendência.
 *
 * Cada caso abaixo é uma contradição registrada pela auditoria.
 */

const BASE: FatosDoCaso = {
  historia: { existe: false, enviadaEm: null },
  caso: null,
  relatorio: null,
  pendencia: null,
};

const fatos = (patch: Partial<FatosDoCaso>): FatosDoCaso => ({ ...BASE, ...patch });

const ENTREGUE = fatos({
  historia: { existe: true, enviadaEm: "enviada" },
  caso: { curadorResponsavel: "c", encerradoEm: null, cancelado: false },
  relatorio: { existe: true, emitidoEm: null, entregueEm: "2026-08-02T10:00:00Z" },
});

const EMITIDO = fatos({
  historia: { existe: true, enviadaEm: "enviada" },
  caso: { curadorResponsavel: "c", encerradoEm: null, cancelado: false },
  relatorio: { existe: true, emitidoEm: "2026-08-01T10:00:00Z", entregueEm: null },
});

const CANCELADO = fatos({
  historia: { existe: true, enviadaEm: "enviada" },
  caso: { curadorResponsavel: "c", encerradoEm: "2026-08-03T10:00:00Z", cancelado: true },
});

const ENCERRADO = fatos({
  historia: { existe: true, enviadaEm: "enviada" },
  caso: { curadorResponsavel: "c", encerradoEm: "2026-08-03T10:00:00Z", cancelado: false },
});

/** O que a Home efetivamente diz e oferece, pelo caminho real da página. */
function home(f: FatosDoCaso) {
  const leitura = lerEstado(f);
  const pending = derivePatientPending({ leitura, jornada: null });
  const texto =
    pending.kind === "action"
      ? [pending.action.title, pending.action.why, pending.action.whatHappensNext].join(" ")
      : [pending.message, pending.whatHappensNext].join(" ");
  const cta = pending.kind === "action" ? pending.action.cta : null;
  return { leitura, pending, texto, cta };
}

describe("A · Curadoria entregue ⇒ a Home nunca pede a primeira história", () => {
  it("não pede história, e reconhece o avanço", () => {
    const { leitura, texto, cta } = home(ENTREGUE);
    expect(leitura.estado).toBe("CURADORIA_ENTREGUE");
    expect(texto).not.toMatch(/conhecer a sua história|contar minha história|conte sua/i);
    expect(cta?.href).toBe("/paciente/curadoria");
  });

  it("e o defeito é estrutural: nem sem história a Home regride", () => {
    // Era exatamente isto que acontecia — sem Case legível, a Home caía no
    // começo mesmo com a Curadoria entregue.
    for (const historia of [null, { existe: false, enviadaEm: null }]) {
      expect(home({ ...ENTREGUE, historia }).leitura.estado).toBe("CURADORIA_ENTREGUE");
    }
  });
});

describe("C/D · emitir não é entregar", () => {
  it("emitido e não entregue: a Home não diz que a Curadoria saiu", () => {
    const { leitura, texto, cta } = home(EMITIDO);
    expect(leitura.estado).toBe("RELATORIO_EMITIDO");
    expect(leitura.temConteudoParaPaciente).toBe(false);
    expect(texto).not.toMatch(/pronta|entregue|disponível/i);
    expect(cta).toBeNull();
  });

  it("entregue: aí sim há conteúdo e destino", () => {
    expect(home(ENTREGUE).leitura.temConteudoParaPaciente).toBe(true);
  });
});

describe("E/F · encerrar não é concluir", () => {
  it("cancelado: nenhuma Curadoria concluída, nenhum acesso", () => {
    const { leitura, texto, cta } = home(CANCELADO);
    expect(leitura.estado).toBe("CASO_CANCELADO");
    expect(texto).not.toMatch(/concluída|pronta/i);
    expect(cta).toBeNull();
    expect(leitura.acoesPaciente).toHaveLength(0);
  });

  it("encerrado sem entrega: zero acesso falso à Curadoria", () => {
    const { leitura, cta } = home(ENCERRADO);
    expect(leitura.estado).toBe("CASO_ENCERRADO_SEM_ENTREGA");
    expect(leitura.temConteudoParaPaciente).toBe(false);
    expect(cta).toBeNull();
  });
});

describe("G/H · de quem é a vez", () => {
  it("a vez dela ⇒ a Home oferece ação real", () => {
    const { leitura, cta } = home(BASE);
    expect(leitura.quemAge).toBe("PACIENTE");
    expect(cta).not.toBeNull();
  });

  it("a vez da equipe ⇒ a Home NÃO inventa ação para ela", () => {
    const { leitura, cta, pending } = home(EMITIDO);
    expect(leitura.quemAge).toBe("EQUIPE");
    expect(cta).toBeNull();
    expect(pending.kind).toBe("nothing");
  });
});

describe("I/J · fallback seguro e o statusLabel sem poder", () => {
  it("fatos desconhecidos ⇒ nada é pedido e nada é prometido", () => {
    const { leitura, texto, cta } = home(fatos({ historia: null }));
    expect(leitura.estado).toBe("INDETERMINADO");
    expect(cta).toBeNull();
    expect(texto).not.toMatch(/pronta|em breve|\d+\s*dias?/i);
  });

  it("`statusLabel` não entra na derivação — nem por engano", async () => {
    // Guarda arquitetural: o macroestado sai de `lerEstado(fatos)`, e os fatos
    // não têm campo de texto. Não existe caminho para um rótulo governar.
    const { readFileSync } = await import("node:fs");
    const bruto = readFileSync("src/modules/paciente/fatos-do-caso.ts", "utf8");
    expect(bruto.length).toBeGreaterThan(0);
    // Sem comentários: a docstring cita `status_label` justamente para
    // explicar por que a view não serve — e explicação não é código.
    const codigo = bruto.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    expect(codigo).not.toContain("statusLabel");
    expect(codigo).not.toContain("status_label");
  });
});

describe("§17 · o motor local concorrente não pode voltar", () => {
  it("`home-state.ts` não existe mais", async () => {
    const { existsSync } = await import("node:fs");
    expect(existsSync("src/modules/paciente/home-state.ts")).toBe(false);
  });

  it("nenhuma superfície da paciente decide macroestado por conta própria", async () => {
    const { readFileSync } = await import("node:fs");
    for (const arquivo of [
      "src/app/paciente/page.tsx",
      "src/components/paciente/patient-home-state.tsx",
      "src/modules/paciente/next-action.ts",
    ]) {
      const fonte = readFileSync(arquivo, "utf8");
      const semComentarios = fonte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
      expect(semComentarios, `${arquivo} voltou a derivar estado local`).not.toMatch(
        /derivePatientHomeState|kind === "(no_story|draft|case_available)"/,
      );
    }
  });
});
