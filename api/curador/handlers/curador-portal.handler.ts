import type { Application } from "@/infrastructure/composition-root";
import { toApplicationResult } from "@/application/shared/to-application-result";
import { resolveStaffAccess } from "@/lib/auth/resolve-staff-access";
import { instrumentOperation } from "../../shared/observability/instrument-operation";
import { mapValidationToApiResponse } from "../../shared/errors/application-error-mapper";
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

export async function handleListarFilaCurador(app: Application): Promise<Response> {
  const staff = await requireStaff();
  if (!staff.ok) return staff.response;

  return handleApplicationResult(
    toApplicationResult(app.listarFilaCasosCurador.execute()),
    (data) => data,
  );
}

export async function handleObterCasoCurador(
  app: Application,
  jornadaId: string,
): Promise<Response> {
  const staff = await requireStaff();
  if (!staff.ok) return staff.response;

  return handleApplicationResult(
    toApplicationResult(app.obterCasoDeCuradoria.execute(jornadaId)),
    (data) => data,
  );
}

export async function handleAssumirCasoCurador(
  app: Application,
  jornadaId: string,
): Promise<Response> {
  const staff = await requireStaff();
  if (!staff.ok) return staff.response;

  return handleApplicationResult(
    toApplicationResult(app.assumirCasoCurador.execute(jornadaId, staff.userId)),
    () => ({ assumido: true }),
  );
}

export async function handleAbrirSessaoCurador(
  app: Application,
  jornadaId: string,
): Promise<Response> {
  const staff = await requireStaff();
  if (!staff.ok) return staff.response;

  return instrumentOperation({
    operationType: "SESSAO_INICIO",
    jornadaId,
    curatorId: staff.userId,
    actorId: staff.userId,
    actorRole: "STAFF",
    execute: () =>
      handleApplicationResult(
        toApplicationResult(app.abrirSessaoCuradoriaComWorkspace.execute(jornadaId)),
        () => ({ sessao_aberta: true }),
      ),
  });
}

export async function handleSalvarConjuntoElegivel(
  app: Application,
  jornadaId: string,
  body: unknown,
): Promise<Response> {
  const staff = await requireStaff();
  if (!staff.ok) return staff.response;

  const request = body as { candidatos?: unknown[] };
  if (!request?.candidatos) {
    const mapped = mapValidationToApiResponse("candidatos é obrigatório.");
    return errorResponse(mapped.status, mapped.body);
  }

  return handleApplicationResult(
    toApplicationResult(
      app.salvarConjuntoElegivel.execute(jornadaId, {
        candidatos: request.candidatos as import("@/curator-flow/contracts/curador-view").CandidatoElegivelView[],
        atualizado_em: new Date().toISOString(),
      }),
    ),
    (data) => data,
  );
}

export async function handleRegistrarOpcoes(
  app: Application,
  jornadaId: string,
  body: unknown,
): Promise<Response> {
  const staff = await requireStaff();
  if (!staff.ok) return staff.response;

  const request = body as { opcoes?: unknown[] };
  if (!request?.opcoes || request.opcoes.length !== 3) {
    const mapped = mapValidationToApiResponse("Exatamente três opções são obrigatórias.");
    return errorResponse(mapped.status, mapped.body);
  }

  return instrumentOperation({
    operationType: "OPCOES_REGISTRADAS",
    jornadaId,
    curatorId: staff.userId,
    actorId: staff.userId,
    actorRole: "STAFF",
    metadata: { opcoes: request.opcoes.length },
    execute: () =>
      handleApplicationResult(
        toApplicationResult(
          app.registrarTresOpcoes.execute(
            jornadaId,
            request.opcoes as import("@/curator-flow/contracts/curador-view").OpcaoRegistradaView[],
          ),
        ),
        (data) => data,
      ),
  });
}

export async function handleRegistrarComentario(
  app: Application,
  jornadaId: string,
  body: unknown,
): Promise<Response> {
  const staff = await requireStaff();
  if (!staff.ok) return staff.response;

  const request = body as { conteudo?: string };
  if (!request?.conteudo?.trim()) {
    const mapped = mapValidationToApiResponse("conteudo é obrigatório.");
    return errorResponse(mapped.status, mapped.body);
  }

  return handleApplicationResult(
    toApplicationResult(
      app.registrarComentarioOperacional.execute({
        jornadaId,
        autorId: staff.userId,
        autorNome: staff.nome,
        conteudo: request.conteudo.trim(),
      }),
    ),
    (data) => data,
    201,
  );
}

export async function handleAprovarEntrega(
  app: Application,
  jornadaId: string,
): Promise<Response> {
  const staff = await requireStaff();
  if (!staff.ok) return staff.response;

  return instrumentOperation({
    operationType: "APROVACAO",
    jornadaId,
    curatorId: staff.userId,
    actorId: staff.userId,
    actorRole: "STAFF",
    execute: () =>
      handleApplicationResult(
        toApplicationResult(app.aprovarEntregaCurador.execute(jornadaId, staff.userId)),
        () => ({ aprovado: true }),
      ),
  });
}

export async function handlePublicarEntrega(
  app: Application,
  jornadaId: string,
): Promise<Response> {
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
        toApplicationResult(app.publicarEntregaCurador.execute(jornadaId)),
        () => ({ publicado: true }),
      ),
  });
}
