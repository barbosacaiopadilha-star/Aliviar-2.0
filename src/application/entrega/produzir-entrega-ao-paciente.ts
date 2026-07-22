import type { EntregaRepositoryPort } from "@/application/ports/entrega-repository-port";
import type { AuthContextPort } from "@/application/ports/auth-context-port";
import type { ProduzirEntregaAoPacienteOutput } from "@/application/entrega/produzir-entrega-ao-paciente.output";
import { err, ok, type Result } from "@/domain/shared/result";
import type { DomainError } from "@/domain/shared/errors";

export type ProduzirEntregaAoPacienteCommand = Parameters<
  EntregaRepositoryPort["produzirEntrega"]
>[0];

export class ProduzirEntregaAoPaciente {
  constructor(
    private readonly auth: AuthContextPort,
    private readonly entregaRepository: EntregaRepositoryPort,
  ) {}

  async execute(
    input: ProduzirEntregaAoPacienteCommand,
  ): Promise<Result<ProduzirEntregaAoPacienteOutput, DomainError>> {
    const authResult = await this.auth.requireActiveStaff().catch(() => null);
    if (!authResult) {
      const { UnauthorizedError } = await import("@/domain/shared/errors/unauthorized-error");
      return err(new UnauthorizedError());
    }

    try {
      const entrega = await this.entregaRepository.produzirEntrega(input, authResult.userId);
      return ok({
        entregaId: entrega.entregaId,
        jornadaId: entrega.jornadaId,
        formato: entrega.formato,
        produzidaEm: entrega.produzidaEm,
        produzidaPor: entrega.produzidaPor,
      });
    } catch (error) {
      return err(error as DomainError);
    }
  }
}
