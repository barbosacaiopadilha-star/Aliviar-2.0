import type {
  JourneyNotificationView,
  NotificationListFilter,
  NotificationPreferencesView,
} from "@/notification-flow/contracts/journey-notification";
import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import { derivarNotificacoesDaJornada, filtrarNotificacoes } from "@/infrastructure/notifications/journey-notification-engine";
import { createClient } from "@/lib/supabase/server";
import { recordOperationalAudit } from "api/shared/observability/instrument-operation";

const DEFAULT_PREFERENCES: NotificationPreferencesView = {
  receber_email: true,
  receber_whatsapp: false,
  somente_plataforma: false,
  atualizado_em: new Date().toISOString(),
};

function mapRow(row: Record<string, unknown>): JourneyNotificationView {
  return {
    id: row.id as string,
    jornada_id: row.journey_id as string,
    tipo: row.tipo as JourneyNotificationView["tipo"],
    titulo: row.titulo as string,
    mensagem: row.mensagem as string,
    prioridade: row.prioridade as JourneyNotificationView["prioridade"],
    data: row.criada_em as string,
    lida: row.lida as boolean,
    origem: row.origem as JourneyNotificationView["origem"],
    referencia_tipo: (row.referencia_tipo as JourneyNotificationView["referencia_tipo"]) ?? null,
    referencia_id: (row.referencia_id as string) ?? null,
  };
}

export class JourneyNotificationService {
  async sincronizarDaJornada(params: {
    patientId: string;
    journeyId: string;
    anterior: JornadaDoPacienteView | null;
    atual: JornadaDoPacienteView;
  }): Promise<number> {
    const drafts = derivarNotificacoesDaJornada({
      jornadaId: params.journeyId,
      anterior: params.anterior,
      atual: params.atual,
    });

    if (drafts.length === 0) return 0;

    const supabase = await createClient();
    let inseridas = 0;

    for (const draft of drafts) {
      const { error } = await supabase.from("patient_notifications").upsert(
        {
          patient_id: params.patientId,
          journey_id: params.journeyId,
          tipo: draft.tipo,
          titulo: draft.titulo,
          mensagem: draft.mensagem,
          prioridade: draft.prioridade,
          origem: draft.origem,
          referencia_tipo: draft.referencia_tipo,
          referencia_id: draft.referencia_id,
          source_event_key: draft.source_event_key,
          criada_em: draft.data,
          lida: false,
        },
        { onConflict: "patient_id,source_event_key", ignoreDuplicates: true },
      );

      if (!error) {
        inseridas += 1;
        await recordOperationalAudit({
          eventType: "NOTIFICACAO_GERADA",
          patientId: params.patientId,
          jornadaId: params.journeyId,
          actorRole: "SYSTEM",
          resultado: "SUCESSO",
          metadata: { tipo: draft.tipo, source_event_key: draft.source_event_key },
        });
      }
    }

    return inseridas;
  }

  async listar(patientId: string, filter: NotificationListFilter = {}): Promise<JourneyNotificationView[]> {
    const supabase = await createClient();
    let query = supabase
      .from("patient_notifications")
      .select(
        "id, journey_id, tipo, titulo, mensagem, prioridade, criada_em, lida, origem, referencia_tipo, referencia_id",
      )
      .eq("patient_id", patientId)
      .order("criada_em", { ascending: false });

    if (filter.tipo) query = query.eq("tipo", filter.tipo);
    if (filter.lida !== undefined) query = query.eq("lida", filter.lida);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const mapped = (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
    return filtrarNotificacoes(mapped, filter);
  }

  async marcarComoLida(patientId: string, notificationId: string): Promise<JourneyNotificationView> {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("patient_notifications")
      .update({ lida: true, lida_em: now })
      .eq("id", notificationId)
      .eq("patient_id", patientId)
      .select(
        "id, journey_id, tipo, titulo, mensagem, prioridade, criada_em, lida, origem, referencia_tipo, referencia_id",
      )
      .single();

    if (error || !data) throw new Error(error?.message ?? "notification_not_found");

    await recordOperationalAudit({
      eventType: "NOTIFICACAO_LIDA",
      patientId,
      jornadaId: data.journey_id as string,
      actorRole: "PATIENT",
      resultado: "SUCESSO",
      metadata: { notificacao_id: notificationId },
    });

    return mapRow(data as Record<string, unknown>);
  }

  async obterPreferencias(patientId: string): Promise<NotificationPreferencesView> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("patient_notification_preferences")
      .select("receber_email, receber_whatsapp, somente_plataforma, atualizado_em")
      .eq("patient_id", patientId)
      .maybeSingle();

    if (!data) return DEFAULT_PREFERENCES;

    return {
      receber_email: data.receber_email as boolean,
      receber_whatsapp: data.receber_whatsapp as boolean,
      somente_plataforma: data.somente_plataforma as boolean,
      atualizado_em: data.atualizado_em as string,
    };
  }

  async salvarPreferencias(
    patientId: string,
    input: Omit<NotificationPreferencesView, "atualizado_em">,
  ): Promise<NotificationPreferencesView> {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("patient_notification_preferences")
      .upsert({
        patient_id: patientId,
        receber_email: input.receber_email,
        receber_whatsapp: input.receber_whatsapp,
        somente_plataforma: input.somente_plataforma,
        atualizado_em: now,
      })
      .select("receber_email, receber_whatsapp, somente_plataforma, atualizado_em")
      .single();

    if (error || !data) throw new Error(error?.message ?? "preferences_save_failed");

    await recordOperationalAudit({
      eventType: "NOTIFICACAO_PREFERENCIA",
      patientId,
      actorRole: "PATIENT",
      resultado: "SUCESSO",
      metadata: {
        receber_email: input.receber_email,
        receber_whatsapp: input.receber_whatsapp,
        somente_plataforma: input.somente_plataforma,
      },
    });

    return {
      receber_email: data.receber_email as boolean,
      receber_whatsapp: data.receber_whatsapp as boolean,
      somente_plataforma: data.somente_plataforma as boolean,
      atualizado_em: data.atualizado_em as string,
    };
  }
}

export const journeyNotificationService = new JourneyNotificationService();
