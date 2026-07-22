import { application } from "@/infrastructure/composition-root";
import { handleProduzirEntregaAoPaciente } from "api/entrega/handlers/produzir-entrega-ao-paciente.handler";
import { mapUnknownToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse } from "api/shared/http/response";

export async function POST(
  request: Request,
  context: { params: Promise<{ jornadaId: string }> },
) {
  try {
    const { jornadaId } = await context.params;
    const body = await request.json();
    return handleProduzirEntregaAoPaciente(application, jornadaId, body);
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}
