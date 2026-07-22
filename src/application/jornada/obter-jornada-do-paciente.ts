import type { JornadaQueryPort } from "@/application/ports/jornada-query-port";
import type { JornadaDoPacienteReadModel } from "@/application/jornada/jornada-do-paciente-read-model";
import { err, ok, type Result } from "@/domain/shared/result";
import type { DomainError } from "@/domain/shared/errors";
import { NotFoundError } from "@/domain/shared/errors/not-found-error";

export class ObterJornadaDoPaciente {
  constructor(private readonly jornadaQuery: JornadaQueryPort) {}

  async execute(jornadaId: string): Promise<Result<JornadaDoPacienteReadModel, DomainError>> {
    const jornada = await this.jornadaQuery.obterPorId(jornadaId);

    if (!jornada) {
      return err(new NotFoundError("Jornada"));
    }

    return ok(jornada);
  }
}
