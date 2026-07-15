// Fixture golden do P010 (Final Curadoria Delivery) —
// docs/ace/04-specs/P010-final-curadoria-delivery/examples.md, Exemplo 1
// (entrega após APPROVE). Ver tests/golden/fixtures/support/p010-pipeline.ts
// para por que só este cenário virou fixture golden nesta primeira entrega.

import { expect } from "vitest";

import type { FinalCuradoria } from "@/modules/ace/artifacts/final-curadoria";
import { buildApprovedPipeline, type P010Pipeline } from "./support/p010-pipeline";
import type { GoldenFixture } from "./types";

export type P010GoldenFixture = GoldenFixture<FinalCuradoria> & {
  buildPipeline: () => Promise<P010Pipeline>;
};

export const p010Fixtures: P010GoldenFixture[] = [
  {
    name: "entrega após APPROVE — três providers, disclaimer obrigatório presente",
    covers: ["Exemplo 1"],
    buildPipeline: buildApprovedPipeline,
    assert(finalCuradoria) {
      // Contagem/ordenação/ausência de vocabulário de ranking já são
      // mecanicamente impostas por createFinalCuradoria (lançaria antes de
      // chegar aqui) — o que resta verificar é conteúdo específico exigido
      // pelo prompt.md do P010: o disclaimer obrigatório sobre não
      // substituir consulta/diagnóstico/tratamento médico.
      expect(finalCuradoria.disclaimer.toLowerCase()).toMatch(/não substitui/);

      const providerIds = finalCuradoria.providerPresentations.map((p) => p.providerId);
      expect(new Set(providerIds).size).toBe(3);

      for (const presentation of finalCuradoria.providerPresentations) {
        expect(presentation.whyIncluded.trim().length).toBeGreaterThan(0);
      }
    },
  },
];
