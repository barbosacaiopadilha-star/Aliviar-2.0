import type { UserRole } from "@/lib/types/database";

import type { KernelRole } from "./permissions";

/** Ponte entre pap├®is Supabase e pap├®is do Kernel. */
export function mapUserRoleToKernelRole(role: UserRole): KernelRole {
  switch (role) {
    case "ADMIN":
      return "ADMIN";
    case "CURATOR":
      return "CURATOR";
    case "OPERATION":
      return "OPERATION";
    case "MANAGER":
      return "MANAGER";
    case "AUDITOR":
      return "AUDITOR";
    default:
      return "OPERATION";
  }
}
