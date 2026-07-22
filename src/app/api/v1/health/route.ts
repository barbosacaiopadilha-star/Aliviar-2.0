import { handleOperationalHealth } from "api/health/handlers/health.handler";

export async function GET() {
  return handleOperationalHealth();
}
