import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { saveSelectionInputSchema } from "@/modules/curadoria/schema";

/**
 * M2 — A SELEÇÃO NÃO CARREGA MAIS BANDA (executa a ADR-042).
 *
 * O contrato da seleção passa a conter apenas o que tem autoridade vigente:
 * quem, em que ordem, por quê e a que custo. A banda do motor aposentado vira
 * dado histórico — legível onde já existe, nunca gravada de novo, nunca
 * inventada como "MODERADA".
 */

/** Comentário que EXPLICA a virada cita o vocabulário antigo de propósito. */
function semComentarios(fonte: string): string {
  return fonte
    .split("\n")
    .filter((linha) => {
      const limpa = linha.trimStart();
      return (
        !limpa.startsWith("//") &&
        !limpa.startsWith("--") &&
        !limpa.startsWith("*") &&
        !limpa.startsWith("/*") &&
        !limpa.startsWith("{/*")
      );
    })
    .join("\n");
}

const ler = (relativo: string) =>
  semComentarios(readFileSync(join(process.cwd(), relativo), "utf8"));

const UUID_A = "11111111-1111-4111-8111-111111111111";
const UUID_B = "22222222-2222-4222-8222-222222222222";
const UUID_C = "33333333-3333-4333-8333-333333333333";

function payloadValido() {
  return {
    priorityProfileId: "44444444-4444-4444-8444-444444444444",
    compositionRationale: "Três caminhos distintos, cada um com uma troca clara.",
    options: [
      { professionalProfileId: UUID_A, rationale: "Responde ao que mais importa." },
      { professionalProfileId: UUID_B, rationale: "Caminho conservador.", tradeOff: "Prazo maior." },
      { professionalProfileId: UUID_C, rationale: "Continuidade forte." },
    ],
  };
}

describe("Contrato de entrada da seleção (schema)", () => {
  it("aceita seleção nova sem band — nenhum fallback exigido", () => {
    const parsed = saveSelectionInputSchema.safeParse(payloadValido());
    expect(parsed.success).toBe(true);
  });

  it("recusa band explicitamente: banda não é dado que a tela de seleção produz", () => {
    const payload = payloadValido();
    (payload.options[0] as Record<string, unknown>).band = "ALTA";

    const parsed = saveSelectionInputSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it("segue exigindo exatamente três opções, com justificativa em cada uma", () => {
    const payload = payloadValido();
    payload.options = payload.options.slice(0, 2);
    expect(saveSelectionInputSchema.safeParse(payload).success).toBe(false);
  });
});

describe("Repositório da seleção", () => {
  const repo = ler("src/modules/curadoria/repository.ts");

  it("seleção nova é gravada sem band", () => {
    expect(repo).not.toContain("band: option.band,");
  });

  it("a hidratação lê a banda como histórico opcional — ausência é null, nunca 'MODERADA' inventada", () => {
    expect(repo).toContain("(option.band as CompatibilityBand | null) ?? null");
    expect(repo).not.toMatch(/option\.band[^\n]*\?\?\s*"MODERADA"/);
  });
});

describe("Migration — aditiva e não destrutiva", () => {
  const migration = ler("supabase/migrations/20260730100000_selecao_sem_banda.sql");

  it("torna a coluna anulável, preservando a coluna e o CHECK", () => {
    expect(migration).toContain("alter column band drop not null");
    expect(migration).not.toMatch(/drop\s+column/i);
  });

  it("não converte, não apaga e não reescreve nenhuma linha histórica", () => {
    expect(migration).not.toMatch(/\bupdate\b/i);
    expect(migration).not.toMatch(/\bdelete\b/i);
    expect(migration).not.toMatch(/\btruncate\b/i);
  });
});

describe("O paciente continua sem receber banda", () => {
  function fontes(dir: string): string[] {
    if (!existsSync(dir)) return [];
    return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
      const caminho = join(dir, entrada.name);
      if (entrada.isDirectory()) return fontes(caminho);
      return /\.(ts|tsx)$/.test(entrada.name) ? [caminho] : [];
    });
  }

  it("nenhuma superfície do paciente referencia band", () => {
    const arquivos = [
      join(process.cwd(), "src/modules/curadoria/patient-curadoria.ts"),
      ...fontes(join(process.cwd(), "src/components/paciente")),
      ...fontes(join(process.cwd(), "src/components/patient")),
      ...fontes(join(process.cwd(), "src/app/paciente")),
      ...fontes(join(process.cwd(), "src/modules/paciente")),
    ];

    expect(arquivos.length).toBeGreaterThan(0);

    for (const arquivo of arquivos) {
      const texto = semComentarios(readFileSync(arquivo, "utf8"));
      expect(/\bband\b/.test(texto), arquivo).toBe(false);
    }
  });
});
