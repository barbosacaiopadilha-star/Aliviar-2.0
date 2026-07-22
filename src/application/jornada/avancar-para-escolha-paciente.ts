import type { JornadaProjectionPort } from "@/application/ports/jornada-query-port";
import type { JornadaDoPacienteReadModel } from "@/application/jornada/jornada-do-paciente-read-model";
import { err, ok, type Result } from "@/domain/shared/result";
import type { DomainError } from "@/domain/shared/errors";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule-error";
import { NotFoundError } from "@/domain/shared/errors/not-found-error";
import { prepararProjecaoParaEscolha } from "@/infrastructure/jornada/jornada-escolha-projection";

export class AvancarParaEscolhaPaciente {
  constructor(private readonly projection: JornadaProjectionPort) {}

  async execute(jornadaId: string): Promise<Result<JornadaDoPacienteReadModel, DomainError>> {
    const atual = await this.projection.obterPorId(jornadaId);

    if (!atual) {
      return err(new NotFoundError("Jornada"));
    }

    if (atual.etapaAtual !== "ENTREGA" || !atual.extensoes.entrega) {
      return err(new BusinessRuleError("Entrega não está disponível para avançar."));
    }

    const ocorridoEm = new Date().toISOString();
    const avancada = prepararProjecaoParaEscolha(atual, ocorridoEm);
    await this.projection.salvar(avancada);

    return ok(avancada);
  }
}
