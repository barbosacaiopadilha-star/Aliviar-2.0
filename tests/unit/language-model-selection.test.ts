import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AceLanguageModelConfigurationError,
  getAceLanguageModel,
  getAceLanguageModelHealth,
} from "@/modules/concierge/language-model";
import { AnthropicAceLanguageModel } from "@/modules/concierge/anthropic-language-model";
import { FakeAceLanguageModel } from "@/modules/concierge/fake-language-model";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Seleção do AceLanguageModel por ambiente (GO LIVE — proteção obrigatória)", () => {
  it("desenvolvimento sem ANTHROPIC_API_KEY: retorna FakeAceLanguageModel", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ANTHROPIC_API_KEY", "");

    const model = await getAceLanguageModel();
    expect(model).toBeInstanceOf(FakeAceLanguageModel);

    const health = getAceLanguageModelHealth();
    expect(health).toEqual({ status: "FAKE_MODEL_NON_PRODUCTION", healthy: true });
  });

  it("teste/CI sem ANTHROPIC_API_KEY: retorna FakeAceLanguageModel (NODE_ENV=test, já o ambiente desta suíte)", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");

    const model = await getAceLanguageModel();
    expect(model).toBeInstanceOf(FakeAceLanguageModel);
  });

  it("produção com ANTHROPIC_API_KEY: retorna AnthropicAceLanguageModel", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-fake-key-for-test");

    const model = await getAceLanguageModel();
    expect(model).toBeInstanceOf(AnthropicAceLanguageModel);

    const health = getAceLanguageModelHealth();
    expect(health).toEqual({ status: "ANTHROPIC_CONFIGURED", healthy: true });
  });

  it("produção sem ANTHROPIC_API_KEY: falha explicitamente, nunca instancia o modelo fake", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ANTHROPIC_API_KEY", "");

    await expect(getAceLanguageModel()).rejects.toBeInstanceOf(AceLanguageModelConfigurationError);

    const health = getAceLanguageModelHealth();
    expect(health).toEqual({ status: "MODEL_NOT_CONFIGURED", healthy: false });
  });

  it("chave presente sempre vence, independentemente do ambiente (dev ou produção)", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-fake-key-for-test");

    const model = await getAceLanguageModel();
    expect(model).toBeInstanceOf(AnthropicAceLanguageModel);
  });
});
