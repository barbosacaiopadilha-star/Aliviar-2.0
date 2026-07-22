import { describe, expect, it } from "vitest";

import {
  buildClosingMessages,
  buildDurationReflectionLines,
  buildNameIntroLines,
  buildStoryIntroLines,
  preferredNameFrom,
} from "./conversation-model";

describe("conversation-model", () => {
  it("extrai o primeiro nome para tratamento humano", () => {
    expect(preferredNameFrom("  Maria Silva ")).toBe("Maria");
    expect(preferredNameFrom("")).toBe("você");
  });

  it("introduz o nome com contexto humano antes da pergunta", () => {
    const lines = buildNameIntroLines();
    expect(lines.at(-1)).toBe("Como posso te chamar?");
    expect(lines[0]).toContain("como te chamar");
  });

  it("introduz a história explicando o porquê da pergunta", () => {
    const lines = buildStoryIntroLines("Ana");
    expect(lines.some((line) => line.includes("compreender"))).toBe(true);
  });

  it("reconhece quando o paciente prefere não responder sobre tempo", () => {
    expect(buildDurationReflectionLines(false)[0]).toContain("Respeito seu tempo");
  });

  it("monta mensagens de encerramento com o nome do paciente", () => {
    const messages = buildClosingMessages("João");
    expect(messages).toHaveLength(3);
    expect(messages[0]?.text).toContain("João");
    expect(messages[2]?.text).toContain("no seu ritmo");
  });
});
