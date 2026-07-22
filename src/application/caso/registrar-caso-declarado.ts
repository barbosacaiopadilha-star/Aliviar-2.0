import type { CasoRepositoryPort } from "@/application/ports/caso-repository-port";
import type { AuthContextPort } from "@/application/ports/auth-context-port";
import type { RegistrarCasoDeclaradoOutput } from "@/application/caso/registrar-caso-declarado.output";
import { err, ok, type Result } from "@/domain/shared/result";
import type { DomainError } from "@/domain/shared/errors";

export type RegistrarCasoDeclaradoCommand = Parameters<CasoRepositoryPort["registrarCasoDeclarado"]>[0];

export class RegistrarCasoDeclarado {
  constructor(
    private readonly auth: AuthContextPort,
    private readonly casoRepository: CasoRepositoryPort,
  ) {}

  async execute(
    input: RegistrarCasoDeclaradoCommand,
  ): Promise<Result<RegistrarCasoDeclaradoOutput, DomainError>> {
    const authResult = await this.auth.requireActiveStaff().catch(() => null);
    if (!authResult) {
      const { UnauthorizedError } = await import("@/domain/shared/errors/unauthorized-error");
      return err(new UnauthorizedError());
    }

    try {
      const caso = await this.casoRepository.registrarCasoDeclarado(input, authResult.userId);
      return ok({
        casoId: caso.casoId,
        pacienteId: caso.pacienteId,
        jornadaId: caso.jornadaId,
      });
    } catch (error) {
      return err(error as DomainError);
    }
  }
}
