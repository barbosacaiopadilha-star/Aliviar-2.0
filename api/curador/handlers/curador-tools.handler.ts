import { recordOperationalAudit } from "api/shared/observability/instrument-operation";
import { mapValidationToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse, successResponse } from "api/shared/http/response";
import { resolveStaffAccess } from "@/lib/auth/resolve-staff-access";
import { curatorTools } from "@/infrastructure/curador-tools/curator-tools-service";
import type { CuratorFavoriteEntityType } from "@/curator-tools-flow/contracts/curator-tools";

async function requireCurator() {
  const access = await resolveStaffAccess();
  if (access.status !== "active_staff") {
    const mapped = mapValidationToApiResponse("Acesso restrito a equipe ativa.");
    return { ok: false as const, response: errorResponse(mapped.status, mapped.body) };
  }
  return { ok: true as const, userId: access.profile.id, nome: access.profile.full_name };
}

export async function handlePesquisaGlobal(searchParams: URLSearchParams): Promise<Response> {
  const access = await requireCurator();
  if (!access.ok) return access.response;

  const q = searchParams.get("q") ?? "";
  const result = await curatorTools.pesquisarGlobal(access.userId, q);
  return successResponse(result);
}

export async function handleListarFavoritos(): Promise<Response> {
  const access = await requireCurator();
  if (!access.ok) return access.response;
  return successResponse(await curatorTools.listarFavoritos(access.userId));
}

export async function handleAdicionarFavorito(body: unknown): Promise<Response> {
  const access = await requireCurator();
  if (!access.ok) return access.response;

  const request = body as { entity_type?: CuratorFavoriteEntityType; entity_id?: string; label?: string };
  if (!request.entity_type || !request.entity_id) {
    const mapped = mapValidationToApiResponse("entity_type e entity_id são obrigatórios.");
    return errorResponse(mapped.status, mapped.body);
  }

  const favorite = await curatorTools.adicionarFavorito(access.userId, {
    entity_type: request.entity_type,
    entity_id: request.entity_id,
    label: request.label ?? request.entity_id,
  });

  await recordOperationalAudit({
    eventType: "CURATOR_FAVORITO",
    actorId: access.userId,
    actorRole: "STAFF",
    resultado: "SUCESSO",
    metadata: { acao: "adicionar", entity_type: request.entity_type },
  });

  return successResponse(favorite, 201);
}

export async function handleRemoverFavorito(
  entityType: CuratorFavoriteEntityType,
  entityId: string,
): Promise<Response> {
  const access = await requireCurator();
  if (!access.ok) return access.response;

  await curatorTools.removerFavorito(access.userId, entityType, entityId);

  await recordOperationalAudit({
    eventType: "CURATOR_FAVORITO",
    actorId: access.userId,
    actorRole: "STAFF",
    resultado: "SUCESSO",
    metadata: { acao: "remover", entity_type: entityType },
  });

  return successResponse({ removido: true });
}

export async function handleListarNotas(searchParams: URLSearchParams): Promise<Response> {
  const access = await requireCurator();
  if (!access.ok) return access.response;
  const jornadaId = searchParams.get("jornada_id") ?? undefined;
  return successResponse(await curatorTools.listarNotas(access.userId, jornadaId));
}

export async function handleCriarNota(body: unknown): Promise<Response> {
  const access = await requireCurator();
  if (!access.ok) return access.response;

  const request = body as { jornada_id?: string; titulo?: string; conteudo?: string };
  if (!request.conteudo?.trim()) {
    const mapped = mapValidationToApiResponse("conteudo é obrigatório.");
    return errorResponse(mapped.status, mapped.body);
  }

  const note = await curatorTools.criarNota(access.userId, {
    jornada_id: request.jornada_id,
    titulo: request.titulo,
    conteudo: request.conteudo.trim(),
  });

  await recordOperationalAudit({
    eventType: "CURATOR_NOTA",
    actorId: access.userId,
    actorRole: "STAFF",
    jornadaId: request.jornada_id ?? null,
    resultado: "SUCESSO",
    metadata: { nota_id: note.id },
  });

  return successResponse(note, 201);
}

export async function handleObterChecklist(jornadaId: string): Promise<Response> {
  const access = await requireCurator();
  if (!access.ok) return access.response;
  return successResponse(await curatorTools.obterChecklist(access.userId, jornadaId));
}

export async function handleSalvarChecklist(jornadaId: string, body: unknown): Promise<Response> {
  const access = await requireCurator();
  if (!access.ok) return access.response;

  const request = body as { items?: unknown[] };
  if (!request.items) {
    const mapped = mapValidationToApiResponse("items é obrigatório.");
    return errorResponse(mapped.status, mapped.body);
  }

  const checklist = await curatorTools.salvarChecklist(
    access.userId,
    jornadaId,
    request.items as import("@/curator-tools-flow/contracts/curator-tools").CuratorChecklistItemView[],
  );

  await recordOperationalAudit({
    eventType: "CURATOR_CHECKLIST",
    actorId: access.userId,
    actorRole: "STAFF",
    jornadaId,
    resultado: "SUCESSO",
    metadata: { itens: checklist.items.length },
  });

  return successResponse(checklist);
}

export async function handleListarTemplates(): Promise<Response> {
  const access = await requireCurator();
  if (!access.ok) return access.response;
  return successResponse(await curatorTools.listarTemplates(access.userId));
}

export async function handleCriarTemplate(body: unknown): Promise<Response> {
  const access = await requireCurator();
  if (!access.ok) return access.response;

  const request = body as { categoria?: string; titulo?: string; conteudo?: string };
  if (!request.categoria || !request.titulo || !request.conteudo) {
    const mapped = mapValidationToApiResponse("categoria, titulo e conteudo são obrigatórios.");
    return errorResponse(mapped.status, mapped.body);
  }

  const template = await curatorTools.criarTemplate(access.userId, {
    categoria: request.categoria as import("@/curator-tools-flow/contracts/curator-tools").CuratorTemplateCategory,
    titulo: request.titulo,
    conteudo: request.conteudo,
  });

  await recordOperationalAudit({
    eventType: "CURATOR_TEMPLATE",
    actorId: access.userId,
    actorRole: "STAFF",
    resultado: "SUCESSO",
    metadata: { template_id: template.id, categoria: template.categoria },
  });

  return successResponse(template, 201);
}

export async function handleHistoricoConsolidado(jornadaId: string): Promise<Response> {
  const access = await requireCurator();
  if (!access.ok) return access.response;
  return successResponse(await curatorTools.obterHistoricoConsolidado(jornadaId));
}

export async function handleProdutividade(): Promise<Response> {
  const access = await requireCurator();
  if (!access.ok) return access.response;
  return successResponse(await curatorTools.obterProdutividade(access.userId));
}
