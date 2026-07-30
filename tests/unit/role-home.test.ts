import { describe, expect, it } from "vitest";

import { getAuthenticatedPortalCta, getRoleHome } from "@/modules/auth/role-home";

describe("getRoleHome", () => {
  it("resolve a home de cada papel conhecido", () => {
    expect(getRoleHome(["administrador"])).toBe("/admin");
    expect(getRoleHome(["profissional"])).toBe("/profissional");
    // Paciente e Curador vão para as superfícies do Método, não para os
    // painéis do ACE antigo (consolidação, MISSÃO 210).
    expect(getRoleHome(["paciente"])).toBe("/paciente");
    expect(getRoleHome(["curador_medico"])).toBe("/portal-curador");
    // Os três níveis humanos têm superfície própria — a que executa as
    // operações auditadas do domínio (Correção de Domínio, 2026-07-24).
    expect(getRoleHome(["atendente"])).toBe("/atendimento");
    expect(getRoleHome(["concierge"])).toBe("/acompanhamento");
  });

  it("nenhum papel operacional cai na Landing pública", () => {
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
    expect(getRoleHome(["papel-desconhecido", "paciente"])).toBe("/paciente");
  });
});

// O CTA da Landing deriva do MESMO mapa ROLE_HOME — este bloco garante que
// as duas visões nunca divergem (reintegração 2026-07-24: existiam dois
// mapas concorrentes, e é exatamente isso que não pode voltar).
describe("getAuthenticatedPortalCta", () => {
  it("prioriza a experiência do paciente sobre qualquer papel de equipe", () => {
    expect(getAuthenticatedPortalCta(["paciente", "administrador"])).toEqual({
      label: "Minha Jornada",
      href: "/paciente",
    });
  });

  it("aponta cada nível operacional para a própria superfície auditada", () => {
    expect(getAuthenticatedPortalCta(["curador_medico"])).toEqual({
      label: "Curadoria",
      href: "/portal-curador",
    });
    expect(getAuthenticatedPortalCta(["atendente"])).toEqual({
      label: "Atendimento",
      href: "/atendimento",
    });
    expect(getAuthenticatedPortalCta(["concierge"])).toEqual({
      label: "Acompanhamento",
      href: "/acompanhamento",
    });
  });

  it("aponta administrador para a visão executiva", () => {
    expect(getAuthenticatedPortalCta(["administrador"])).toEqual({
      label: "Centro de Operações",
      href: "/admin",
    });
  });

  it("retorna null sem papéis reconhecidos", () => {
    expect(getAuthenticatedPortalCta([])).toBeNull();
  });

  it("o CTA nunca contradiz o ROLE_HOME", () => {
    for (const role of ["paciente", "curador_medico", "atendente", "concierge", "administrador", "profissional"]) {
      const cta = getAuthenticatedPortalCta([role]);
      expect(cta?.href, `CTA de ${role} diverge do ROLE_HOME`).toBe(getRoleHome([role]));
    }
  });
});
