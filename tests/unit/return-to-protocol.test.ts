import { describe, expect, it } from "vitest";

import {
  ACE_PIPELINE_PROTOCOLS,
  getArtifactTypesToInvalidate,
  isProtocolAtOrAfterReturnPoint,
} from "@/modules/concierge/return-to-protocol";

describe("return-to-protocol", () => {
  it("identifica protocolos a partir do ponto de retorno", () => {
    expect(isProtocolAtOrAfterReturnPoint("P005", "P006")).toBe(false);
    expect(isProtocolAtOrAfterReturnPoint("P006", "P006")).toBe(true);
    expect(isProtocolAtOrAfterReturnPoint("P008", "P006")).toBe(true);
    expect(isProtocolAtOrAfterReturnPoint("P009", "P006")).toBe(false);
  });

  it("lista artefatos downstream a invalidar", () => {
    const types = getArtifactTypesToInvalidate("P006");
    expect(types).toEqual([
      "EligibleProviderSet",
      "CompatibilityMatrix",
      "Shortlist",
    ]);
  });

  it("retorno em P002 invalida DecisionCase em diante", () => {
    const types = getArtifactTypesToInvalidate("P002");
    expect(types[0]).toBe("DecisionCase");
    expect(types).toContain("Shortlist");
    expect(types).toHaveLength(ACE_PIPELINE_PROTOCOLS.length - 1);
  });
});
