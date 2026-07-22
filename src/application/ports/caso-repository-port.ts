import type { CasoDeclarado } from "@/domain/caso/caso-declarado";

export interface RegistrarCasoDeclaradoInput {
  fullName: string;
  preferredName?: string | null;
  birthDate?: string | null;
  cpf?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  healthPlan?: string | null;
  journeyTitle: string;
  journeyObjective?: string | null;
  managerId: string;
  priority?: string;
  openedAt?: string | null;
}

export interface CasoRepositoryPort {
  registrarCasoDeclarado(
    input: RegistrarCasoDeclaradoInput,
    createdBy: string,
  ): Promise<CasoDeclarado>;
}
