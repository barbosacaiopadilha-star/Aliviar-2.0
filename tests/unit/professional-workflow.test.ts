import { describe, expect, it } from "vitest";

import {
  PROFESSIONAL_WORKFLOW_STEPS,
  professionalWorkflowStepHref,
  resolveProfessionalWorkflowStep,
} from "@/modules/profiles/professional-workflow";

describe("fluxo operacional do cadastro profissional", () => {
  it("mantém os quatro trabalhos separados e em ordem explícita", () => {
    // FUSÃO 6→4 (21/08, decidida pelo Fundador): "Publicação" e "Ciclo de
    // vida" eram duas telas para UMA máquina (o banco diz que publicar É
    // mudança de ciclo) e viraram "Rede"; "Documentos e formação" era o mesmo
    // assunto do Cadastro e entrou nele. Mapa e Protocolo seguem separados —
    // pelo peso e pela autoria (ADR-074) — até virarem roteiro de entrevista
    // no descongelamento.
    expect(PROFESSIONAL_WORKFLOW_STEPS.map((step) => step.id)).toEqual([
      "cadastro",
      "rede",
      "protocolo",
      "mapa",
    ]);
  });

  it("preserva links diretos e recusa etapas desconhecidas", () => {
    // A etapa saiu da QUERY e virou segmento de rota (2026-08-20). Com
    // `?etapa=`, as etapas eram a mesma rota: o roteador tratava a troca
    // como navegação já satisfeita, a URL não mudava e a tela ficava parada
    // depois de recarregar ou de salvar. Agora cada etapa é rota própria.
    expect(professionalWorkflowStepHref("prof-1", "mapa")).toBe(
      "/admin/profissionais/prof-1/mapa",
    );
    expect(resolveProfessionalWorkflowStep("mapa")).toBe("mapa");
    expect(resolveProfessionalWorkflowStep("inexistente")).toBe("cadastro");
    expect(resolveProfessionalWorkflowStep(undefined)).toBe("cadastro");
  });

  it("endereços das etapas extintas chegam ao lugar certo — nunca a 404, nunca ao Cadastro errado", () => {
    // Links salvos, revalidates antigos e abas abertas continuam funcionando:
    // a página redireciona para a etapa que absorveu o conteúdo.
    expect(resolveProfessionalWorkflowStep("publicacao")).toBe("rede");
    expect(resolveProfessionalWorkflowStep("documentos")).toBe("cadastro");
  });
});
