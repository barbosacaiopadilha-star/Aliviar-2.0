import type { JornadaProjectionPort } from "@/application/ports/jornada-query-port";
import type { JornadaDoPacienteReadModel } from "@/application/jornada/jornada-do-paciente-read-model";
import { err, ok, type Result } from "@/domain/shared/result";
import type { DomainError } from "@/domain/shared/errors";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule-error";
import { NotFoundError } from "@/domain/shared/errors/not-found-error";
import {
  avancarProjecaoOnboarding,
  onboardingAplicaProjecao,
} from "@/infrastructure/jornada/jornada-onboarding-projection";

export class AvancarOnboardingPaciente {
  constructor(private readonly projection: JornadaProjectionPort) {}

  async execute(jornadaId: string): Promise<Result<JornadaDoPacienteReadModel, DomainError>> {
    const atual = await this.projection.obterPorId(jornadaId);

    if (!atual) {
      return err(new NotFoundError("Jornada"));
    }

    if (!onboardingAplicaProjecao(atual.etapaAtual)) {
      return err(new BusinessRuleError("Onboarding não está ativo nesta etapa."));
    }

    const ocorridoEm = new Date().toISOString();
    const avancada = avancarProjecaoOnboarding(atual, ocorridoEm);
    await this.projection.salvar(avancada);

    return ok(avancada);
  }
}
