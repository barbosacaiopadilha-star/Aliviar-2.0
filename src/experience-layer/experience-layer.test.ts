import { describe, expect, it } from "vitest";

import { mapAceExperienceModel } from "@/experience-layer/mappers/ace";
import { mapMinhaJornadaExperienceModel } from "@/experience-layer/mappers/minha-jornada";
import { mapOnboardingExperienceModel } from "@/experience-layer/mappers/onboarding";
import {
  resolveCanonicalExperience,
  resolveCanonicalRoute,
} from "@/experience-layer/resolve-canonical-experience";
import { resolverExperienceFlow } from "@/experience-flow";
import {
  buildJornadaViewAce,
  buildJornadaViewBloqueio,
  buildJornadaViewCuradoria,
  buildJornadaViewDescoberta,
  buildJornadaViewEntrega,
  buildJornadaViewMetodo,
} from "@/test/build-jornada-view";

describe("Experience Layer mappers", () => {
  it("mapeia onboarding para descoberta", () => {
    const model = mapOnboardingExperienceModel(buildJornadaViewDescoberta());
    expect(model?.etapa_atual_legivel).toBe("Conhecendo a Aliviar");
    expect(model?.etapas_fluxo.find((e) => e.codigo === "DESCOBERTA")?.status).toBe("ATUAL");
  });

  it("deriva mapa_etapas sem duplicar estado", () => {
    const model = mapMinhaJornadaExperienceModel(buildJornadaViewAce());
    const atual = model.mapa_etapas.filter((e) => e.status === "ATUAL");
    expect(atual).toHaveLength(1);
    expect(atual[0]?.codigo).toBe("ACE");
  });

  it("mapeia ACE PRESENTE na etapa ACE", () => {
    const ace = mapAceExperienceModel(buildJornadaViewAce());
    expect(ace?.visibilidade).toBe("PRESENTE");
    expect(ace?.ativo).toBe(true);
  });

  it("mapeia ACE SILENCIOSO na curadoria", () => {
    const ace = mapAceExperienceModel(buildJornadaViewCuradoria());
    expect(ace?.visibilidade).toBe("SILENCIOSO");
  });

  it("mapeia ACE AUSENTE na entrega", () => {
    const ace = mapAceExperienceModel(buildJornadaViewEntrega());
    expect(ace?.visibilidade).toBe("AUSENTE");
  });
});

describe("Canonical route resolution", () => {
  it("sem jornada retorna landing", () => {
    expect(resolveCanonicalRoute(null)).toBe("/");
  });

  it("onboarding views redirecionam para /onboarding", () => {
    expect(resolveCanonicalRoute(buildJornadaViewDescoberta())).toBe("/onboarding");
    expect(resolveCanonicalRoute(buildJornadaViewBloqueio())).toBe("/onboarding");
  });

  it("pós-onboarding redireciona para minha-jornada", () => {
    expect(resolveCanonicalRoute(buildJornadaViewAce())).toBe("/minha-jornada");
    expect(resolveCanonicalRoute(buildJornadaViewCuradoria())).toBe("/minha-jornada");
  });
});

describe("Experience Flow integration", () => {
  it("resolve snapshot completo para bloqueio", () => {
    const snapshot = resolveCanonicalExperience(buildJornadaViewBloqueio());
    expect(snapshot.onboarding).not.toBeNull();
    expect(snapshot.minhaJornada?.bloqueio).not.toBeNull();
    expect(snapshot.minhaJornada?.estado_visivel).toBe("AGUARDANDO_DOCUMENTOS");
  });

  it("navegação alinhada ao experience flow", () => {
    const view = buildJornadaViewMetodo();
    const flow = resolverExperienceFlow(view);
    expect(flow.onboarding?.ativo).toBe(true);
    expect(resolveCanonicalRoute(view)).toBe("/onboarding");
  });
});
