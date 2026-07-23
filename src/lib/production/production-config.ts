export interface ProductionConfigCheck {
  key: string;
  required: boolean;
  present: boolean;
  category: "supabase" | "security" | "demo" | "runtime";
}

export interface ProductionConfigReport {
  valid: boolean;
  environment: string;
  checks: ProductionConfigCheck[];
  missingRequired: string[];
}

const REQUIRED_ENV = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", category: "supabase" as const },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", category: "supabase" as const },
] as const;

const RECOMMENDED_ENV = [
  { key: "SUPABASE_SERVICE_ROLE_KEY", category: "security" as const },
  { key: "NEXT_PUBLIC_SITE_URL", category: "runtime" as const },
] as const;

const DEMO_ENV = [
  { key: "ALIVIAR_PATIENT_DEMO_MODE", category: "demo" as const },
  { key: "ALIVIAR_CURATOR_DEMO_MODE", category: "demo" as const },
  { key: "ALIVIAR_REPORT_DEMO_MODE", category: "demo" as const },
] as const;

function isPresent(key: string): boolean {
  const value = process.env[key];
  return Boolean(value && value.trim().length > 0);
}

export function validateProductionConfig(): ProductionConfigReport {
  const checks: ProductionConfigCheck[] = [];
  const missingRequired: string[] = [];

  for (const item of REQUIRED_ENV) {
    const present = isPresent(item.key);
    checks.push({ key: item.key, required: true, present, category: item.category });
    if (!present) missingRequired.push(item.key);
  }

  for (const item of RECOMMENDED_ENV) {
    checks.push({
      key: item.key,
      required: false,
      present: isPresent(item.key),
      category: item.category,
    });
  }

  for (const item of DEMO_ENV) {
    const present = isPresent(item.key);
    checks.push({
      key: item.key,
      required: false,
      present,
      category: item.category,
    });

    if (process.env.NODE_ENV === "production" && present && process.env[item.key]?.toLowerCase() === "true") {
      missingRequired.push(`${item.key}_must_be_off_in_production`);
    }
  }

  return {
    valid: missingRequired.length === 0,
    environment: process.env.NODE_ENV ?? "development",
    checks,
    missingRequired,
  };
}

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}
