import { describe, expect, it } from "vitest";

import { createInitialVersion, createNextVersion } from "@/modules/ace/core/version-manager";

describe("ACE version manager", () => {
  it("cria a versão inicial com version=1 e sem previousVersionId", () => {
    const artifact = createInitialVersion({ text: "conteúdo" });

    expect(artifact.version).toBe(1);
    expect(artifact.previousVersionId).toBeUndefined();
    expect(artifact.id).toBeTruthy();
    expect(artifact.createdAt).toBeTruthy();
  });

  it("cria uma nova versão referenciando a anterior, nunca sobrescrevendo", () => {
    const v1 = createInitialVersion({ text: "primeira versão" });
    const v2 = createNextVersion(v1, { text: "segunda versão" });

    expect(v2.version).toBe(2);
    expect(v2.previousVersionId).toBe(v1.id);
    expect(v1.version).toBe(1);
    expect((v1 as { text: string }).text).toBe("primeira versão");
  });

  it("congela o artefato de forma profunda (campos aninhados também imutáveis)", () => {
    const artifact = createInitialVersion({
      items: [{ label: "a" }, { label: "b" }],
    });

    expect(() => {
      (artifact.items as unknown as { label: string }[]).push({ label: "c" });
    }).toThrow();

    expect(() => {
      (artifact.items[0] as { label: string }).label = "mudou";
    }).toThrow();

    expect(artifact.items).toHaveLength(2);
    expect(artifact.items[0].label).toBe("a");
  });
});
