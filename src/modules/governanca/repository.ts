import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  audienciasDosPapeis,
  pendenciasDeAceite,
  versaoVigente,
  type AceiteRegistrado,
  type Audiencia,
  type DocumentoLegal,
  type OrigemDeAceite,
  type PendenciaDeAceite,
  type VersaoDeDocumento,
} from "./documentos";

/**
 * GOVERNANÇA — o lado do banco.
 *
 * Leitura pelas policies (documento publicado é público por natureza: quem
 * vai aceitar precisa poder ler antes de ter sessão). Escrita SEMPRE pelas
 * funções `security definer` — o hash é carimbado pelo servidor, nunca
 * informado pelo cliente, e a vigência é validada lá dentro.
 */

const DOC_COLUNAS = "id, slug, nome, resumo, audiencia, obrigatorio, revogavel, ativo";
const VERSAO_COLUNAS =
  "id, document_id, versao, conteudo, conteudo_hash, idioma, requires_reacceptance, effective_at, published_at";

function documentoDaLinha(row: Record<string, unknown>): DocumentoLegal {
  return {
    id: row.id as string,
    slug: row.slug as string,
    nome: row.nome as string,
    resumo: (row.resumo as string | null) ?? null,
    audiencia: (row.audiencia as Audiencia[]) ?? [],
    obrigatorio: Boolean(row.obrigatorio),
    revogavel: Boolean(row.revogavel),
    ativo: Boolean(row.ativo),
  };
}

function versaoDaLinha(row: Record<string, unknown>): VersaoDeDocumento {
  return {
    id: row.id as string,
    documentId: row.document_id as string,
    versao: row.versao as string,
    conteudo: row.conteudo as string,
    conteudoHash: row.conteudo_hash as string,
    idioma: row.idioma as string,
    requiresReacceptance: Boolean(row.requires_reacceptance),
    effectiveAt: row.effective_at as string,
    publishedAt: row.published_at as string,
  };
}

export async function listarDocumentosAtivos(
  supabase: SupabaseClient,
): Promise<DocumentoLegal[]> {
  const { data, error } = await supabase
    .from("legal_documents")
    .select(DOC_COLUNAS)
    .eq("ativo", true)
    .order("slug");
  if (error) throw new Error(`Documentos legais: ${error.message}`);
  return (data ?? []).map((row) => documentoDaLinha(row as Record<string, unknown>));
}

export async function listarVersoes(
  supabase: SupabaseClient,
  documentIds: readonly string[],
): Promise<Map<string, VersaoDeDocumento[]>> {
  const porDocumento = new Map<string, VersaoDeDocumento[]>();
  if (documentIds.length === 0) return porDocumento;

  const { data, error } = await supabase
    .from("legal_document_versions")
    .select(VERSAO_COLUNAS)
    .in("document_id", documentIds)
    .order("effective_at", { ascending: false });
  if (error) throw new Error(`Versões de documentos: ${error.message}`);

  for (const row of data ?? []) {
    const versao = versaoDaLinha(row as Record<string, unknown>);
    const lista = porDocumento.get(versao.documentId) ?? [];
    lista.push(versao);
    porDocumento.set(versao.documentId, lista);
  }
  return porDocumento;
}

/** O documento por slug, com a versão vigente — a leitura do portal público. */
export async function carregarDocumentoPublico(
  supabase: SupabaseClient,
  slug: string,
): Promise<{ documento: DocumentoLegal; vigente: VersaoDeDocumento | null } | null> {
  const { data, error } = await supabase
    .from("legal_documents")
    .select(DOC_COLUNAS)
    .eq("slug", slug)
    .eq("ativo", true)
    .maybeSingle();
  if (error) throw new Error(`Documento ${slug}: ${error.message}`);
  if (!data) return null;

  const documento = documentoDaLinha(data as Record<string, unknown>);
  const versoes = (await listarVersoes(supabase, [documento.id])).get(documento.id) ?? [];
  return { documento, vigente: versaoVigente(versoes) };
}

/**
 * UMA versão específica, por slug + versão. É o permalink de prova: endereça
 * o texto exato que alguém aceitou, e continua servindo mesmo depois de
 * superado — é isso que o torna prova.
 */
export async function carregarVersaoPorPermalink(
  supabase: SupabaseClient,
  slug: string,
  versao: string,
): Promise<{ documento: DocumentoLegal; versao: VersaoDeDocumento } | null> {
  const { data: docRow, error: docError } = await supabase
    .from("legal_documents")
    .select(DOC_COLUNAS)
    .eq("slug", slug)
    .maybeSingle();
  if (docError) throw new Error(`Documento ${slug}: ${docError.message}`);
  if (!docRow) return null;

  const documento = documentoDaLinha(docRow as Record<string, unknown>);
  const { data: verRow, error: verError } = await supabase
    .from("legal_document_versions")
    .select(VERSAO_COLUNAS)
    .eq("document_id", documento.id)
    .eq("versao", versao)
    .maybeSingle();
  if (verError) throw new Error(`Versão ${versao} de ${slug}: ${verError.message}`);
  if (!verRow) return null;

  return { documento, versao: versaoDaLinha(verRow as Record<string, unknown>) };
}

/**
 * Os aceites da própria pessoa, com a revogação resolvida. A RLS garante o
 * escopo (só os próprios, ou tudo para o administrador).
 */
export async function listarAceitesDoTitular(
  supabase: SupabaseClient,
  profileId: string,
): Promise<AceiteRegistrado[]> {
  const { data, error } = await supabase
    .from("legal_acceptances")
    .select(
      "id, profile_id, version_id, conteudo_hash, aceito_em, origem, idioma, contexto, legal_acceptance_revocations(revogado_em)",
    )
    .eq("profile_id", profileId)
    .order("aceito_em", { ascending: false });
  if (error) throw new Error(`Aceites: ${error.message}`);

  return (data ?? []).map((row) => {
    const registro = row as Record<string, unknown>;
    const revogacoes = (registro.legal_acceptance_revocations ?? []) as { revogado_em: string }[];
    return {
      id: registro.id as string,
      profileId: registro.profile_id as string,
      versionId: registro.version_id as string,
      conteudoHash: registro.conteudo_hash as string,
      aceitoEm: registro.aceito_em as string,
      origem: registro.origem as OrigemDeAceite,
      idioma: registro.idioma as string,
      contexto: (registro.contexto as Record<string, unknown>) ?? {},
      revogadoEm: revogacoes[0]?.revogado_em ?? null,
    };
  });
}

export type EstadoDeGovernanca = {
  documentos: DocumentoLegal[];
  versoesPorDocumento: Map<string, VersaoDeDocumento[]>;
  aceites: AceiteRegistrado[];
  pendencias: PendenciaDeAceite[];
};

/**
 * O estado completo de governança de uma pessoa: o que existe, o que ela já
 * aceitou e o que ainda falta. Uma ida só ao banco por tabela — é o que o
 * gate consulta e o que a área da conta exibe.
 */
export async function carregarEstadoDeGovernanca(
  supabase: SupabaseClient,
  profileId: string,
  papeis: readonly string[],
): Promise<EstadoDeGovernanca> {
  const documentos = await listarDocumentosAtivos(supabase);
  const versoesPorDocumento = await listarVersoes(
    supabase,
    documentos.map((d) => d.id),
  );
  const aceites = await listarAceitesDoTitular(supabase, profileId);

  const pendencias = pendenciasDeAceite({
    audiencias: audienciasDosPapeis(papeis),
    documentos,
    versoesPorDocumento,
    aceites,
  });

  return { documentos, versoesPorDocumento, aceites, pendencias };
}

/**
 * Registrar aceites. O cliente informa APENAS os ids de versão que viu; a RPC
 * valida a vigência e carimba o hash lido do banco. Ou todos entram, ou
 * nenhum — a transação é da função.
 */
export async function registrarAceites(
  supabase: SupabaseClient,
  params: {
    versionIds: readonly string[];
    origem: OrigemDeAceite;
    ip?: string | null;
    userAgent?: string | null;
    contexto?: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await supabase.schema("curadoria").rpc("register_legal_acceptances", {
    _version_ids: params.versionIds,
    _origem: params.origem,
    _ip: params.ip ?? null,
    _user_agent: params.userAgent ?? null,
    _contexto: params.contexto ?? {},
  });
  if (error) throw new Error(error.message);
}

export async function revogarAceite(
  supabase: SupabaseClient,
  params: { acceptanceId: string; motivo?: string | null; ip?: string | null; userAgent?: string | null },
): Promise<void> {
  const { error } = await supabase.schema("curadoria").rpc("revoke_legal_acceptance", {
    _acceptance_id: params.acceptanceId,
    _motivo: params.motivo ?? null,
    _ip: params.ip ?? null,
    _user_agent: params.userAgent ?? null,
  });
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Direitos do titular (LGPD) — a estrutura, sem a política
// ---------------------------------------------------------------------------

export const TIPOS_DE_PEDIDO = [
  "acesso",
  "correcao",
  "exclusao",
  "portabilidade",
  "revogacao",
] as const;
export type TipoDePedido = (typeof TIPOS_DE_PEDIDO)[number];

export type PedidoDeTitular = {
  id: string;
  tipo: TipoDePedido;
  status: "recebido" | "em_execucao" | "concluido" | "recusado";
  prazoEm: string | null;
  criadoEm: string;
  concluidoEm: string | null;
  desfecho: string | null;
};

export async function listarPedidosDoTitular(
  supabase: SupabaseClient,
  profileId: string,
): Promise<PedidoDeTitular[]> {
  const { data, error } = await supabase
    .from("data_subject_requests")
    .select("id, tipo, status, prazo_em, criado_em, concluido_em, desfecho")
    .eq("profile_id", profileId)
    .order("criado_em", { ascending: false });
  if (error) throw new Error(`Pedidos do titular: ${error.message}`);

  return (data ?? []).map((row) => {
    const registro = row as Record<string, unknown>;
    return {
      id: registro.id as string,
      tipo: registro.tipo as TipoDePedido,
      status: registro.status as PedidoDeTitular["status"],
      prazoEm: (registro.prazo_em as string | null) ?? null,
      criadoEm: registro.criado_em as string,
      concluidoEm: (registro.concluido_em as string | null) ?? null,
      desfecho: (registro.desfecho as string | null) ?? null,
    };
  });
}

/**
 * Abrir pedido é ato do titular. O PRAZO fica nulo de propósito: preenchê-lo
 * é decisão jurídica (PRIV-03) — a coluna existe para recebê-lo sem que nada
 * aqui precise ser reescrito.
 */
export async function abrirPedidoDeTitular(
  supabase: SupabaseClient,
  params: { profileId: string; tipo: TipoDePedido },
): Promise<string> {
  const { data, error } = await supabase
    .from("data_subject_requests")
    .insert({ profile_id: params.profileId, tipo: params.tipo })
    .select("id")
    .single();
  if (error) throw new Error(`Abertura de pedido: ${error.message}`);
  return data!.id as string;
}
