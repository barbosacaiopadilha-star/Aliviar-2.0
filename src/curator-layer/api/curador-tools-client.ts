import type {
  CuratorChecklistView,
  CuratorFavoriteEntityType,
  CuratorFavoriteView,
  CuratorHistoricoConsolidadoView,
  CuratorPrivateNoteView,
  CuratorProdutividadeView,
  CuratorSearchResult,
  CuratorTemplateCategory,
  CuratorTemplateView,
} from "@/curator-tools-flow/contracts/curator-tools";
import { CuradorApiError } from "@/curator-layer/api/curador-client";

async function parseError(response: Response): Promise<CuradorApiError> {
  let code = "UNKNOWN_ERROR";
  let message = "Não foi possível concluir a operação.";
  try {
    const body = (await response.json()) as { error?: { code?: string; message?: string } };
    code = body.error?.code ?? code;
    message = body.error?.message ?? message;
  } catch {
    // mantém padrão
  }
  return new CuradorApiError(response.status, code, message);
}

async function parseData<T>(response: Response): Promise<T> {
  if (!response.ok) throw await parseError(response);
  const body = (await response.json()) as { data: T };
  return body.data;
}

export async function pesquisarGlobal(query: string): Promise<CuratorSearchResult> {
  const response = await fetch(
    `/api/v1/curador/ferramentas/pesquisa?q=${encodeURIComponent(query)}`,
    { cache: "no-store" },
  );
  return parseData(response);
}

export async function listarFavoritos(): Promise<CuratorFavoriteView[]> {
  const response = await fetch("/api/v1/curador/ferramentas/favoritos", { cache: "no-store" });
  return parseData(response);
}

export async function adicionarFavorito(input: {
  entity_type: CuratorFavoriteEntityType;
  entity_id: string;
  label: string;
}): Promise<CuratorFavoriteView> {
  const response = await fetch("/api/v1/curador/ferramentas/favoritos", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input),
  });
  return parseData(response);
}

export async function removerFavorito(
  entityType: CuratorFavoriteEntityType,
  entityId: string,
): Promise<void> {
  const response = await fetch(
    `/api/v1/curador/ferramentas/favoritos/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`,
    { method: "DELETE" },
  );
  if (!response.ok) throw await parseError(response);
}

export async function listarNotas(jornadaId?: string): Promise<CuratorPrivateNoteView[]> {
  const query = jornadaId ? `?jornada_id=${encodeURIComponent(jornadaId)}` : "";
  const response = await fetch(`/api/v1/curador/ferramentas/notas${query}`, { cache: "no-store" });
  return parseData(response);
}

export async function criarNota(input: {
  jornada_id?: string;
  titulo?: string;
  conteudo: string;
}): Promise<CuratorPrivateNoteView> {
  const response = await fetch("/api/v1/curador/ferramentas/notas", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input),
  });
  return parseData(response);
}

export async function obterChecklist(jornadaId: string): Promise<CuratorChecklistView> {
  const response = await fetch(
    `/api/v1/curador/ferramentas/checklists/${encodeURIComponent(jornadaId)}`,
    { cache: "no-store" },
  );
  return parseData(response);
}

export async function salvarChecklist(
  jornadaId: string,
  items: CuratorChecklistView["items"],
): Promise<CuratorChecklistView> {
  const response = await fetch(
    `/api/v1/curador/ferramentas/checklists/${encodeURIComponent(jornadaId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ items }),
    },
  );
  return parseData(response);
}

export async function listarTemplates(): Promise<CuratorTemplateView[]> {
  const response = await fetch("/api/v1/curador/ferramentas/templates", { cache: "no-store" });
  return parseData(response);
}

export async function criarTemplate(input: {
  categoria: CuratorTemplateCategory;
  titulo: string;
  conteudo: string;
}): Promise<CuratorTemplateView> {
  const response = await fetch("/api/v1/curador/ferramentas/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input),
  });
  return parseData(response);
}

export async function obterHistoricoConsolidado(
  jornadaId: string,
): Promise<CuratorHistoricoConsolidadoView> {
  const response = await fetch(
    `/api/v1/curador/ferramentas/historico/${encodeURIComponent(jornadaId)}`,
    { cache: "no-store" },
  );
  return parseData(response);
}

export async function obterProdutividade(): Promise<CuratorProdutividadeView> {
  const response = await fetch("/api/v1/curador/ferramentas/produtividade", { cache: "no-store" });
  return parseData(response);
}
