import { describe, expect, it } from "vitest";

import { JORNADA_FIXTURES } from "@/experience-layer/fixtures/jornada-fixtures";
import { mapAceExperienceModel } from "@/experience-layer/mappers/ace";
import { mapMinhaJornadaExperienceModel } from "@/experience-layer/mappers/minha-jornada";
import { mapOnboardingExperienceModel } from "@/experience-layer/mappers/onboarding";
import {
  resolveCanonicalExperience,
  resolveCanonicalRoute,
} from "@/experience-layer/resolve-canonical-experience";
import { resolverExperienceFlow } from "@/experience-flow";

describe("Experience Layer mappers", () => {
  it("mapeia onboarding para descoberta", () => {
    const model = mapOnboardingExperienceModel(JORNADA_FIXTURES.descoberta);
    expect(model?.etapa_atual_legivel).toBe("Conhecendo a Aliviar");
    expect(model?.etapas_fluxo.find((e) => e.codigo === "DESCOBERTA")?.status).toBe("ATUAL");
  });

  it("deriva mapa_etapas sem duplicar estado", () => {
    const model = mapMinhaJornadaExperienceModel(JORNADA_FIXTURES.ace);
    const atual = model.mapa_etapas.filter((e) => e.status === "ATUAL");
    expect(atual).toHaveLength(1);
    expect(atual[0]?.codigo).toBe("ACE");
  });

  it("mapeia ACE PRESENTE na etapa ACE", () => {
    const ace = mapAceExperienceModel(JORNADA_FIXTURES.ace);
    expect(ace?.visibilidade).toBe("PRESENTE");
    expect(ace?.ativo).toBe(true);
  });

  it("mapeia ACE SILENCIOSO na curadoria", () => {
    const ace = mapAceExperienceModel(JORNADA_FIXTURES.curadoria);
    expect(ace?.visibilidade).toBe("SILENCIOSO");
  });

  it("mapeia ACE AUSENTE na entrega", () => {
    const ace = mapAceExperienceModel(JORNADA_FIXTURES.entrega);
    expect(ace?.visibilidade).toBe("AUSENTE");
  });
});

describe("Canonical route resolution", () => {
  it("sem jornada retorna landing", () => {
    expect(resolveCanonicalRoute(null)).toBe("/");
  });

  it("onboarding fixtures redirecionam para /onboarding", () => {
    expect(resolveCanonicalRoute(JORNADA_FIXTURES.descoberta)).toBe("/onboarding");
    expect(resolveCanonicalRoute(JORNADA_FIXTURES.historia)).toBe("/onboarding");
  });

  it("pós-onboarding redireciona para minha-jornada", () => {
    expect(resolveCanonicalRoute(JORNADA_FIXTURES.ace)).toBe("/minha-jornada");
    expect(resolveCanonicalRoute(JORNADA_FIXTURES.curadoria)).toBe("/minha-jornada");
  });
});

describe("Experience Flow integration", () => {
  it("resolve snapshot completo para bloqueio", () => {
    const snapshot = resolveCanonicalExperience(JORNADA_FIXTURES["bloqueio-documento"]);
    expect(snapshot.onboarding).not.toBeNull();
    expect(snapshot.minhaJornada?.bloqueio).not.toBeNull();
    expect(snapshot.minhaJornada?.estado_visivel).toBe("AGUARDANDO_DOCUMENTOS");
  });

  it("navegação alinhada ao experience flow", () => {
    const view = JORNADA_FIXTURES.metodo;
    const flow = resolverExperienceFlow(view);
    expect(flow.onboarding?.ativo).toBe(true);
    expect(resolveCanonicalRoute(view)).toBe("/onboarding");
  });
});
