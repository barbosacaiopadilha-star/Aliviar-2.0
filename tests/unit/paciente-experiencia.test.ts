import { describe, expect, it } from "vitest";

import {
  buildPerfilView,
  mensagemPrincipal,
  PATIENT_FORBIDDEN_TERMS,
  STAGE_MESSAGES,
  violatesPatientVocabulary,
} from "@/modules/paciente/experiencia";
import { JORNADA_STAGES } from "@/modules/curadoria/jornada";

import { SUBCRITERION_CATALOG } from "@/modules/curadoria/mapa-prioridades";

const NIVEIS = ["MUITO_IMPORTANTE", "IMPORTANTE", "RELEVANTE", "POUCO_IMPORTANTE", "NAO_INFLUENCIA"] as const;

/** O Mapa inteiro classificado — o equivalente do "Perfil completo". */
const MAPA_COMPLETO = SUBCRITERION_CATALOG.map((entry, i) => ({
  subcriterionCode: entry.code,
  importance: NIVEIS[i % 5]!,
}));

describe("O Perfil — o que importa, sem número (ADR-042)", () => {
  it("nenhum mecanismo interno atravessa", () => {
    const texto = JSON.stringify(buildPerfilView(MAPA_COMPLETO, true));
    for (const proibido of ["20", "30", "40", "50", "pts", "pontos", "%"]) {
      expect(texto).not.toContain(proibido);
    }
  });

  it("agrupa por nível, na ordem da escala, e só mostra nível com item", () => {
    const view = buildPerfilView(
      [
        { subcriterionCode: "FORMACAO_RESIDENCIA", importance: "MUITO_IMPORTANTE" },
        { subcriterionCode: "MODELO_COMUNICACAO", importance: "IMPORTANTE" },
      ],
      true,
    );
    expect(view.prioridades.map((n) => n.level)).toEqual(["MUITO_IMPORTANTE", "IMPORTANTE"]);
    expect(view.prioridades[0]!.label).toBe("Muito importante");
    expect(view.prioridades[0]!.itens).toEqual(["Residência médica"]);
  });

  it("não esconde o que ela declarou como sem influência", () => {
    const view = buildPerfilView(
      [{ subcriterionCode: "ACESSO_LOCALIZACAO", importance: "NAO_INFLUENCIA" }],
      true,
    );
    expect(view.prioridades[0]!.label).toBe("Não influencia este caso");
    expect(view.prioridades[0]!.itens).toEqual(["Localização"]);
  });
});

describe("Construção do Perfil", () => {
  it("vazio: 0%, com a frase de começo de conversa", () => {
    const view = buildPerfilView([], false);
    expect(view.classificados).toBe(0);
    expect(view.prioridades).toEqual([]);
    expect(view.headline).toContain("sendo consolidado");
  });

  it("em construção: progresso parcial e a frase de construção conjunta", () => {
    const view = buildPerfilView(
      [
        { subcriterionCode: "FORMACAO_RESIDENCIA", importance: "MUITO_IMPORTANTE" },
        { subcriterionCode: "EXPERIENCIA_TEMPO_DE_PRATICA", importance: "IMPORTANTE" },
      ],
      false,
    );
    expect(view.classificados).toBe(2);
    expect(view.total).toBe(SUBCRITERION_CATALOG.length);
    expect(view.headline).toBe("Seu Perfil está sendo consolidado.");
  });

  it("completo sem validação não chega a 100 — falta o reconhecimento da pessoa", () => {
    const view = buildPerfilView(MAPA_COMPLETO, false);
    expect(view.classificados).toBe(SUBCRITERION_CATALOG.length);
    expect(view.validated, "falta o reconhecimento da pessoa").toBe(false);
  });

  it("validado fecha em 100 e a frase muda de dono", () => {
    const view = buildPerfilView(MAPA_COMPLETO, true);
    expect(view.validated).toBe(true);
    expect(view.headline).toContain("Este Perfil é seu");
  });

  it("os itens saem com o nome do catálogo canônico", () => {
    const view = buildPerfilView(MAPA_COMPLETO, true);
    const nomes = view.prioridades.flatMap((n) => n.itens);
    expect(nomes).toHaveLength(SUBCRITERION_CATALOG.length);
    for (const nome of nomes) {
      expect(SUBCRITERION_CATALOG.some((e) => e.name === nome), nome).toBe(true);
    }
  });
});

describe("Mensagem principal — uma por etapa, sempre sobre a história", () => {
  it("toda etapa da jornada tem mensagem", () => {
    for (const stage of JORNADA_STAGES) {
      expect(mensagemPrincipal(stage)).toBeTruthy();
    }
  });

  it("as frases-chave da experiência estão nas etapas certas", () => {
    expect(mensagemPrincipal("CURADORIA")).toBe(
      "Nossa equipe está comparando profissionais que respondam às prioridades que você definiu.",
    );
    expect(mensagemPrincipal("DOSSIE")).toContain("Sua Curadoria está pronta");
    expect(mensagemPrincipal("ESCOLHA")).toContain("decidir qual caminho faz mais sentido para você");
    expect(mensagemPrincipal("ACOMPANHAMENTO")).toBe("O Concierge assumiu o acompanhamento do seu caso.");
  });

  it("nenhuma mensagem viola o vocabulário do paciente", () => {
    for (const message of Object.values(STAGE_MESSAGES)) {
      expect(violatesPatientVocabulary(message), message).toBeNull();
    }
  });
});

describe("A fronteira de vocabulário", () => {
  it("pega nota, ranking, cobertura e mecanismo", () => {
    expect(violatesPatientVocabulary("Este caminho teve a maior nota")).toBe("nota");
    expect(violatesPatientVocabulary("ranking dos profissionais")).toBe("ranking");
    expect(violatesPatientVocabulary("Avaliação construída sobre 80 dos 100 pontos possíveis.")).toBe(
      "pontos possíveis",
    );
    expect(violatesPatientVocabulary("o motor comparou")).toBe("motor");
  });

  it("deixa passar a linguagem da experiência", () => {
    expect(violatesPatientVocabulary("Atende plenamente ao que você declarou como prioridade.")).toBeNull();
    expect(violatesPatientVocabulary("Ainda precisamos confirmar uma informação.")).toBeNull();
  });

  it("o Perfil inteiro passa pela própria fronteira", () => {
    const view = buildPerfilView(MAPA_COMPLETO, true);
    expect(violatesPatientVocabulary(JSON.stringify(view))).toBeNull();
  });

  it("a lista cobre os termos que os dois cruzamentos usam internamente", () => {
    expect(PATIENT_FORBIDDEN_TERMS).toContain("coveredWeight");
    expect(PATIENT_FORBIDDEN_TERMS).toContain("internalScore");
  });
});
