import type {
  ComandoAtribuicaoOperacional,
  EventoAtribuicaoAppend,
} from "@/workflow-flow/contracts/atribuicao-operacional";
import { AssumirCasoCurador } from "@/application/curador/curador-comandos";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule-error";
import type { DomainError } from "@/domain/shared/errors";
import { err, ok, type Result } from "@/domain/shared/result";
import {
  aplicarComandoAtribuicao,
  type AtribuicaoStorePort,
} from "@/infrastructure/workflow/atribuicao-store";
import { SupabaseAtribuicaoStore } from "@/infrastructure/workflow/supabase-workflow-query";
import { createClient } from "@/lib/supabase/server";

export class ExecutarAtribuicaoOperacional {
  constructor(
    private readonly store: AtribuicaoStorePort = new SupabaseAtribuicaoStore(),
    private readonly assumirCaso = new AssumirCasoCurador(),
  ) {}

  async execute(comando: ComandoAtribuicaoOperacional): Promise<Result<EventoAtribuicaoAppend, DomainError>> {
    try {
      if (comando.tipo === "ASSUMIR") {
        const result = await this.assumirCaso.execute(comando.jornada_id, comando.curador_id);
        if (!result.ok) {
          return result;
        }
      }

      if (comando.tipo === "TRANSFERIR") {
        await this.transferirCurador(comando.jornada_id, comando.para_curador_id);
      }

      if (comando.tipo === "ENCERRAR") {
        await this.encerrarAtribuicao(comando.jornada_id);
      }

      const evento = aplicarComandoAtribuicao(comando);
      const registrado = await this.store.registrarEvento(evento);
      return ok(registrado);
    } catch (error) {
      return err(error as DomainError);
    }
  }

  private async transferirCurador(jornadaId: string, paraCuradorId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("curator_case_workspaces")
      .upsert(
        {
          journey_id: jornadaId,
          curator_id: paraCuradorId,
          assumed_at: new Date().toISOString(),
        },
        { onConflict: "journey_id" },
      );

    if (error) {
      throw new BusinessRuleError(error.message);
    }
  }

  private async encerrarAtribuicao(jornadaId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("curator_case_workspaces")
      .update({ curator_id: null, assumed_at: null })
      .eq("journey_id", jornadaId);

    if (error) {
      throw new BusinessRuleError(error.message);
    }
  }
}
