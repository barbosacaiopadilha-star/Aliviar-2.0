export const DEMO_MODE_FLAGS = {
  PATIENT_DEMO_MODE: "PATIENT_DEMO_MODE",
  CURATOR_DEMO_MODE: "CURATOR_DEMO_MODE",
  REPORT_DEMO_MODE: "REPORT_DEMO_MODE",
} as const;

export type DemoModeFlag = (typeof DEMO_MODE_FLAGS)[keyof typeof DEMO_MODE_FLAGS];

const ENV_BY_FLAG: Record<DemoModeFlag, string> = {
  PATIENT_DEMO_MODE: "ALIVIAR_PATIENT_DEMO_MODE",
  CURATOR_DEMO_MODE: "ALIVIAR_CURATOR_DEMO_MODE",
  REPORT_DEMO_MODE: "ALIVIAR_REPORT_DEMO_MODE",
};

function parseEnvBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

/**
 * Demo modes are always disabled in production builds regardless of env vars.
 */
export function isDemoModeEnabled(flag: DemoModeFlag): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return parseEnvBoolean(process.env[ENV_BY_FLAG[flag]]);
}

export function isPatientDemoMode(): boolean {
  return isDemoModeEnabled(DEMO_MODE_FLAGS.PATIENT_DEMO_MODE);
}

export function isCuratorDemoMode(): boolean {
  return isDemoModeEnabled(DEMO_MODE_FLAGS.CURATOR_DEMO_MODE);
}

export function isReportDemoMode(): boolean {
  return isDemoModeEnabled(DEMO_MODE_FLAGS.REPORT_DEMO_MODE);
}

export function listDemoModeStates(): Array<{ flag: DemoModeFlag; enabled: boolean; envKey: string }> {
  return (Object.keys(DEMO_MODE_FLAGS) as DemoModeFlag[]).map((flag) => ({
    flag,
    enabled: isDemoModeEnabled(flag),
    envKey: ENV_BY_FLAG[flag],
  }));
}

export class DemoRuntimeDisabledError extends Error {
  readonly code = "DEMO_RUNTIME_DISABLED";

  constructor(public readonly flag: DemoModeFlag) {
    super(`In-memory demo runtime is disabled (${flag}).`);
    this.name = "DemoRuntimeDisabledError";
  }
}

export function assertDemoRuntimeAllowed(flag: DemoModeFlag): void {
  if (!isDemoModeEnabled(flag)) {
    throw new DemoRuntimeDisabledError(flag);
  }
}
