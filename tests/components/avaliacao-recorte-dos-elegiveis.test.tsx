import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { EligibilityPanel } from "@/components/curadoria/cruzamento-mesa";

/**
 * A etapa AVALIAÇÃO recebe o recorte dos elegíveis, nunca a Rede inteira.
 *
 * O defeito medido: a etapa renderizava `<EligibilityPanel view={view} />` sem
 * recorte. Como a ordem de grupos começa por AGUARDANDO_DECLARACAO, todo
 * profissional ainda não declarado — que pertence à etapa REDE — vinha antes
 * dos elegíveis, empurrando para baixo justamente o que a etapa pede. Numa
 * Rede de 71, os 3 julgáveis ficavam depois de 68 cartões alheios à etapa.
 */

const ELEGIVEL = "11111111-1111-1111-1111-111111111111";
const AGUARDANDO = "22222222-2222-2222-2222-222222222222";

function profissional(id: string, displayName: string, state: string) {
  return {
    professionalProfileId: id,
    displayName,
    areaRawText: "Ortopedia geral",
    areaTags: [],
    areaSource: "cadastro",
    areaVerificationStatus: "não verificado",
    areaVerifiedAt: null,
    cityUf: "SP",
    declaration: null,
    eligibility: { state, reason: "", filters: [] },
  };
}

const view = {
  areaRequirement: "Coluna",
  profileAcknowledged: true,
  counts: { found: 2, selected: 0, awaiting: 1 },
  mapaPendentes: 0,
  comparison: [],
  professionals: [
    profissional(AGUARDANDO, "Aguardando Declaração", "AGUARDANDO_DECLARACAO"),
    profissional(ELEGIVEL, "Já Elegível", "ELEGIVEL"),
  ],
};

describe("AVALIAÇÃO — o recorte é o dos elegíveis", () => {
  it("com o recorte, quem ainda aguarda declaração não aparece na etapa", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<EligibilityPanel view={view as any} somente={[ELEGIVEL]} />);

    expect(screen.getByText("Já Elegível")).toBeInTheDocument();
    expect(screen.queryByText("Aguardando Declaração")).not.toBeInTheDocument();
  });

  it("sem recorte, a Rede inteira aparece — é o comportamento da etapa REDE", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<EligibilityPanel view={view as any} />);

    expect(screen.getAllByText("Já Elegível").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Aguardando Declaração").length).toBeGreaterThan(0);
  });
});
