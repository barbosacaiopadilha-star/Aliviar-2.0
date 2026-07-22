import type {
  ComentarioOperacionalView,
  ConjuntoElegivelView,
  OpcaoRegistradaView,
} from "@/curator-flow/contracts/curador-view";
import type { AuthContextPort } from "@/application/ports/auth-context-port";
import type { CuradoriaRepositoryPort } from "@/application/ports/curadoria-repository-port";
import type { EntregaRepositoryPort } from "@/application/ports/entrega-repository-port";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule-error";
import { err, ok, type Result } from "@/domain/shared/result";
import type { DomainError } from "@/domain/shared/errors";
import { UnauthorizedError } from "@/domain/shared/errors/unauthorized-error";
import { abrirSessaoWorkspace } from "@/infrastructure/curador/curador-workspace";
import { SupabaseCuradorQuery } from "@/infrastructure/curador/supabase-curador-query";

export class AssumirCasoCurador {
  constructor(private readonly query = new SupabaseCuradorQuery()) {}

  async execute(jornadaId: string, curadorId: string): Promise<Result<void, DomainError>> {
    try {
      await this.query.assumirCaso(jornadaId, curadorId);
      return ok(undefined);
    } catch (error) {
      return err(error as DomainError);
    }
  }
}

export class SalvarConjuntoElegivel {
  constructor(private readonly query = new SupabaseCuradorQuery()) {}

  async execute(
    jornadaId: string,
    conjunto: ConjuntoElegivelView,
  ): Promise<Result<ConjuntoElegivelView, DomainError>> {
    try {
      const workspace = await this.query.salvarConjuntoElegivel(jornadaId, conjunto);
      return ok(workspace.conjunto_elegivel!);
    } catch (error) {
      return err(error as DomainError);
    }
  }
}

export class RegistrarTresOpcoes {
  constructor(private readonly query = new SupabaseCuradorQuery()) {}

  async execute(
    jornadaId: string,
    opcoes: OpcaoRegistradaView[],
  ): Promise<Result<OpcaoRegistradaView[], DomainError>> {
    try {
      const workspace = await this.query.salvarOpcoes(jornadaId, opcoes);
      return ok(workspace.opcoes_registradas!);
    } catch (error) {
      return err(error as DomainError);
    }
  }
}

export class RegistrarComentarioOperacional {
  constructor(private readonly query = new SupabaseCuradorQuery()) {}

  async execute(params: {
    jornadaId: string;
    autorId: string;
    autorNome: string;
    conteudo: string;
  }): Promise<Result<ComentarioOperacionalView, DomainError>> {
    try {
      const comentario = this.query.criarComentario({
        autorId: params.autorId,
        autorNome: params.autorNome,
        conteudo: params.conteudo,
      });
      await this.query.adicionarComentario(params.jornadaId, comentario);
      return ok(comentario);
    } catch (error) {
      return err(error as DomainError);
    }
  }
}

export class AprovarEntregaCurador {
  constructor(private readonly query = new SupabaseCuradorQuery()) {}

  async execute(jornadaId: string, curadorId: string): Promise<Result<void, DomainError>> {
    try {
      await this.query.aprovarEntrega(jornadaId, curadorId);
      return ok(undefined);
    } catch (error) {
      return err(error as DomainError);
    }
  }
}

export class PublicarEntregaCurador {
  constructor(
    private readonly auth: AuthContextPort,
    private readonly entregaRepository: EntregaRepositoryPort,
    private readonly query = new SupabaseCuradorQuery(),
  ) {}

  async execute(jornadaId: string): Promise<Result<void, DomainError>> {
    const authResult = await this.auth.requireActiveStaff().catch(() => null);
    if (!authResult) {
      return err(new UnauthorizedError());
    }

    try {
      const caso = await this.query.obterCaso(jornadaId);
      if (!caso?.rascunho_entrega?.entrega) {
        return err(new BusinessRuleError("Entrega aprovada não encontrada."));
      }

      if (caso.rascunho_entrega.modo !== "APROVADO") {
        return err(new BusinessRuleError("Entrega precisa estar aprovada antes de publicar."));
      }

      const conteudo = JSON.stringify({
        opcoes: caso.rascunho_entrega.entrega.opcoes,
        comparativo: caso.rascunho_entrega.comparativo,
        curador_disponivel: true,
      });

      await this.entregaRepository.produzirEntrega(
        { jornadaId, formato: "RECOMENDACAO", conteudo },
        authResult.userId,
      );

      await this.query.marcarEntregaPublicada(jornadaId);
      return ok(undefined);
    } catch (error) {
      return err(error as DomainError);
    }
  }
}

export class AbrirSessaoCuradoriaComWorkspace {
  constructor(
    private readonly auth: AuthContextPort,
    private readonly curadoriaRepository: CuradoriaRepositoryPort,
    private readonly query = new SupabaseCuradorQuery(),
  ) {}

  async execute(jornadaId: string): Promise<Result<void, DomainError>> {
    const authResult = await this.auth.requireActiveStaff().catch(() => null);
    if (!authResult) {
      return err(new UnauthorizedError());
    }

    try {
      await this.query.assumirCaso(jornadaId, authResult.userId);

      const sessao = await this.curadoriaRepository.abrirSessao(
        { jornadaId },
        authResult.userId,
      );

      const workspace = await this.query.obterWorkspaceData(jornadaId);
      await this.query.atualizarWorkspaceData(
        jornadaId,
        abrirSessaoWorkspace(workspace, sessao.sessaoId, authResult.userId, sessao.abertaEm),
      );

      return ok(undefined);
    } catch (error) {
      return err(error as DomainError);
    }
  }
}
