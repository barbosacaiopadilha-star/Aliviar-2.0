import type { MemoryAudience } from "@/journey-memory/model/memory-audience";
import type { MemoryAccessPort } from "@/journey-memory/ports/journey-memory-ports";

/** Permite que o paciente escreva na memória da própria jornada via audiência PORTAL. */
export class PatientSharingMemoryAccess implements MemoryAccessPort {
  async canRead(): Promise<boolean> {
    return true;
  }

  async canWrite(_journeyId: string, audience: MemoryAudience): Promise<boolean> {
    return audience === "PORTAL" || audience === "CURATORIA";
  }
}
