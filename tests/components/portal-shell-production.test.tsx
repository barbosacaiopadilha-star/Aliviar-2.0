import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PortalShell } from "@/components/curadoria/portal-shell";

// O aviso "dados de demonstração" era incondicional: um Atendente real,
// atendendo gente real, lia "ambiente de construção" no rodapé da própria
// ferramenta. Este teste pina o contrato: em produção o NÓ NÃO EXISTE —
// não é escondido por CSS, não é renderizado.

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

const AVISO = /dados de demonstração/i;

describe("PortalShell — aviso de ambiente", () => {
  it("fora de produção, o aviso aparece (para quem constrói saber onde está)", () => {
    render(
      <PortalShell homeHref="/atendimento" subtitle="Atendimento">
        <p>conteúdo</p>
      </PortalShell>,
    );
    expect(screen.getByText(AVISO)).toBeInTheDocument();
  });

  it("em produção, o aviso NÃO é renderizado", () => {
    vi.stubEnv("NODE_ENV", "production");
    render(
      <PortalShell homeHref="/atendimento" subtitle="Atendimento">
        <p>conteúdo</p>
      </PortalShell>,
    );
    expect(screen.queryByText(AVISO)).not.toBeInTheDocument();
  });

  it("na variante do paciente, nunca aparece — em ambiente nenhum", () => {
    render(
      <PortalShell homeHref="/portal-paciente" subtitle="Curadoria Médica" variant="patient">
        <p>conteúdo</p>
      </PortalShell>,
    );
    expect(screen.queryByText(AVISO)).not.toBeInTheDocument();
  });
});
