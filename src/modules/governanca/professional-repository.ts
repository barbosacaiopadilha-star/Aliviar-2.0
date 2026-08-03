import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { listarVersoes, listarDocumentosAtivos } from "./repository";
import { versaoVigente, type DocumentoLegal, type VersaoDeDocumento } from "./documentos";

/**
 * GOVERNANÇA DO PROFISSIONAL — o lado do banco, na premissa da 1.0.
 *
 * Não há Portal do Profissional e a Rede não é marketplace: o profissional é
 * identificado, contatado e homologado pela equipe de Curadoria. Logo o
 * aceite dele é um ato do titular que a EQUIPE REGISTRA, declarando como
 * obteve — nunca um aceite eletrônico simulado.
 *
 * Toda a leitura aqui é escopada por perfil profissional (não por conta),
 * porque o profissional pode não ter conta nenhuma. Quando o Portal existir,
 * as mesmas linhas passam a receber aceites eletrônicos: muda a `natureza`,
 * não a estrutura.
 */

export type AceiteDoProfissional = {
  id: string;
  professionalProfileId: string;
  versionId: string;
  documentoSlug: string;
  documentoNome: string;
  versao: string;
  conteudoHash: string;
  aceitoEm: string;
  natureza: "eletronico_pelo_titular" | "registrado_pela_equipe";
  registradoPor: string | null;
  formaDeObtencao: string | null;
  evidenciaRef: string | null;
  revogadoEm: string | null;
};

export async function listarAceitesDoProfissional(
  supabase: SupabaseClient,
  professionalProfileId: string,
): Promise<AceiteDoProfissional[]> {
  const { data, error } = await supabase
    .from("legal_acceptances")
    .select(
      "id, professional_profile_id, version_id, conteudo_hash, aceito_em, natureza, registrado_por, forma_de_obtencao, evidencia_ref, " +
        "legal_document_versions(versao, legal_documents(slug, nome)), " +
        "legal_acceptance_revocations(revogado_em)",
    )
    .eq("professional_profile_id", professionalProfileId)
    .order("aceito_em", { ascending: false });
  if (error) throw new Error(`Aceites do profissional: ${error.message}`);

  return (data ?? []).map((row) => {
    const registro = row as unknown as Record<string, unknown>;
    const versao = registro.legal_document_versions as
      | { versao: string; legal_documents: { slug: string; nome: string } }
      | null;
    const revogacoes = (registro.legal_acceptance_revocations ?? []) as { revogado_em: string }[];
    return {
      id: registro.id as string,
      professionalProfileId: registro.professional_profile_id as string,
      versionId: registro.version_id as string,
      documentoSlug: versao?.legal_documents?.slug ?? "",
      documentoNome: versao?.legal_documents?.nome ?? "",
      versao: versao?.versao ?? "",
      conteudoHash: registro.conteudo_hash as string,
      aceitoEm: registro.aceito_em as string,
      natureza: registro.natureza as AceiteDoProfissional["natureza"],
      registradoPor: (registro.registrado_por as string | null) ?? null,
      formaDeObtencao: (registro.forma_de_obtencao as string | null) ?? null,
      evidenciaRef: (registro.evidencia_ref as string | null) ?? null,
      revogadoEm: revogacoes[0]?.revogado_em ?? null,
    };
  });
}

export type PendenciaDoProfissional = {
  documento: DocumentoLegal;
  versao: VersaoDeDocumento;
};

/**
 * O que falta este profissional aceitar para poder ser publicado na Rede.
 *
 * Só RESPONDE — não bloqueia. Condicionar a publicação a isto é decisão de
 * produto/jurídico, tomada de forma deliberada; a infraestrutura entrega a
 * resposta para que essa decisão possa ser aplicada quando existir.
 */
export async function pendenciasLegaisDoProfissional(
  supabase: SupabaseClient,
  professionalProfileId: string,
): Promise<PendenciaDoProfissional[]> {
  const documentos = (await listarDocumentosAtivos(supabase)).filter(
    (d) => d.obrigatorio && d.audiencia.includes("profissional"),
  );
  if (documentos.length === 0) return [];

  const versoes = await listarVersoes(supabase, documentos.map((d) => d.id));
  const aceites = await listarAceitesDoProfissional(supabase, professionalProfileId);
  const aceitosVigentes = new Set(
    aceites.filter((a) => a.revogadoEm === null).map((a) => a.versionId),
  );

  const pendencias: PendenciaDoProfissional[] = [];
  for (const documento of documentos) {
    const vigente = versaoVigente(versoes.get(documento.id) ?? []);
    if (!vigente) continue;
    if (aceitosVigentes.has(vigente.id)) continue;
    pendencias.push({ documento, versao: vigente });
  }
  return pendencias;
}

/**
 * Registrar os aceites obtidos fora do sistema. A RPC exige o papel da
 * Curadoria, exige a forma de obtenção e carimba o hash do servidor — o ator
 * registrado vem de `auth.uid()`, nunca do cliente.
 */
export async function registrarAceitesDoProfissional(
  supabase: SupabaseClient,
  params: {
    professionalProfileId: string;
    versionIds: readonly string[];
    formaDeObtencao: string;
    evidenciaRef?: string | null;
    aceitoEm?: string | null;
  },
): Promise<void> {
  const { error } = await supabase
    .schema("curadoria")
    .rpc("register_professional_acceptances", {
      _professional_profile_id: params.professionalProfileId,
      _version_ids: params.versionIds,
      _forma_de_obtencao: params.formaDeObtencao,
      _evidencia_ref: params.evidenciaRef ?? null,
      _aceito_em: params.aceitoEm ?? null,
    });
  if (error) throw new Error(error.message);
}
