import type { CandidatoElegivelView, OpcaoRegistradaView } from "@/curator-flow/contracts/curador-view";
import type {
  CasoCuradoriaView,
  DevolutivaView,
  DimensaoPrioridadeView,
  DossieVersaoView,
  DossieView,
  EscolhaCuradoriaView,
} from "@/curadoria-flow/contracts/dossie-view";
import type { EntregaRepositoryPort } from "@/application/ports/entrega-repository-port";
import type { AuthContextPort } from "@/application/ports/auth-context-port";
import type { ComparativoDimensaoView } from "@/experience-flow/contracts/jornada-view";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule-error";
import { err, ok, type Result } from "@/domain/shared/result";
import type { DomainError } from "@/domain/shared/errors";
import { UnauthorizedError } from "@/domain/shared/errors/unauthorized-error";
import { CuradoriaRepository } from "@/infrastructure/curadoria/curadoria-repository";
import {
  dossieOpcoesToOpcoesRegistradas,
  opcoesRegistradasToDossieOpcoes,
} from "@/infrastructure/curadoria/dossie-mapper";
import { SupabaseCuradorQuery } from "@/infrastructure/curador/supabase-curador-query";

export class GarantirCasoCuradoria {
  constructor(private readonly repo = new CuradoriaRepository()) {}

  async execute(
    jornadaId: string,
    patientId: string,
    curadorId?: string,
  ): Promise<Result<CasoCuradoriaView, DomainError>> {
    try {
      return ok(await this.repo.ensureCaso(jornadaId, patientId, curadorId));
    } catch (error) {
      return err(error as DomainError);
    }
  }
}

export class ObterCasoCuradoriaDossie {
  constructor(private readonly repo = new CuradoriaRepository()) {}

  async execute(jornadaId: string): Promise<Result<CasoCuradoriaView | null, DomainError>> {
    try {
      return ok(await this.repo.obterCasoPorJornada(jornadaId));
    } catch (error) {
      return err(error as DomainError);
    }
  }
}

export class ValidarPerfilPrioridades {
  constructor(private readonly repo = new CuradoriaRepository()) {}

  async execute(params: {
    jornadaId: string;
    casoId: string;
    curadorId: string;
    dimensoes: DimensaoPrioridadeView[];
    pesos: Record<string, number>;
  }): Promise<Result<CasoCuradoriaView, DomainError>> {
    try {
      await this.repo.validarPerfilPrioridades(
        params.casoId,
        params.curadorId,
        params.dimensoes,
        params.pesos,
      );
      const caso = await this.repo.obterCasoPorJornada(params.jornadaId);
      if (!caso) {
        throw new BusinessRuleError("Caso de curadoria não encontrado.");
      }
      return ok(caso);
    } catch (error) {
      return err(error as DomainError);
    }
  }
}

export class ConcluirMesaCuradoria {
  constructor(private readonly repo = new CuradoriaRepository()) {}

  async execute(
    jornadaId: string,
    casoId: string,
    curadorId: string,
    candidatos: CandidatoElegivelView[],
  ): Promise<Result<CasoCuradoriaView, DomainError>> {
    try {
      await this.repo.concluirCuradoriaTecnica(casoId, curadorId, candidatos);
      const caso = await this.repo.obterCasoPorJornada(jornadaId);
      if (!caso) {
        throw new BusinessRuleError("Caso de curadoria não encontrado.");
      }
      return ok(caso);
    } catch (error) {
      return err(error as DomainError);
    }
  }
}

export class IniciarDossieCuradoria {
  constructor(private readonly repo = new CuradoriaRepository()) {}

  async execute(casoId: string, curadorId: string): Promise<Result<DossieView, DomainError>> {
    try {
      return ok(await this.repo.iniciarDossie(casoId, curadorId));
    } catch (error) {
      return err(error as DomainError);
    }
  }
}

export class SalvarRascunhoDossie {
  constructor(private readonly repo = new CuradoriaRepository()) {}

  async execute(params: {
    dossieId: string;
    versaoId: string;
    opcoes: OpcaoRegistradaView[];
    comparativo: ComparativoDimensaoView[];
    curadorId: string;
  }): Promise<Result<DossieVersaoView, DomainError>> {
    try {
      const dossieOpcoes = opcoesRegistradasToDossieOpcoes(params.opcoes);
      return ok(
        await this.repo.salvarRascunhoDossie(
          params.dossieId,
          params.versaoId,
          dossieOpcoes,
          params.comparativo,
          params.curadorId,
        ),
      );
    } catch (error) {
      return err(error as DomainError);
    }
  }
}

export class CriarVersaoDossie {
  constructor(private readonly repo = new CuradoriaRepository()) {}

  async execute(dossieId: string, curadorId: string): Promise<Result<DossieVersaoView, DomainError>> {
    try {
      return ok(await this.repo.criarVersaoDossie(dossieId, curadorId));
    } catch (error) {
      return err(error as DomainError);
    }
  }
}

export class AprovarDossie {
  constructor(private readonly repo = new CuradoriaRepository()) {}

  async execute(versaoId: string, curadorId: string): Promise<Result<DossieVersaoView, DomainError>> {
    try {
      return ok(await this.repo.aprovarVersao(versaoId, curadorId));
    } catch (error) {
      return err(error as DomainError);
    }
  }
}

export class PublicarDossieCuradoria {
  constructor(
    private readonly auth: AuthContextPort,
    private readonly entregaRepository: EntregaRepositoryPort,
    private readonly repo = new CuradoriaRepository(),
    private readonly query = new SupabaseCuradorQuery(),
  ) {}

  async execute(jornadaId: string): Promise<Result<DossieView, DomainError>> {
    const authResult = await this.auth.requireActiveStaff().catch(() => null);
    if (!authResult) {
      return err(new UnauthorizedError());
    }

    try {
      const caso = await this.repo.obterCasoPorJornada(jornadaId);
      if (!caso?.dossie) {
        return err(new BusinessRuleError("Dossiê não encontrado para publicação."));
      }

      const dossie = await this.repo.publicarDossie(caso.dossie.id, authResult.userId);
      const versao = dossie.versao_publicada;
      if (!versao) {
        return err(new BusinessRuleError("Versão publicada não encontrada."));
      }

      const opcoes = dossieOpcoesToOpcoesRegistradas(versao.opcoes);
      const conteudo = JSON.stringify({
        opcoes,
        comparativo: versao.comparativo,
        curador_disponivel: true,
        dossie_id: dossie.id,
        dossie_versao: versao.versao,
        dossie_publicado_em: dossie.publicado_em,
      });

      await this.entregaRepository.produzirEntrega(
        { jornadaId, formato: "RECOMENDACAO", conteudo },
        authResult.userId,
      );

      await this.query.marcarEntregaPublicada(jornadaId);

      return ok(dossie);
    } catch (error) {
      return err(error as DomainError);
    }
  }
}

export class RegistrarDevolutivaCuradoria {
  constructor(private readonly repo = new CuradoriaRepository()) {}

  async execute(params: {
    dossieId: string;
    dataDevolutiva: string | null;
    dossieApresentado: boolean;
    duvidas: string[];
  }): Promise<Result<DevolutivaView, DomainError>> {
    try {
      return ok(
        await this.repo.registrarDevolutiva(
          params.dossieId,
          params.dataDevolutiva,
          params.dossieApresentado,
          params.duvidas,
        ),
      );
    } catch (error) {
      return err(error as DomainError);
    }
  }
}

export class ConcluirDevolutivaCuradoria {
  constructor(private readonly repo = new CuradoriaRepository()) {}

  async execute(devolutivaId: string, curadorId: string): Promise<Result<DevolutivaView, DomainError>> {
    try {
      return ok(await this.repo.concluirDevolutiva(devolutivaId, curadorId));
    } catch (error) {
      return err(error as DomainError);
    }
  }
}

export class ObterDossiePaciente {
  constructor(private readonly repo = new CuradoriaRepository()) {}

  async execute(
    journeyId: string,
    patientId: string,
  ): Promise<Result<DossieView | null, DomainError>> {
    try {
      const dossie = await this.repo.obterDossiePublicadoParaPaciente(journeyId, patientId);
      if (dossie) {
        await this.repo.registrarVisualizacaoPaciente(dossie.id, patientId, journeyId);
      }
      return ok(dossie);
    } catch (error) {
      return err(error as DomainError);
    }
  }
}

export class RegistrarEscolhaCuradoria {
  constructor(
    private readonly repo = new CuradoriaRepository(),
    private readonly registrarEscolhaPaciente: {
      execute: (cmd: {
        jornadaId: string;
        opcaoIndice: number;
        observacao?: string | null;
      }) => Promise<Result<unknown, DomainError>>;
    },
  ) {}

  async execute(params: {
    journeyId: string;
    patientId: string;
    dossieId: string;
    versaoId: string;
    opcaoIndice: number;
    proximosPassos: string;
    observacao: string | null;
  }): Promise<Result<EscolhaCuradoriaView, DomainError>> {
    try {
      const escolha = await this.repo.registrarEscolha(
        params.journeyId,
        params.patientId,
        params.dossieId,
        params.versaoId,
        params.opcaoIndice,
        params.proximosPassos,
        params.observacao,
      );

      const projecao = await this.registrarEscolhaPaciente.execute({
        jornadaId: params.journeyId,
        opcaoIndice: params.opcaoIndice,
        observacao: params.observacao,
      });

      if (!projecao.ok) {
        return err(projecao.error);
      }

      return ok(escolha);
    } catch (error) {
      return err(error as DomainError);
    }
  }
}
