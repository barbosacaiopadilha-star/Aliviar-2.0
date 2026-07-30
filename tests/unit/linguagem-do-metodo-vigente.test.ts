import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { COS_PHASE_DEFINITIONS } from "@/modules/curadoria/cos/phases";
import { CURADORIA_STEP_DESCRIPTIONS } from "@/modules/curadoria/types";

/**
 * M4 — A LINGUAGEM DAS SUPERFÍCIES ATIVAS É A DO MÉTODO VIGENTE.
 *
 * Guardas de texto sobre o que o Curador e a paciente realmente leem. O
 * critério não é "zero ocorrências no repositório" (histórico e órfãos da M5
 * seguem lá): é zero exposição ativa do modelo aposentado como regra vigente.
 */

/**
 * Comentário que EXPLICA a virada cita o vocabulário antigo de propósito — o
 * que se audita é o texto que chega à tela. Blocos `{/* … *\/}` e `/* … *\/`
 * são removidos inteiros, não linha a linha: um comentário JSX de três linhas
 * só tem a primeira começando com a marca de abertura.
 */
function semComentarios(fonte: string): string {
  return fonte
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((linha) => !linha.trimStart().startsWith("//"))
    .join("\n");
}

const ler = (relativo: string) =>
  semComentarios(readFileSync(join(process.cwd(), relativo), "utf8"));

describe("Metadados das fases exibidos ao Curador (NC-21)", () => {
  const tecnica = COS_PHASE_DEFINITIONS.CURADORIA_TECNICA;
  const prioridades = COS_PHASE_DEFINITIONS.PRIORIDADES;

  /** Tudo o que `StepMethodReference` renderiza de uma fase. */
  function textoVisivel(definition: typeof tecnica): string {
    return [
      definition.objective,
      ...definition.validations,
      ...definition.optionalInformation,
      ...definition.artifacts,
      ...definition.traceability.map((c) => `${c.source} ${c.section} ${c.rule}`),
    ].join(" ");
  }

  it("a fase de Curadoria Técnica não exibe artefatos nem validações aposentados", () => {
    const visivel = textoVisivel(tecnica);
    for (const proibido of [
      "Comparação calculada",
      "Mapa de Compatibilidade",
      "Registros de Exclusão",
      "análise que a fundamenta",
      "cobertura",
      "Moderada",
      "banda",
      "score",
    ]) {
      expect(visivel.toLowerCase().includes(proibido.toLowerCase()), proibido).toBe(false);
    }
  });

  it("a fase de Curadoria Técnica fala elegibilidade, Mapas e leitura do Motor", () => {
    const visivel = textoVisivel(tecnica);
    expect(visivel).toContain("Mapa de Prioridades");
    expect(visivel).toContain("Mapa do Profissional");
    expect(visivel).toContain("Motor de Compatibilidade");
    expect(visivel).toContain("elegíveis da Mesa");
  });

  it("C-01, C-05 e E-05 não constam mais dos metadados da fase", () => {
    const catalogo = [...tecnica.alerts, ...tecnica.exceptions].join(" ");
    expect(catalogo).not.toContain("C-01");
    expect(catalogo).not.toContain("C-05");
    expect(catalogo).not.toContain("E-05");
    // Os que ficam são os que o Motor de Condução realmente emite.
    expect(catalogo).toContain("C-06");
    expect(catalogo).toContain("E-01");
    expect(catalogo).toContain("E-02");
  });

  it("nenhuma fase exibe pontos, pesos ou orçamento como regra vigente", () => {
    for (const definition of Object.values(COS_PHASE_DEFINITIONS)) {
      const visivel = textoVisivel(definition).toLowerCase();
      for (const proibido of ["100 pontos", "cem pontos", "orçamento", "distribuir ", "soma "]) {
        expect(visivel.includes(proibido), `${definition.id} → ${proibido}`).toBe(false);
      }
      expect(visivel, definition.id).not.toMatch(/\bpeso[s]?\b/);
    }
  });

  it("a fase PRIORIDADES fala níveis e catálogo, sem código de inconsistência morto", () => {
    const visivel = textoVisivel(prioridades);
    expect(visivel).toContain("nível de importância");
    expect(visivel).toContain("escala fechada");
    for (const morto of ["I-01", "I-02", "I-03", "I-04", "I-05"]) {
      expect(prioridades.validations.join(" "), morto).not.toContain(morto);
    }
  });

  it("a descrição da etapa de raciocínio PRIORIZAR não fala em distribuir pontos", () => {
    expect(CURADORIA_STEP_DESCRIPTIONS.PRIORIZAR).not.toMatch(/100 pontos|distribuir/i);
    expect(CURADORIA_STEP_DESCRIPTIONS.PRIORIZAR).toContain("subcritério");
  });
});

describe("Como funciona, para a paciente (NC-20)", () => {
  const pagina = ler("src/app/portal-paciente/como-funciona/page.tsx");

  it("não descreve o método como distribuição de pontos ou pesos", () => {
    for (const proibido of ["cem pontos", "100 pontos", "distribuem", "orçamento", "saldo"]) {
      expect(pagina.toLowerCase().includes(proibido), proibido).toBe(false);
    }
    expect(pagina).not.toMatch(/\bpeso[s]?\b/i);
  });

  it("explica níveis de importância, o registro do profissional e a leitura sem nota", () => {
    expect(pagina).toContain("nível de importância");
    expect(pagina).toContain("confirmado");
    expect(pagina).toMatch(/sem nota/);
    expect(pagina).toContain("aderência");
  });

  it("a decisão final continua sendo dela, e nada de vocabulário técnico", () => {
    expect(pagina).toContain("decisão final é exclusivamente sua");
    for (const tecnico of [
      "case_priority_map",
      "professional_subcriterion_map",
      "NAO_INFORMADO",
      "ALTA_COMPATIBILIDADE",
      "ranking",
      "score",
    ]) {
      expect(pagina.includes(tecnico), tecnico).toBe(false);
    }
  });
});

describe("Estados vazios e rótulos do Curador", () => {
  it("nenhum vazio da Mesa promete dois resultados ou dois cruzamentos", () => {
    const vazios = ler("src/components/curadoria/mesa/mesa-vazios.tsx");
    expect(vazios).not.toContain("dois resultados");
    expect(vazios).not.toContain("dois cruzamentos");
    expect(vazios).toContain("A compatibilidade ainda não tem o que mostrar.");
  });

  it("os rótulos do Relatório falam prioridades, não pesos", () => {
    for (const relativo of [
      "src/components/curadoria/report-status.tsx",
      "src/components/curadoria/report-editor.tsx",
    ]) {
      const texto = ler(relativo);
      expect(texto.includes("relação com os pesos"), relativo).toBe(false);
      expect(texto.includes("pesos que ela"), relativo).toBe(false);
    }
    expect(ler("src/components/curadoria/report-status.tsx")).toContain(
      "relação com as prioridades declaradas",
    );
  });
});

describe("Superfícies ativas da Mesa e do paciente", () => {
  function fontes(dir: string): string[] {
    return readdirSync(join(process.cwd(), dir), { withFileTypes: true }).flatMap((entrada) => {
      const caminho = join(dir, entrada.name);
      if (entrada.isDirectory()) return fontes(caminho);
      return /\.tsx$/.test(entrada.name) ? [caminho] : [];
    });
  }

  // M5: a allowlist de órfãos deixou de existir — os arquivos que ela excluía
  // foram removidos do repositório. A varredura cobre o conjunto ativo inteiro.
  it("nenhuma superfície ativa da Mesa apresenta pontos, banda, score ou orçamento", () => {
    const arquivos = fontes("src/components/curadoria");

    expect(arquivos.length).toBeGreaterThan(10);

    for (const arquivo of arquivos) {
      const texto = semComentarios(readFileSync(join(process.cwd(), arquivo), "utf8"));
      for (const proibido of [
        "COMPATIBILITY_BAND_LABELS",
        "internalScore",
        "100 pontos",
        "saldo de pontos",
        "orçamento",
      ]) {
        expect(texto.includes(proibido), `${arquivo} → ${proibido}`).toBe(false);
      }
    }
  });
});
