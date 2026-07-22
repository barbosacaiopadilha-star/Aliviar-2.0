import type { FilasOperacionaisView } from "@/workflow-flow/contracts/filas-operacionais";
import { derivarFilasOperacionais } from "@/infrastructure/workflow/derivar-filas-operacionais";
import { SupabaseWorkflowQuery } from "@/infrastructure/workflow/supabase-workflow-query";
import { err, ok, type Result } from "@/domain/shared/result";
import type { DomainError } from "@/domain/shared/errors";

export class ListarFilasOperacionais {
  constructor(private readonly query = new SupabaseWorkflowQuery()) {}

  async execute(): Promise<Result<FilasOperacionaisView, DomainError>> {
    try {
      const casos = await this.query.listarCasosOperacionais();
      return ok(derivarFilasOperacionais(casos));
    } catch (error) {
      return err(error as DomainError);
    }
  }
}
