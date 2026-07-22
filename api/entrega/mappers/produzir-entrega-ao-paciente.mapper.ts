import type { ProduzirEntregaAoPacienteCommand } from "@/application/entrega/produzir-entrega-ao-paciente";
import type { ProduzirEntregaAoPacienteOutput } from "@/application/entrega/produzir-entrega-ao-paciente.output";
import type {
  ProduzirEntregaAoPacienteRequest,
  ProduzirEntregaAoPacienteResponse,
} from "../dto/produzir-entrega-ao-paciente.dto";

export function toProduzirEntregaAoPacienteCommand(
  jornadaId: string,
  request: ProduzirEntregaAoPacienteRequest,
): ProduzirEntregaAoPacienteCommand {
  return {
    jornadaId,
    formato: request.formato,
    conteudo: request.conteudo,
  };
}

export function toProduzirEntregaAoPacienteResponse(
  output: ProduzirEntregaAoPacienteOutput,
): ProduzirEntregaAoPacienteResponse {
  return {
    entrega_id: output.entregaId,
    jornada_id: output.jornadaId,
    formato: output.formato,
    produzida_em: output.produzidaEm,
    produzida_por: output.produzidaPor,
  };
}
