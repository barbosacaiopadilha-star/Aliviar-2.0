import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

process.env.ALIVIAR_PATIENT_DEMO_MODE ??= "true";
process.env.ALIVIAR_CURATOR_DEMO_MODE ??= "true";
process.env.ALIVIAR_REPORT_DEMO_MODE ??= "true";

afterEach(() => {
  cleanup();
});
