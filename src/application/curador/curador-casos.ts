import type { CasoDeCuradoriaView, FilaCasoItemView } from "@/curator-flow/contracts/curador-view";
import { err, ok, type Result } from "@/domain/shared/result";
import type { DomainError } from "@/domain/shared/errors";
import { NotFoundError } from "@/domain/shared/errors/not-found-error";
import { SupabaseCuradorQuery } from "@/infrastructure/curador/supabase-curador-query";

export class ListarFilaCasosCurador {
  constructor(private readonly query = new SupabaseCuradorQuery()) {}

  async execute(): Promise<Result<FilaCasoItemView[], DomainError>> {
    try {
      return ok(await this.query.listarFila());
    } catch (error) {
      return err(error as DomainError);
    }
  }
}

export class ObterCasoDeCuradoria {
  constructor(private readonly query = new SupabaseCuradorQuery()) {}

  async execute(jornadaId: string): Promise<Result<CasoDeCuradoriaView, DomainError>> {
    try {
      const caso = await this.query.obterCaso(jornadaId);
      if (!caso) {
        return err(new NotFoundError("Caso"));
      }
      return ok(caso);
    } catch (error) {
      return err(error as DomainError);
    }
  }
}
