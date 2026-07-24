import type { Application } from "@/infrastructure/composition-root";
import type { CandidatoElegivelView, OpcaoRegistradaView } from "@/curator-flow/contracts/curador-view";
import type { DimensaoPrioridadeView } from "@/curadoria-flow/contracts/dossie-view";
import type { ComparativoDimensaoView } from "@/experience-flow/contracts/jornada-view";
import { toApplicationResult } from "@/application/shared/to-application-result";
import { resolveStaffAccess } from "@/lib/auth/resolve-staff-access";
import { instrumentOperation } from "../../shared/observability/instrument-operation";
import { mapNotFoundToApiResponse, mapValidationToApiResponse } from "../../shared/errors/application-error-mapper";
import { handleApplicationResult } from "../../shared/http/handle-application-result";
import { errorResponse } from "../../shared/http/response";

async function requireStaff(): Promise<
  { ok: true; userId: string; nome: string } | { ok: false; response: Response }
> {
  const access = await resolveStaffAccess();
  if (access.status !== "active_staff") {
    const mapped = mapValidationToApiResponse("Acesso restrito a equipe ativa.");
    return { ok: false, response: errorResponse(mapped.status, mapped.body) };
  }
  return { ok: true, userId: access.profile.id, nome: access.profile.full_name };
}

export async function handleObterCasoCuradoriaDossie(
  app: Application,
  jornadaId: string,
): Promise<Response> {
  const staff = await requireStaff();
  if (!staff.ok) return staff.response;

  return handleApplicationResult(
    toApplicationResult(app.obterCasoCuradoriaDossie.execute(jornadaId)),
    (data) => data,
  );
}

export async function handleValidarPerfilPrioridades(
  app: Application,
  jornadaId: string,
  body: unknown,
): Promise<Response> {
  const staff = await requireStaff();
  if (!staff.ok) return staff.response;

  const request = body as { dimensoes?: DimensaoPrioridadeView[]; pesos?: Record<string, number> };
  if (!request?.dimensoes?.length) {
    const mapped = mapValidationToApiResponse("dimensoes é obrigatório.");
    return errorResponse(mapped.status, mapped.body);
  }
  if (!request.pesos || Object.keys(request.pesos).length === 0) {
    const mapped = mapValidationToApiResponse("pesos é obrigatório.");
    return errorResponse(mapped.status, mapped.body);
  }

  const casoResult = await toApplicationResult(app.obterCasoCuradoriaDossie.execute(jornadaId));
  if (!casoResult.ok) {
    const mapped = mapValidationToApiResponse(casoResult.error.message);
    return errorResponse(mapped.status, mapped.body);
  }
  if (!casoResult.value) {
    const mapped = mapNotFoundToApiResponse("Caso de curadoria não encontrado.");
    return errorResponse(mapped.status, mapped.body);
  }

  return handleApplicationResult(
    toApplicationResult(
      app.validarPerfilPrioridades.execute({
        jornadaId,
        casoId: casoResult.value.id,
        curadorId: staff.userId,
        dimensoes: request.dimensoes,
        pesos: request.pesos,
      }),
    ),
    (data) => data,
  );
}

export async function handleConcluirMesa(
  app: Application,
  jornadaId: string,
  body: unknown,
): Promise<Response> {
  const staff = await requireStaff();
  if (!staff.ok) return staff.response;

  const request = body as { candidatos?: CandidatoElegivelView[] };
  if (!request?.candidatos?.length) {
    const mapped = mapValidationToApiResponse("candidatos é obrigatório.");
    return errorResponse(mapped.status, mapped.body);
  }

  const casoResult = await toApplicationResult(app.obterCasoCuradoriaDossie.execute(jornadaId));
  if (!casoResult.ok) {
    const mapped = mapValidationToApiResponse(casoResult.error.message);
    return errorResponse(mapped.status, mapped.body);
  }
  if (!casoResult.value) {
    const mapped = mapNotFoundToApiResponse("Caso de curadoria não encontrado.");
    return errorResponse(mapped.status, mapped.body);
  }

  return handleApplicationResult(
    toApplicationResult(
      app.concluirMesaCuradoria.execute(
        jornadaId,
        casoResult.value.id,
        staff.userId,
        request.candidatos,
      ),
    ),
    (data) => data,
  );
}

export async function handleIniciarDossie(app: Application, jornadaId: string): Promise<Response> {
  const staff = await requireStaff();
  if (!staff.ok) return staff.response;

  const casoResult = await toApplicationResult(app.obterCasoCuradoriaDossie.execute(jornadaId));
  if (!casoResult.ok) {
    const mapped = mapValidationToApiResponse(casoResult.error.message);
    return errorResponse(mapped.status, mapped.body);
  }
  if (!casoResult.value) {
    const mapped = mapNotFoundToApiResponse("Caso de curadoria não encontrado.");
    return errorResponse(mapped.status, mapped.body);
  }

  return handleApplicationResult(
    toApplicationResult(app.iniciarDossieCuradoria.execute(casoResult.value.id, staff.userId)),
    (data) => data,
    201,
  );
}

export async function handleSalvarRascunhoDossie(
  app: Application,
  jornadaId: string,
  body: unknown,
): Promise<Response> {
  const staff = await requireStaff();
  if (!staff.ok) return staff.response;

  const request = body as {
    versao_id?: string;
    opcoes?: OpcaoRegistradaView[];
    comparativo?: ComparativoDimensaoView[];
  };

  if (!request?.versao_id) {
    const mapped = mapValidationToApiResponse("versao_id é obrigatório.");
    return errorResponse(mapped.status, mapped.body);
  }
  if (!request.opcoes || request.opcoes.length !== 3) {
    const mapped = mapValidationToApiResponse("Exatamente três opções são obrigatórias.");
    return errorResponse(mapped.status, mapped.body);
  }
  if (!request.comparativo) {
    const mapped = mapValidationToApiResponse("comparativo é obrigatório.");
    return errorResponse(mapped.status, mapped.body);
  }

  const casoResult = await toApplicationResult(app.obterCasoCuradoriaDossie.execute(jornadaId));
  if (!casoResult.ok) {
    const mapped = mapValidationToApiResponse(casoResult.error.message);
    return errorResponse(mapped.status, mapped.body);
  }
  if (!casoResult.value?.dossie) {
    const mapped = mapNotFoundToApiResponse("Dossiê não encontrado.");
    return errorResponse(mapped.status, mapped.body);
  }

  return handleApplicationResult(
    toApplicationResult(
      app.salvarRascunhoDossie.execute({
        dossieId: casoResult.value.dossie.id,
        versaoId: request.versao_id,
        opcoes: request.opcoes,
        comparativo: request.comparativo,
        curadorId: staff.userId,
      }),
    ),
    (data) => data,
  );
}

export async function handleCriarVersaoDossie(app: Application, jornadaId: string): Promise<Response> {
  const staff = await requireStaff();
  if (!staff.ok) return staff.response;

  const casoResult = await toApplicationResult(app.obterCasoCuradoriaDossie.execute(jornadaId));
  if (!casoResult.ok) {
    const mapped = mapValidationToApiResponse(casoResult.error.message);
    return errorResponse(mapped.status, mapped.body);
  }
  if (!casoResult.value?.dossie) {
    const mapped = mapNotFoundToApiResponse("Dossiê não encontrado.");
    return errorResponse(mapped.status, mapped.body);
  }

  return handleApplicationResult(
    toApplicationResult(
      app.criarVersaoDossie.execute(casoResult.value.dossie.id, staff.userId),
    ),
    (data) => data,
    201,
  );
}

export async function handleAprovarDossie(
  app: Application,
  jornadaId: string,
  body?: unknown,
): Promise<Response> {
  const staff = await requireStaff();
  if (!staff.ok) return staff.response;

  const request = (body ?? {}) as { versao_id?: string };

  const casoResult = await toApplicationResult(app.obterCasoCuradoriaDossie.execute(jornadaId));
  if (!casoResult.ok) {
    const mapped = mapValidationToApiResponse(casoResult.error.message);
    return errorResponse(mapped.status, mapped.body);
  }
  if (!casoResult.value?.dossie) {
    const mapped = mapNotFoundToApiResponse("Dossiê não encontrado.");
    return errorResponse(mapped.status, mapped.body);
  }

  const versaoId = request.versao_id ?? casoResult.value.dossie.versao_publicada?.id;
  if (!versaoId) {
    const mapped = mapValidationToApiResponse("versao_id é obrigatório.");
    return errorResponse(mapped.status, mapped.body);
  }

  return instrumentOperation({
    operationType: "APROVACAO",
    jornadaId,
    curatorId: staff.userId,
    actorId: staff.userId,
    actorRole: "STAFF",
    execute: () =>
      handleApplicationResult(
        toApplicationResult(app.aprovarDossie.execute(versaoId, staff.userId)),
        (data) => data,
      ),
  });
}

export async function handlePublicarDossie(app: Application, jornadaId: string): Promise<Response> {
  const staff = await requireStaff();
  if (!staff.ok) return staff.response;

  return instrumentOperation({
    operationType: "PUBLICACAO",
    jornadaId,
    curatorId: staff.userId,
    actorId: staff.userId,
    actorRole: "STAFF",
    execute: () =>
      handleApplicationResult(
        toApplicationResult(app.publicarDossieCuradoria.execute(jornadaId)),
        (data) => data,
      ),
  });
}

export async function handleRegistrarDevolutiva(
  app: Application,
  jornadaId: string,
  body: unknown,
): Promise<Response> {
  const staff = await requireStaff();
  if (!staff.ok) return staff.response;

  const request = body as {
    data_devolutiva?: string | null;
    dossie_apresentado?: boolean;
    duvidas?: string[];
  };

  if (request.dossie_apresentado === undefined) {
    const mapped = mapValidationToApiResponse("dossie_apresentado é obrigatório.");
    return errorResponse(mapped.status, mapped.body);
  }

  const casoResult = await toApplicationResult(app.obterCasoCuradoriaDossie.execute(jornadaId));
  if (!casoResult.ok) {
    const mapped = mapValidationToApiResponse(casoResult.error.message);
    return errorResponse(mapped.status, mapped.body);
  }
  if (!casoResult.value?.dossie) {
    const mapped = mapNotFoundToApiResponse("Dossiê não encontrado.");
    return errorResponse(mapped.status, mapped.body);
  }

  return handleApplicationResult(
    toApplicationResult(
      app.registrarDevolutivaCuradoria.execute({
        dossieId: casoResult.value.dossie.id,
        dataDevolutiva: request.data_devolutiva ?? null,
        dossieApresentado: request.dossie_apresentado,
        duvidas: request.duvidas ?? [],
      }),
    ),
    (data) => data,
    201,
  );
}

export async function handleConcluirDevolutiva(
  app: Application,
  jornadaId: string,
  body: unknown,
): Promise<Response> {
  const staff = await requireStaff();
  if (!staff.ok) return staff.response;

  const request = body as { devolutiva_id?: string };

  const casoResult = await toApplicationResult(app.obterCasoCuradoriaDossie.execute(jornadaId));
  if (!casoResult.ok) {
    const mapped = mapValidationToApiResponse(casoResult.error.message);
    return errorResponse(mapped.status, mapped.body);
  }

  const devolutivaId = request.devolutiva_id ?? casoResult.value?.devolutiva?.id;
  if (!devolutivaId) {
    const mapped = mapNotFoundToApiResponse("Devolutiva não encontrada.");
    return errorResponse(mapped.status, mapped.body);
  }

  return handleApplicationResult(
    toApplicationResult(app.concluirDevolutivaCuradoria.execute(devolutivaId, staff.userId)),
    (data) => data,
  );
}
