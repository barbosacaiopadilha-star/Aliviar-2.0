import { describe, expect, it } from "vitest";

import { getRoleHome } from "@/modules/auth/role-home";

describe("getRoleHome", () => {
  it("resolve a home de cada papel conhecido", () => {
    expect(getRoleHome(["administrador"])).toBe("/admin");
    expect(getRoleHome(["profissional"])).toBe("/profissional");
    // Paciente e Curador vão para as superfícies do Método, não para os
    // painéis do ACE antigo (consolidação, MISSÃO 210).
    expect(getRoleHome(["paciente"])).toBe("/portal-paciente");
    expect(getRoleHome(["curador_medico"])).toBe("/portal-curador");
    // Os três níveis humanos têm superfície própria.
    expect(getRoleHome(["atendente"])).toBe("/atendimento");
    expect(getRoleHome(["concierge"])).toBe("/acompanhamento");
  });

  it("nenhum papel operacional cai na Landing pública", () => {
    // O Curador não estava no mapa e caía em "/" ao logar sem `next`, como se
    // não tivesse conta. Este teste existe para que isso não volte.
    for (const role of ["administrador", "atendente", "curador_medico", "concierge", "paciente", "profissional"]) {
      expect(getRoleHome([role]), `${role} caiu na Landing`).not.toBe("/");
    }
  });

  // Mandar Atendente ou Concierge para /admin resolveria a navegação criando
  // escalada de privilégio — acesso a gestão de equipe e usuários.
  it("nenhum nível operacional vai parar no painel administrativo", () => {
    for (const role of ["atendente", "curador_medico", "concierge"]) {
      expect(getRoleHome([role]), `${role} recebeu acesso administrativo`).not.toBe("/admin");
    }
  });

  it("usa o fallback quando não há papel conhecido", () => {
    expect(getRoleHome([])).toBe("/");
    expect(getRoleHome(["papel-desconhecido"])).toBe("/");
    expect(getRoleHome([], "/outro")).toBe("/outro");
  });

  it("usa o primeiro papel conhecido quando há mais de um", () => {
    expect(getRoleHome(["papel-desconhecido", "paciente"])).toBe("/portal-paciente");
  });
});
