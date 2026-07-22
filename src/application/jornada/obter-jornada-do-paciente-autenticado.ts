import type { JornadaQueryPort } from "@/application/ports/jornada-query-port";
import type { JornadaDoPacienteReadModel } from "@/application/jornada/jornada-do-paciente-read-model";
import { err, ok, type Result } from "@/domain/shared/result";
import type { DomainError } from "@/domain/shared/errors";
import { NotFoundError } from "@/domain/shared/errors/not-found-error";
import { UnauthorizedError } from "@/domain/shared/errors/unauthorized-error";

export class ObterJornadaDoPacienteAutenticado {
  constructor(private readonly jornadaQuery: JornadaQueryPort) {}

  async execute(pacienteId: string): Promise<Result<JornadaDoPacienteReadModel, DomainError>> {
    if (!pacienteId) {
      return err(new UnauthorizedError());
    }

    const jornada = await this.jornadaQuery.obterPorPacienteId(pacienteId);

    if (!jornada) {
      return err(new NotFoundError("Jornada"));
    }

    return ok(jornada);
  }
}
