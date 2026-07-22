import { describe, expect, it } from "vitest";

import { buildClosingMessages, preferredNameFrom } from "./conversation-model";

describe("conversation-model", () => {
  it("extrai o primeiro nome para tratamento humano", () => {
    expect(preferredNameFrom("  Maria Silva ")).toBe("Maria");
    expect(preferredNameFrom("")).toBe("você");
  });

  it("monta mensagens de encerramento com o nome do paciente", () => {
    const messages = buildClosingMessages("João");
    expect(messages).toHaveLength(3);
    expect(messages[0]?.text).toContain("João");
    expect(messages[2]?.text).toContain("no seu ritmo");
  });
});
