import type { JornadaDoPacienteReadModel } from "@/application/jornada/jornada-do-paciente-read-model";

export interface JornadaQueryPort {
  obterPorId(jornadaId: string): Promise<JornadaDoPacienteReadModel | null>;
  obterPorPacienteId(pacienteId: string): Promise<JornadaDoPacienteReadModel | null>;
}

export interface JornadaProjectionPort {
  salvar(model: JornadaDoPacienteReadModel): Promise<void>;
  obterPorId(jornadaId: string): Promise<JornadaDoPacienteReadModel | null>;
}
