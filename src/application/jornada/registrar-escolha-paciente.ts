import type { JornadaProjectionPort } from "@/application/ports/jornada-query-port";
import type { JornadaDoPacienteReadModel } from "@/application/jornada/jornada-do-paciente-read-model";
import { err, ok, type Result } from "@/domain/shared/result";
import type { DomainError } from "@/domain/shared/errors";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule-error";
import { NotFoundError } from "@/domain/shared/errors/not-found-error";
import { avancarProjecaoAposEscolha } from "@/infrastructure/jornada/jornada-escolha-projection";

export interface RegistrarEscolhaPacienteCommand {
  jornadaId: string;
  opcaoIndice: number;
  observacao?: string | null;
}

export class RegistrarEscolhaPaciente {
  constructor(private readonly projection: JornadaProjectionPort) {}

  async execute(
    command: RegistrarEscolhaPacienteCommand,
  ): Promise<Result<JornadaDoPacienteReadModel, DomainError>> {
    const atual = await this.projection.obterPorId(command.jornadaId);

    if (!atual) {
      return err(new NotFoundError("Jornada"));
    }

    if (atual.etapaAtual !== "ESCOLHA" && atual.etapaAtual !== "ENTREGA") {
      return err(new BusinessRuleError("Escolha não está disponível nesta etapa."));
    }

    const entrega = atual.extensoes.entrega;
    if (!entrega || entrega.opcoes.length !== 3) {
      return err(new BusinessRuleError("Entrega com opções não está disponível."));
    }

    if (command.opcaoIndice < 0 || command.opcaoIndice > 2) {
      return err(new BusinessRuleError("Índice de opção inválido."));
    }

    const ocorridoEm = new Date().toISOString();
    const avancada = avancarProjecaoAposEscolha(
      atual,
      command.opcaoIndice,
      ocorridoEm,
      command.observacao ?? null,
    );

    await this.projection.salvar(avancada);
    return ok(avancada);
  }
}
