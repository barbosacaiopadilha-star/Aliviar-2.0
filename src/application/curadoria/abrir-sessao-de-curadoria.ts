import type { CuradoriaRepositoryPort } from "@/application/ports/curadoria-repository-port";
import type { AuthContextPort } from "@/application/ports/auth-context-port";
import type { AbrirSessaoDeCuradoriaOutput } from "@/application/curadoria/abrir-sessao-de-curadoria.output";
import { err, ok, type Result } from "@/domain/shared/result";
import type { DomainError } from "@/domain/shared/errors";

export type AbrirSessaoDeCuradoriaCommand = Parameters<CuradoriaRepositoryPort["abrirSessao"]>[0];

export class AbrirSessaoDeCuradoria {
  constructor(
    private readonly auth: AuthContextPort,
    private readonly curadoriaRepository: CuradoriaRepositoryPort,
  ) {}

  async execute(
    input: AbrirSessaoDeCuradoriaCommand,
  ): Promise<Result<AbrirSessaoDeCuradoriaOutput, DomainError>> {
    const authResult = await this.auth.requireActiveStaff().catch(() => null);
    if (!authResult) {
      const { UnauthorizedError } = await import("@/domain/shared/errors/unauthorized-error");
      return err(new UnauthorizedError());
    }

    try {
      const sessao = await this.curadoriaRepository.abrirSessao(input, authResult.userId);
      return ok({
        sessaoId: sessao.sessaoId,
        jornadaId: sessao.jornadaId,
        curadorId: sessao.curadorId,
        status: sessao.status,
        abertaEm: sessao.abertaEm,
      });
    } catch (error) {
      return err(error as DomainError);
    }
  }
}
