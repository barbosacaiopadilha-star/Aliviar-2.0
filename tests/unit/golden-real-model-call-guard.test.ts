import { describe, expect, it } from "vitest";

import {
  REAL_MODEL_CALLS_BLOCKED_MESSAGE,
  REAL_MODEL_CALLS_MISCONFIGURED_MESSAGE,
  resolveRealModelCallGuardState,
} from "../golden/real-model-call-guard";

// Proteção contra chamadas reais acidentais ao Golden Set (incidente
// registrado em docs/ace/05-knowledge/golden-set-testing.md). Testado
// inteiramente offline — resolveRealModelCallGuardState é uma função pura,
// nunca instancia AnthropicAceLanguageModel nem faz qualquer chamada de
// rede. Nenhum destes testes pode, por construção, disparar uma chamada
// real.
describe("resolveRealModelCallGuardState (proteção do Golden Set)", () => {
  it("chave presente + autorização ausente → bloqueado", () => {
    const state = resolveRealModelCallGuardState({
      ALLOW_REAL_MODEL_CALLS: undefined,
      CLAUDE_API_KEY: "sk-ant-api03-fake-value",
    });

    expect(state.status).toBe("blocked");
  });

  it("chave ausente + autorização presente → erro de configuração, sem chamada", () => {
    const state = resolveRealModelCallGuardState({
      ALLOW_REAL_MODEL_CALLS: "true",
      CLAUDE_API_KEY: undefined,
    });

    expect(state.status).toBe("misconfigured");
  });

  it("chave presente + autorização explícita → autorizado", () => {
    const state = resolveRealModelCallGuardState({
      ALLOW_REAL_MODEL_CALLS: "true",
      CLAUDE_API_KEY: "sk-ant-api03-fake-value",
    });

    expect(state.status).toBe("authorized");
  });

  it.each(["false", "0", "", "1", "yes", "TRUE", "True", " true", "true ", "true\n"])(
    "comparação é estrita — valor de autorização %j nunca é interpretado como autorização válida (só a string exata \"true\" autoriza)",
    (value) => {
      const state = resolveRealModelCallGuardState({
        ALLOW_REAL_MODEL_CALLS: value,
        CLAUDE_API_KEY: "sk-ant-api03-fake-value",
      });

      expect(state.status).toBe("blocked");
    },
  );

  it("nenhuma chave ausente/presente sozinha altera o resultado sem autorização explícita", () => {
    const withoutKey = resolveRealModelCallGuardState({ ALLOW_REAL_MODEL_CALLS: undefined, CLAUDE_API_KEY: undefined });
    const withKey = resolveRealModelCallGuardState({ ALLOW_REAL_MODEL_CALLS: undefined, CLAUDE_API_KEY: "sk-ant-api03-fake-value" });

    expect(withoutKey.status).toBe("blocked");
    expect(withKey.status).toBe("blocked");
  });

  it("nenhum segredo aparece nas mensagens de bloqueio/configuração, mesmo quando a chave está presente no ambiente avaliado", () => {
    const fakeSecret = "sk-ant-api03-um-valor-que-nunca-pode-vazar";

    const blocked = resolveRealModelCallGuardState({ ALLOW_REAL_MODEL_CALLS: undefined, CLAUDE_API_KEY: fakeSecret });
    const misconfigured = resolveRealModelCallGuardState({ ALLOW_REAL_MODEL_CALLS: "true", CLAUDE_API_KEY: undefined });

    expect(blocked.status).toBe("blocked");
    expect(misconfigured.status).toBe("misconfigured");
    expect(REAL_MODEL_CALLS_BLOCKED_MESSAGE).not.toContain(fakeSecret);
    expect(REAL_MODEL_CALLS_MISCONFIGURED_MESSAGE).not.toContain(fakeSecret);
    expect(REAL_MODEL_CALLS_BLOCKED_MESSAGE).not.toMatch(/sk-ant/i);
    expect(REAL_MODEL_CALLS_MISCONFIGURED_MESSAGE).not.toMatch(/sk-ant/i);
  });
});
