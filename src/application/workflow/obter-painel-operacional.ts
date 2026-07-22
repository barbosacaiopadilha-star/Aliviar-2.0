import type { PainelOperacionalModel } from "@/workflow-flow/contracts/painel-operacional";
import { derivarPainelOperacional } from "@/infrastructure/workflow/derivar-painel-operacional";
import { SupabaseWorkflowQuery } from "@/infrastructure/workflow/supabase-workflow-query";
import { err, ok, type Result } from "@/domain/shared/result";
import type { DomainError } from "@/domain/shared/errors";

export class ObterPainelOperacional {
  constructor(private readonly query = new SupabaseWorkflowQuery()) {}

  async execute(): Promise<Result<PainelOperacionalModel, DomainError>> {
    try {
      const casos = await this.query.listarCasosOperacionais();
      return ok(derivarPainelOperacional(casos));
    } catch (error) {
      return err(error as DomainError);
    }
  }
}
