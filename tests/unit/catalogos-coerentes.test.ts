import { readFileSync } from "node:fs";
import path from "node:path";


import { describe, expect, it } from "vitest";

import { PRACTICE_CATALOG, PRACTICE_CONCEPTS_BY_CODE } from "@/modules/curadoria/evidencias-pratica";

/**
 * ACHADO 1 — DOIS CATÁLOGOS, ZERO DIVERGÊNCIA PERMITIDA.
 *
 * Enquanto a virada do catálogo no banco não acontece (missão própria: mexer
 * em `method_subcriteria` mudaria o universo do Motor e a completude do
 * Mapa), duas fontes convivem:
 *
 *   * `curadoria.method_subcriteria` — 26 conceitos, alimenta o MOTOR;
 *   * `PRACTICE_CATALOG` — 28 conceitos, alimenta a BASE e os PROTOCOLOS.
 *
 * 20 códigos existem nas duas. Sem guarda, renomear ou redefinir um deles
 * numa das pontas não quebraria nada — e a divergência só apareceria quando
 * o cruzamento de um Case real deixasse de encontrar o subcritério.
 *
 * Esta guarda lê a MIGRATION (fonte versionada do catálogo do banco, a mesma
 * que o `db push` aplica) e falha na primeira divergência. O teste de
 * integração `catalogos-coerentes.integration` faz o mesmo contra o banco de
 * verdade — este roda sem banco, em qualquer build.
 */

const MIGRATION = path.resolve(
  process.cwd(),
  "supabase/migrations/20260728010000_mapa_de_prioridades_do_case.sql",
);

/**
 * Os conceitos que a migration semeia, lidos SÓ do bloco do INSERT — a lista
 * do CHECK de grupos tem a mesma forma e entraria como conceito fantasma.
 */
function catalogoDoBanco(): Map<string, { group: string; name: string }> {
  const sql = readFileSync(MIGRATION, "utf8");
  const inicio = sql.indexOf("insert into curadoria.method_subcriteria");
  const fim = sql.indexOf("on conflict (code)", inicio);
  expect(inicio, "bloco de seed do catálogo não encontrado na migration").toBeGreaterThan(-1);
  expect(fim, "fim do bloco de seed não encontrado").toBeGreaterThan(inicio);

  const bloco = sql.slice(inicio, fim);
  const entradas = new Map<string, { group: string; name: string }>();
  for (const match of bloco.matchAll(/\(\s*'([A-Z_]+)',\s*'([A-Z_]+)',\s*'([^']+)'/g)) {
    entradas.set(match[1]!, { group: match[2]!, name: match[3]! });
  }
  return entradas;
}

/**
 * DIVERGÊNCIAS DE NOME CONHECIDAS E ACEITAS.
 *
 * A ADR-039 item 2 fixa que a identidade é o CÓDIGO, "estável independente do
 * texto visível" — então diferença de rótulo não quebra o cruzamento. Mas
 * deriva silenciosa é como a divergência real começa, e este conjunto existe
 * para que ela nunca seja silenciosa: qualquer nome novo em desacordo faz o
 * teste falhar.
 *
 * As cinco entradas NÃO são acidente: são as "definições estreitadas" que o
 * Catálogo Canônico 1.0.0 decidiu e registrou — quatro no eixo MODELO, para
 * tirar julgamento embutido dos rótulos ("o quanto se faz entender", "o
 * quanto decide junto"), e uma no prazo, que sempre tratou da primeira
 * consulta. O código carrega o 1.0.0; o banco ainda carrega o anterior.
 *
 * Emendar a migration aplicada está fora de questão. O alinhamento acontece
 * na virada do catálogo — missão própria, porque mexer em
 * `method_subcriteria` toca o universo do Motor.
 */
const DIVERGENCIAS_DE_NOME_ACEITAS: Record<string, { catalogo: string; banco: string }> = {
  ACESSO_PRAZO_PARA_CONSULTA: {
    catalogo: "Prazo para a primeira consulta",
    banco: "Prazo para a consulta",
  },
  MODELO_COMUNICACAO: { catalogo: "Como explica", banco: "Comunicação" },
  MODELO_DECISAO_COMPARTILHADA: {
    catalogo: "Como conduz decisões",
    banco: "Decisão compartilhada",
  },
  MODELO_PARTICIPACAO_FAMILIAR: {
    catalogo: "Participação de acompanhantes",
    banco: "Participação da família",
  },
  MODELO_PREFERENCIAS_E_RESTRICOES: {
    catalogo: "Respeito a recusas e restrições",
    banco: "Preferências e restrições",
  },
};

/** O eixo do Catálogo 1.0.0 mapeado para o grupo do banco. */
const EIXO_PARA_GRUPO: Record<string, string> = {
  ACESSO: "ACESSO",
  CONTINUIDADE_DO_CUIDADO: "CONTINUIDADE_DO_CUIDADO",
  MODELO_DE_ATENDIMENTO: "MODELO_DE_ATENDIMENTO",
  // PRATICA_E_TRAJETORIA reúne os três grupos técnicos do banco; VIABILIDADE
  // não existe lá — os dois casos são tratados à parte abaixo.
};

describe("Coerência entre os dois catálogos", () => {
  const banco = catalogoDoBanco();

  it("a migration do catálogo é legível e traz os 26 conceitos vigentes", () => {
    expect(banco.size).toBe(26);
  });

  it("os 20 códigos compartilhados continuam sendo exatamente 20", () => {
    expect(PRACTICE_CATALOG.filter((c) => banco.has(c.code))).toHaveLength(20);
  });

  it("nenhum nome divergiu além das divergências declaradas — deriva nova falha aqui", () => {
    const divergentes: Record<string, { catalogo: string; banco: string }> = {};

    for (const conceito of PRACTICE_CATALOG) {
      const noBanco = banco.get(conceito.code);
      if (!noBanco || noBanco.name === conceito.name) continue;
      divergentes[conceito.code] = { catalogo: conceito.name, banco: noBanco.name };
    }

    expect(
      divergentes,
      "Um nome mudou em uma das pontas sem a outra saber. Ou alinhe as duas, ou declare a divergência em DIVERGENCIAS_DE_NOME_ACEITAS com a razão.",
    ).toEqual(DIVERGENCIAS_DE_NOME_ACEITAS);
  });

  it("todo código compartilhado pertence ao MESMO grupo nas duas fontes", () => {
    for (const conceito of PRACTICE_CATALOG) {
      const noBanco = banco.get(conceito.code);
      if (!noBanco) continue;

      if (conceito.axis === "PRATICA_E_TRAJETORIA") {
        expect(
          ["FORMACAO", "EXPERIENCIA", "HISTORICO"],
          `"${conceito.code}" é técnico no catálogo, mas o banco o coloca em ${noBanco.group}.`,
        ).toContain(noBanco.group);
      } else {
        expect(
          noBanco.group,
          `"${conceito.code}" está em ${conceito.axis} no catálogo e em ${noBanco.group} no banco.`,
        ).toBe(EIXO_PARA_GRUPO[conceito.axis]);
      }
    }
  });

  it("os 8 conceitos só do catálogo 1.0.0 continuam FORA do banco — o universo do Motor não muda por acidente", () => {
    const soNoCatalogo = PRACTICE_CATALOG.filter((c) => !banco.has(c.code)).map((c) => c.code);
    expect(soNoCatalogo.sort()).toEqual([
      "ACESSO_LOCAL_DE_ATENDIMENTO",
      "CONTINUIDADE_CANAIS",
      "EXPERIENCIA_NO_TIPO_DE_CASO",
      "HISTORICO_AREAS_DE_ATUACAO",
      "HISTORICO_ATIVIDADE_ACADEMICA",
      "PRATICA_LIMITES_DE_ATUACAO",
      "VIABILIDADE_COBERTURA_E_CONVENIO",
      "VIABILIDADE_CUSTO_E_PAGAMENTO",
    ]);
  });

  it("os 6 conceitos só do banco continuam fora do catálogo 1.0.0 — foram fundidos, renomeados ou removidos por decisão", () => {
    const soNoBanco = [...banco.keys()].filter((code) => !PRACTICE_CONCEPTS_BY_CODE.has(code));
    expect(soNoBanco.sort()).toEqual([
      "ACESSO_LOCALIZACAO",
      "EXPERIENCIA_CASOS_SEMELHANTES",
      "EXPERIENCIA_CONDICAO_OU_PROCEDIMENTO",
      "HISTORICO_ENSINO_E_PESQUISA",
      "HISTORICO_PRODUCAO_ACADEMICA",
      "HISTORICO_REGULARIDADE",
    ]);
  });

  it("nenhuma fonte ganhou conceito sem a outra saber: as duas contagens são as esperadas", () => {
    expect(PRACTICE_CATALOG).toHaveLength(28);
    expect(banco.size).toBe(26);
    const compartilhados = PRACTICE_CATALOG.filter((c) => banco.has(c.code)).length;
    expect(compartilhados + 8).toBe(28);
    expect(compartilhados + 6).toBe(26);
  });
});
