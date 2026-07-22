import type { JornadaQueryPort } from "@/application/ports/jornada-query-port";
import type { JornadaDoPacienteReadModel } from "@/application/jornada/jornada-do-paciente-read-model";
import { SupabaseJornadaProjection } from "./supabase-jornada-projection";

export class SupabaseJornadaQuery implements JornadaQueryPort {
  constructor(private readonly projection = new SupabaseJornadaProjection()) {}

  obterPorId(jornadaId: string): Promise<JornadaDoPacienteReadModel | null> {
    return this.projection.obterPorId(jornadaId);
  }
}

export { SupabaseJornadaProjection };
