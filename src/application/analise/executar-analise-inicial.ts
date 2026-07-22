import type { AnaliseRepositoryPort } from "@/application/ports/analise-repository-port";
import type { AuthContextPort } from "@/application/ports/auth-context-port";
import type { ExecutarAnaliseInicialOutput } from "@/application/analise/executar-analise-inicial.output";
import { err, ok, type Result } from "@/domain/shared/result";
import type { DomainError } from "@/domain/shared/errors";

export type ExecutarAnaliseInicialCommand = Parameters<
  AnaliseRepositoryPort["executarAnaliseInicial"]
>[0];

export class ExecutarAnaliseInicial {
  constructor(
    private readonly auth: AuthContextPort,
    private readonly analiseRepository: AnaliseRepositoryPort,
  ) {}

  async execute(
    input: ExecutarAnaliseInicialCommand,
  ): Promise<Result<ExecutarAnaliseInicialOutput, DomainError>> {
    const authResult = await this.auth.requireActiveStaff().catch(() => null);
    if (!authResult) {
      const { UnauthorizedError } = await import("@/domain/shared/errors/unauthorized-error");
      return err(new UnauthorizedError());
    }

    try {
      const analise = await this.analiseRepository.executarAnaliseInicial(input, authResult.userId);
      return ok({
        analiseId: analise.analiseId,
        jornadaId: analise.jornadaId,
        executadaEm: analise.executadaEm,
        executadaPor: analise.executadaPor,
      });
    } catch (error) {
      return err(error as DomainError);
    }
  }
}
