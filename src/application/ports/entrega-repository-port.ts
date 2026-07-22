import type { EntregaAoPaciente, EntregaFormato } from "@/domain/entrega/entrega-paciente";

export interface ProduzirEntregaAoPacienteInput {
  jornadaId: string;
  formato: EntregaFormato;
  conteudo: string;
}

export interface EntregaRepositoryPort {
  produzirEntrega(
    input: ProduzirEntregaAoPacienteInput,
    produzidaPor: string,
  ): Promise<EntregaAoPaciente>;
}
