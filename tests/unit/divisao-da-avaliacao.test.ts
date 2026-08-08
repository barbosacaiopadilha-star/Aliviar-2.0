import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  conceitosExigidos,
  julgamentoVigente,
  lacunasDeJuizo,
  regimeDaAvaliacao,
  type JulgamentoLido,
} from "@/modules/curadoria/julgamentos";
import { buildMesaEtapas, type MesaFacts } from "@/modules/curadoria/mesa-etapas";

/**
 * ITEM 2.3 — O DOMÍNIO PURO DA DIVISÃO E AS GUARDAS ESTÁTICAS (G-2.3-1..8).
 *
 * A metade viva — capabilities, JS3, RS-2.3-1, árbitros — está em
 * `tests/integration/divisao-da-avaliacao.integration.test.ts`. Aqui: a
 * derivação pura da etapa (exigidos, lacunas nomeadas, regime da flag) e as
 * varreduras que impedem a regressão de nascer no código.
 */

const RAIZ = process.cwd();
const MIGRATION_2_3 = "supabase/migrations/20260808250000_2_3_divisao_da_avaliacao.sql";

const sqlBruto = readFileSync(join(RAIZ, MIGRATION_2_3), "utf8");
const sql = sqlBruto
  .split("\n")
  .filter((linha) => !linha.trimStart().startsWith("--"))
  .join("\n");

const painel = readFileSync(join(RAIZ, "src/components/curadoria/mesa/painel-de-juizo.tsx"), "utf8");

function varrer(dir: string): string[] {
  return readdirSync(join(RAIZ, dir), { withFileTypes: true }).flatMap((entrada) => {
    const caminho = `${dir}/${entrada.name}`;
    if (entrada.isDirectory()) return varrer(caminho);
    return /\.tsx?$/.test(entrada.name) ? [caminho] : [];
  });
}

const FONTES = varrer("src");

let sequencia = 0;
function julgamento(extra: Partial<JulgamentoLido>): JulgamentoLido {
  sequencia += 1;
  return {
    id: `j-${sequencia}`,
    subcriterionCode: "FORMACAO",
    natureza: "TECNICO",
    state: "VIGENTE",
    conclusao: "Concluído.",
    motivo: null,
    versao: 1,
    versaoAnteriorId: null,
    actorId: "curador-1",
    actedAt: "2026-08-08T12:00:00Z",
    temSucessora: false,
    evidencias: [],
    ...extra,
  };
}

describe("§9 · os julgamentos exigidos — H8–H10 sempre; H11 pelo que o Case declarou", () => {
  it("sem conceito relacional declarado, os exigidos são exatamente os três técnicos", () => {
    expect(conceitosExigidos([]).map((c) => c.code)).toEqual([
      "FORMACAO",
      "EXPERIENCIA",
      "HISTORICO",
    ]);
  });

  it("cada relacional declarado entra como exigido — e código estranho é ignorado", () => {
    const exigidos = conceitosExigidos(["MODELO_DECISAO_COMPARTILHADA", "ACESSO_MODALIDADE"]);
    expect(exigidos.map((c) => c.code)).toEqual([
      "FORMACAO",
      "EXPERIENCIA",
      "HISTORICO",
      "MODELO_DECISAO_COMPARTILHADA",
    ]);
    expect(exigidos[3].natureza).toBe("RELACIONAL");
  });
});

describe("§9/§10 · lacunas nomeadas — a etapa diz qual conceito e por quê", () => {
  it("nenhum julgamento → três lacunas SEM_JUIZO", () => {
    const lacunas = lacunasDeJuizo([], []);
    expect(lacunas).toHaveLength(3);
    expect(new Set(lacunas.map((l) => l.motivo))).toEqual(new Set(["SEM_JUIZO"]));
  });

  it("vigente fecha a lacuna do conceito — as demais permanecem", () => {
    const lacunas = lacunasDeJuizo([julgamento({ subcriterionCode: "FORMACAO" })], []);
    expect(lacunas.map((l) => l.subcriterionCode)).toEqual(["EXPERIENCIA", "HISTORICO"]);
  });

  it("RETIRADO na ponta → JUIZO_RETIRADO: o conceito voltou a ausência", () => {
    const lacunas = lacunasDeJuizo([julgamento({ state: "RETIRADO" })], []);
    expect(lacunas.find((l) => l.subcriterionCode === "FORMACAO")?.motivo).toBe("JUIZO_RETIRADO");
  });

  it("SUPERADO sem sucessora → JUIZO_SUPERADO_POR_EVIDENCIA — a derivação do JS3", () => {
    const lacunas = lacunasDeJuizo([julgamento({ state: "SUPERADO", temSucessora: false })], []);
    expect(lacunas.find((l) => l.subcriterionCode === "FORMACAO")?.motivo).toBe(
      "JUIZO_SUPERADO_POR_EVIDENCIA",
    );
  });

  it("SUPERADO com sucessora VIGENTE não é lacuna — a cadeia seguiu (JS1)", () => {
    const v1 = julgamento({ state: "SUPERADO", temSucessora: true });
    const v2 = julgamento({ versao: 2, versaoAnteriorId: v1.id });
    expect(
      lacunasDeJuizo([v1, v2], []).find((l) => l.subcriterionCode === "FORMACAO"),
    ).toBeUndefined();
    expect(julgamentoVigente([v1, v2], "FORMACAO")?.versao).toBe(2);
  });

  it("H11 declarado sem juízo entra na conta das lacunas", () => {
    const lacunas = lacunasDeJuizo([], ["MODELO_PREFERENCIAS_E_RESTRICOES"]);
    expect(lacunas).toHaveLength(4);
    expect(lacunas[3]).toEqual({
      subcriterionCode: "MODELO_PREFERENCIAS_E_RESTRICOES",
      natureza: "RELACIONAL",
      motivo: "SEM_JUIZO",
    });
  });
});

describe("G-2.3-7 · o regime da etapa — a divisão por padrão, o 6×N pela flag", () => {
  const BASE: MesaFacts = {
    profileAcknowledged: true,
    mapPending: 0,
    professionalsFound: 2,
    awaitingAreaDeclaration: 0,
    eligible: 2,
    criteriaAwaiting: 5,
    julgamentosAguardando: 0,
    regimeDaAvaliacao: "JUIZO",
    selected: 0,
    reportExists: false,
    reportApproved: false,
    reportEmitted: false,
  };

  function avaliacao(facts: MesaFacts) {
    return buildMesaEtapas(facts).find((etapa) => etapa.id === "AVALIACAO")!;
  }

  it("regime JUIZO: a etapa conclui pelos julgamentos — o 6×N deixa de ser o critério", () => {
    // 5 critérios 6×N sem declaração e ZERO lacunas de juízo → PRONTA.
    expect(avaliacao(BASE).status).toBe("PRONTA");
    const pendente = avaliacao({ ...BASE, julgamentosAguardando: 4 });
    expect(pendente.status).toBe("PENDENTE");
    expect(pendente.pending).toBe("4 juízos aguardando o Curador.");
  });

  it("flag LEGADO_6XN restaura a conclusão antiga SEM PERDA — criterion_declarations decidem de novo", () => {
    const legado = avaliacao({ ...BASE, regimeDaAvaliacao: "LEGADO_6XN" });
    expect(legado.status).toBe("PENDENTE");
    expect(legado.pending).toBe("5 critérios sem avaliação.");
  });

  it("a flag lê o ambiente sem inventar valores", () => {
    expect(regimeDaAvaliacao(undefined)).toBe("JUIZO");
    expect(regimeDaAvaliacao("1")).toBe("LEGADO_6XN");
    expect(regimeDaAvaliacao("legado_6xn")).toBe("LEGADO_6XN");
    expect(regimeDaAvaliacao("0")).toBe("JUIZO");
  });
});

describe("G-2.3-1/6 (estática) · o JS3 só supersede; o writer aceita o árbitro", () => {
  it("a função do JS3 contém UPDATE e NENHUM insert — supersede, jamais cria", () => {
    const js3 = sql.slice(
      sql.indexOf("create or replace function curadoria.js3_evidencia_nova_supersede_juizo"),
      sql.indexOf("drop trigger if exists practice_evidence_js3_supersede_juizo"),
    );
    expect(js3).toContain("set state = 'SUPERADO'");
    expect(js3.includes("insert into"), "o JS3 passou a CRIAR julgamento (G-2.3-1)").toBe(false);
    expect(js3.includes("conclusao"), "o JS3 tocou em conclusão — cópia proibida").toBe(false);
  });

  it("o writer traduz a corrida: o handler de unique_violation existe — a constraint decide", () => {
    expect(sql).toContain("when unique_violation then");
  });

  it("nenhuma assinatura tem parâmetro de autor (G-2.3-3)", () => {
    expect(/p_actor|p_autor|actor_id\s+uuid.*default/.test(sql)).toBe(false);
  });

  it("gate-first no fonte da migration: is_curator_for_case antes do primeiro toque na entidade", () => {
    const registrar = sql.slice(
      sql.indexOf("create or replace function curadoria.registrar_julgamento"),
      sql.indexOf("comment on function curadoria.registrar_julgamento"),
    );
    expect(registrar.indexOf("is_curator_for_case")).toBeGreaterThan(-1);
    expect(registrar.indexOf("is_curator_for_case")).toBeLessThan(
      registrar.indexOf("from curadoria.curator_judgments"),
    );
  });

  it("G-2.3-7 · a migration não toca criterion_declarations — o legado fica intacto", () => {
    // No CÓDIGO — o cabeçalho da migration lavra a preservação por nome, e
    // citar a garantia não é violá-la.
    expect(sql.includes("criterion_declarations")).toBe(false);
  });
});

describe("G-2.3-2/8 (estática) · destino único; o cliente nunca toca a tabela; 2.C fechado", () => {
  it("NENHUM módulo de src acessa a tabela `curator_judgments` — só as capabilities via RPC", () => {
    const violadores = FONTES.filter((arquivo) => {
      const codigo = readFileSync(join(RAIZ, arquivo), "utf8");
      return /from\(\s*["']curator_judgment/.test(codigo);
    });
    expect(violadores).toEqual([]);
  });

  it("os únicos módulos que conhecem as capabilities são o repository de leitura e as actions", () => {
    const conhecem = FONTES.filter((arquivo) => {
      const codigo = readFileSync(join(RAIZ, arquivo), "utf8");
      return (
        codigo.includes("registrar_julgamento") ||
        codigo.includes("retirar_julgamento") ||
        codigo.includes("ler_julgamentos_para_avaliacao")
      );
    }).sort();
    expect(conhecem).toEqual([
      "src/modules/curadoria/julgamento-actions.ts",
      "src/modules/curadoria/julgamentos-repository.ts",
    ]);
  });

  it("nenhum destino paralelo nasceu: só a Mesa fala de julgamento; 2.C segue sem consumidor", () => {
    const decisora = FONTES.filter((arquivo) =>
      readFileSync(join(RAIZ, arquivo), "utf8").includes("decidir_proposta"),
    );
    expect(decisora, "o 2.3 virou pretexto para abrir o 2.C (G-2.3-8)").toEqual([]);
  });
});

describe("G-2.3-5 (estática) · a conclusão nasce vazia — zero minuta, zero carry-forward", () => {
  it("o estado inicial do campo é a string vazia, literal", () => {
    expect(painel).toContain('const [conclusao, setConclusao] = useState("")');
  });

  it("o formulário não alcança conclusão nenhuma — nem a vigente, nem a do histórico", () => {
    const formulario = painel.slice(
      painel.indexOf("function FormularioDeJuizo"),
      painel.indexOf("function BlocoDoConceito"),
    );
    expect(formulario.includes(".conclusao"), "o form leu uma conclusão existente (carry-forward)").toBe(
      false,
    );
    expect(formulario.includes("defaultValue"), "o form ganhou defaultValue — minuta proibida").toBe(
      false,
    );
  });

  it("a superfície não ordena nem sugere: nenhum caminho leva conclusão existente ao campo", () => {
    // Proibições PRECISAS de mecanismo (o texto da UI que NEGA sugestão pode
    // conter a palavra; o mecanismo, jamais): inicializar o estado com
    // conclusão, setar o campo a partir de julgamento, ou rotular recomendação.
    for (const proibido of [
      "setConclusao(conceito",
      "setConclusao(vigente",
      "useState(conceito",
      "value={conceito.vigente",
      "Recomendado",
      "recomendamos",
    ]) {
      expect(painel.includes(proibido), `a superfície sugere: ${proibido}`).toBe(false);
    }
  });
});
