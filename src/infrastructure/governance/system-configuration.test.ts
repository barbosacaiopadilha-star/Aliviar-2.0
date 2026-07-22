import { describe, expect, it } from "vitest";
import { POLITICAS_SLA } from "@/workflow-flow/contracts/sla-operacional";

describe("configuração do sistema", () => {
  it("usa defaults de SLA quando banco indisponível", () => {
    const defaults = POLITICAS_SLA.map((p) => p.fila);
    expect(defaults).toEqual([
      "PRIMEIRO_CONTATO",
      "DOCUMENTACAO",
      "CURADORIA",
      "ENTREGA",
      "ACOMPANHAMENTO",
    ]);
  });
});
