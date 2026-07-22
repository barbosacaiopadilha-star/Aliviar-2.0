import { listDoctors } from "@/alicia/catalog";
import {
  DEFAULT_CHECKLIST_ITEMS,
  type CuratorChecklistItemView,
  CuratorChecklistView,
  CuratorFavoriteEntityType,
  CuratorFavoriteView,
  CuratorHistoricoConsolidadoView,
  CuratorHistoricoItemView,
  CuratorPrivateNoteView,
  CuratorProdutividadeView,
  CuratorSearchResult,
  CuratorSearchResultItem,
  CuratorTemplateCategory,
  type CuratorTemplateView,
} from "@/curator-tools-flow/contracts/curator-tools";
import type { EstadoOperacionalCurador } from "@/curator-flow/contracts/curador-view";
import { SupabaseCuradorQuery } from "@/infrastructure/curador/supabase-curador-query";
import { derivarEstadoOperacionalCurador } from "@/infrastructure/curador/curador-estado-operacional";
import {
  entregaEstaAprovada,
  normalizarWorkspace,
  opcoesEstaoCompletas,
} from "@/infrastructure/curador/curador-workspace";
import { readModelToView, viewToReadModel } from "@/infrastructure/jornada/jornada-view-projection";
import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import {
  aggregateProdutividade,
  dedupeSearchResults,
  horasDesde,
  sanitizeSearchTerm,
} from "@/infrastructure/curador-tools/curator-tools-helpers";

function normalizeQuery(query: string): string {
  return sanitizeSearchTerm(query).toLowerCase();
}

export class CuratorToolsService {
  async pesquisarGlobal(_curatorId: string, query: string): Promise<CuratorSearchResult> {
    const q = normalizeQuery(query);
    const resultados: CuratorSearchResultItem[] = [];

    if (!q || q.length < 2) {
      return { query, resultados: [], total: 0 };
    }

    const supabase = await createClient();

    const { data: patients } = await supabase
      .from("patients")
      .select("id, full_name, preferred_name")
      .or(`full_name.ilike.%${q}%,preferred_name.ilike.%${q}%`)
      .limit(10);

    for (const patient of patients ?? []) {
      const nome = patient.preferred_name?.trim() || patient.full_name;
      resultados.push({
        entity_type: "PACIENTE",
        entity_id: patient.id,
        titulo: nome,
        subtitulo: "Paciente",
        href: `/patients/${patient.id}`,
      });
    }

    const { data: journeys } = await supabase
      .from("journeys")
      .select("id, title, patient_id")
      .or(`title.ilike.%${q}%,id.ilike.%${q}%`)
      .limit(15);

    for (const journey of journeys ?? []) {
      resultados.push({
        entity_type: journey.id.toLowerCase().includes(q) ? "NUMERO_JORNADA" : "JORNADA",
        entity_id: journey.id,
        titulo: journey.title,
        subtitulo: `Jornada ${journey.id.slice(0, 8)}…`,
        href: `/curador/casos/${journey.id}`,
      });
    }

    const { data: documents } = await supabase
      .from("patient_documents")
      .select("id, nome_arquivo, journey_id")
      .ilike("nome_arquivo", `%${q}%`)
      .limit(10);

    for (const doc of documents ?? []) {
      resultados.push({
        entity_type: "DOCUMENTO",
        entity_id: doc.id,
        titulo: doc.nome_arquivo,
        subtitulo: "Documento",
        href: doc.journey_id ? `/curador/casos/${doc.journey_id}` : "/curador",
      });
    }

    for (const doctor of listDoctors()) {
      const haystack = `${doctor.name} ${doctor.specialty} ${doctor.location.city}`.toLowerCase();
      if (haystack.includes(q)) {
        resultados.push({
          entity_type: "MEDICO",
          entity_id: doctor.id,
          titulo: doctor.name,
          subtitulo: `${doctor.specialty} — ${doctor.location.city}`,
          href: `/alicia/medicos/${doctor.id}`,
        });
      }
    }

    if (q.includes("protocolo") || q.length >= 4) {
      for (const journey of journeys ?? []) {
        if (journey.title.toLowerCase().includes("protocolo") || q.includes("protocolo")) {
          resultados.push({
            entity_type: "PROTOCOLO",
            entity_id: journey.id,
            titulo: journey.title,
            subtitulo: "Protocolo / jornada",
            href: `/curador/casos/${journey.id}`,
          });
        }
      }
    }

    const deduped = dedupeSearchResults(resultados);

    return { query, resultados: deduped, total: deduped.length };
  }

  async listarFavoritos(curatorId: string): Promise<CuratorFavoriteView[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("curator_favorites")
      .select("entity_type, entity_id, label, created_at")
      .eq("curator_id", curatorId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as CuratorFavoriteView[];
  }

  async adicionarFavorito(
    curatorId: string,
    input: { entity_type: CuratorFavoriteEntityType; entity_id: string; label: string },
  ): Promise<CuratorFavoriteView> {
    const supabase = await createClient();
    const row = {
      curator_id: curatorId,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      label: input.label,
    };
    const { error } = await supabase.from("curator_favorites").upsert(row);
    if (error) throw new Error(error.message);
    return { ...row, created_at: new Date().toISOString() };
  }

  async removerFavorito(
    curatorId: string,
    entityType: CuratorFavoriteEntityType,
    entityId: string,
  ): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("curator_favorites")
      .delete()
      .eq("curator_id", curatorId)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId);
    if (error) throw new Error(error.message);
  }

  async listarNotas(curatorId: string, jornadaId?: string): Promise<CuratorPrivateNoteView[]> {
    const supabase = await createClient();
    let query = supabase
      .from("curator_private_notes")
      .select("id, jornada_id, titulo, conteudo, created_at, updated_at")
      .eq("curator_id", curatorId)
      .order("updated_at", { ascending: false });

    if (jornadaId) query = query.eq("jornada_id", jornadaId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as CuratorPrivateNoteView[];
  }

  async criarNota(
    curatorId: string,
    input: { jornada_id?: string | null; titulo?: string; conteudo: string },
  ): Promise<CuratorPrivateNoteView> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("curator_private_notes")
      .insert({
        curator_id: curatorId,
        jornada_id: input.jornada_id ?? null,
        titulo: input.titulo ?? "Nota",
        conteudo: input.conteudo,
      })
      .select("id, jornada_id, titulo, conteudo, created_at, updated_at")
      .single();

    if (error || !data) throw new Error(error?.message ?? "note_create_failed");
    return data as CuratorPrivateNoteView;
  }

  async obterChecklist(curatorId: string, jornadaId: string): Promise<CuratorChecklistView> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("curator_checklists")
      .select("items, updated_at")
      .eq("curator_id", curatorId)
      .eq("jornada_id", jornadaId)
      .maybeSingle();

    if (!data) {
      const items: CuratorChecklistItemView[] = DEFAULT_CHECKLIST_ITEMS.map((label) => ({
        id: randomUUID(),
        label,
        concluido: false,
      }));
      return { jornada_id: jornadaId, items, atualizado_em: new Date().toISOString() };
    }

    return {
      jornada_id: jornadaId,
      items: (data.items as CuratorChecklistItemView[]) ?? [],
      atualizado_em: data.updated_at as string,
    };
  }

  async salvarChecklist(
    curatorId: string,
    jornadaId: string,
    items: CuratorChecklistItemView[],
  ): Promise<CuratorChecklistView> {
    const supabase = await createClient();
    const now = new Date().toISOString();
    const { error } = await supabase.from("curator_checklists").upsert({
      curator_id: curatorId,
      jornada_id: jornadaId,
      items,
      updated_at: now,
    });
    if (error) throw new Error(error.message);
    return { jornada_id: jornadaId, items, atualizado_em: now };
  }

  async listarTemplates(curatorId: string): Promise<CuratorTemplateView[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("curator_templates")
      .select("id, categoria, titulo, conteudo, updated_at")
      .eq("curator_id", curatorId)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: row.id,
      categoria: row.categoria as CuratorTemplateCategory,
      titulo: row.titulo,
      conteudo: row.conteudo,
      atualizado_em: row.updated_at,
    }));
  }

  async criarTemplate(
    curatorId: string,
    input: { categoria: CuratorTemplateCategory; titulo: string; conteudo: string },
  ): Promise<CuratorTemplateView> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("curator_templates")
      .insert({ curator_id: curatorId, ...input })
      .select("id, categoria, titulo, conteudo, updated_at")
      .single();

    if (error || !data) throw new Error(error?.message ?? "template_create_failed");
    return {
      id: data.id,
      categoria: data.categoria as CuratorTemplateCategory,
      titulo: data.titulo,
      conteudo: data.conteudo,
      atualizado_em: data.updated_at,
    };
  }

  async obterHistoricoConsolidado(jornadaId: string): Promise<CuratorHistoricoConsolidadoView> {
    const query = new SupabaseCuradorQuery();
    const caso = await query.obterCaso(jornadaId);
    if (!caso) {
      return { jornada_id: jornadaId, itens: [] };
    }

    const itens: CuratorHistoricoItemView[] = [];

    for (const item of caso.timeline_jornada) {
      itens.push({
        id: item.id,
        tipo: "JORNADA",
        titulo: item.titulo,
        descricao: item.descricao,
        responsavel:
          caso.responsavel.nome_exibicao ?? caso.responsavel.tipo ?? null,
        ocorrido_em: item.ocorrido_em,
      });
    }

    for (const doc of caso.documentos) {
      itens.push({
        id: doc.id,
        tipo: "DOCUMENTO",
        titulo: doc.nome_arquivo,
        descricao: `Status: ${doc.status}`,
        responsavel: null,
        ocorrido_em: doc.recebido_em,
      });
    }

    for (const item of caso.timeline_operacional) {
      itens.push({
        id: item.id,
        tipo: item.tipo === "COMENTARIO" ? "COMENTARIO" : "ACAO",
        titulo: item.titulo,
        descricao: item.descricao,
        responsavel: item.responsavel?.nome_exibicao ?? null,
        ocorrido_em: item.ocorrido_em,
      });
    }

    const supabase = await createClient();
    const { data: auditEvents } = await supabase
      .from("operational_audit_events")
      .select("id, event_type, occurred_at, actor_role, resultado, metadata")
      .eq("jornada_id", jornadaId)
      .order("occurred_at", { ascending: false })
      .limit(20);

    for (const event of auditEvents ?? []) {
      itens.push({
        id: event.id as string,
        tipo: "AUDITORIA",
        titulo: event.event_type as string,
        descricao: `${event.resultado} (${event.actor_role})`,
        responsavel: null,
        ocorrido_em: event.occurred_at as string,
      });
    }

    itens.sort((a, b) => new Date(b.ocorrido_em).getTime() - new Date(a.ocorrido_em).getTime());

    return { jornada_id: jornadaId, itens };
  }

  async obterProdutividade(curatorId: string): Promise<CuratorProdutividadeView> {
    const supabase = await createClient();
    const { data: views } = await supabase
      .from("patient_journey_views")
      .select("journey_id, view_data, updated_at");

    const { data: workspaces } = await supabase
      .from("curator_case_workspaces")
      .select("journey_id, curator_id, workspace_data, updated_at")
      .eq("curator_id", curatorId);

    const workspaceMap = new Map((workspaces ?? []).map((w) => [w.journey_id, w]));
    const samples = [];

    for (const row of views ?? []) {
      const ws = workspaceMap.get(row.journey_id as string);
      if (!ws) continue;

      const view = readModelToView(viewToReadModel(row.view_data as JornadaDoPacienteView));
      const workspace = normalizarWorkspace(ws.workspace_data);
      const estado: EstadoOperacionalCurador = derivarEstadoOperacionalCurador(
        view,
        opcoesEstaoCompletas(workspace.opcoes_registradas),
        entregaEstaAprovada(workspace.rascunho_entrega),
      );

      samples.push({
        estado,
        horasDesdeAtualizacao: horasDesde(row.updated_at as string),
      });
    }

    return aggregateProdutividade(samples);
  }
}

export const curatorTools = new CuratorToolsService();
