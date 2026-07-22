import type { AuthContextPort } from "@/application/ports/auth-context-port";
import { assertActiveStaffInAction } from "@/lib/auth/staff";

export class SupabaseAuthContextAdapter implements AuthContextPort {
  async requireActiveStaff() {
    const profile = await assertActiveStaffInAction();
    return { userId: profile.id };
  }
}
