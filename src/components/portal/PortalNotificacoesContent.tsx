"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  listarNotificacoes,
  marcarNotificacaoLida,
  obterPreferenciasNotificacao,
  salvarPreferenciasNotificacao,
} from "@/experience-layer/api/notificacoes-client";
import type {
  JourneyNotificationType,
  JourneyNotificationView,
  NotificationPreferencesView,
} from "@/notification-flow/contracts/journey-notification";

const TIPOS: Array<{ value: JourneyNotificationType | ""; label: string }> = [
  { value: "", label: "Todos os tipos" },
  { value: "DOCUMENTOS_RECEBIDOS", label: "Documentos recebidos" },
  { value: "DOCUMENTOS_PENDENTES", label: "Documentos pendentes" },
  { value: "CURADORIA_INICIADA", label: "Curadoria iniciada" },
  { value: "CURADORIA_CONCLUIDA", label: "Curadoria concluída" },
  { value: "ENTREGA_DISPONIVEL", label: "Entrega disponível" },
  { value: "ESCOLHA_REGISTRADA", label: "Escolha registrada" },
  { value: "ACOMPANHAMENTO_INICIADO", label: "Acompanhamento iniciado" },
];

export function PortalNotificacoesContent() {
  const [notificacoes, setNotificacoes] = useState<JourneyNotificationView[]>([]);
  const [preferencias, setPreferencias] = useState<NotificationPreferencesView | null>(null);
  const [tipo, setTipo] = useState<JourneyNotificationType | "">("");
  const [lida, setLida] = useState<"" | "true" | "false">("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [items, prefs] = await Promise.all([
        listarNotificacoes({
          tipo: tipo || undefined,
          lida: lida === "" ? undefined : lida === "true",
          q: q || undefined,
        }),
        obterPreferenciasNotificacao(),
      ]);
      setNotificacoes(items);
      setPreferencias(prefs);
    } finally {
      setLoading(false);
    }
  }, [tipo, lida, q]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void reload();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [reload]);

  async function handleMarcarLida(id: string) {
    await marcarNotificacaoLida(id);
    await reload();
  }

  async function handleSalvarPreferencias() {
    if (!preferencias) return;
    const saved = await salvarPreferenciasNotificacao({
      receber_email: preferencias.receber_email,
      receber_whatsapp: preferencias.receber_whatsapp,
      somente_plataforma: preferencias.somente_plataforma,
    });
    setPreferencias(saved);
  }

  return (
    <div className="space-y-8" data-testid="portal-notificacoes">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">Central de notificações</h1>
          <p className="text-sm text-ink-soft">Comunicação derivada da sua jornada</p>
        </div>
        <Link href="/portal" className="btn-secondary">
          Voltar ao portal
        </Link>
      </div>

      <section className="card p-4" data-testid="notificacoes-filtros">
        <div className="grid gap-3 sm:grid-cols-3">
          <select
            className="rounded-lg border border-line px-3 py-2 text-sm"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as JourneyNotificationType | "")}
          >
            {TIPOS.map((t) => (
              <option key={t.value || "all"} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-line px-3 py-2 text-sm"
            value={lida}
            onChange={(e) => setLida(e.target.value as "" | "true" | "false")}
          >
            <option value="">Todas</option>
            <option value="false">Não lidas</option>
            <option value="true">Lidas</option>
          </select>
          <input
            type="search"
            className="rounded-lg border border-line px-3 py-2 text-sm"
            placeholder="Pesquisar..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            data-testid="notificacoes-search"
          />
        </div>
      </section>

      <section className="space-y-3" data-testid="notificacoes-lista">
        {loading ? <p className="text-sm text-ink-soft">Carregando...</p> : null}
        {!loading && notificacoes.length === 0 ? (
          <p className="text-sm text-ink-soft">Nenhuma notificação encontrada.</p>
        ) : null}
        {notificacoes.map((item) => (
          <article
            key={item.id}
            className={`card p-4 ${item.lida ? "opacity-75" : ""}`}
            data-testid={`notificacao-${item.tipo}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-ink">{item.titulo}</p>
                <p className="mt-1 text-sm text-ink-soft">{item.mensagem}</p>
                <p className="mt-2 text-xs text-ink-soft">
                  {new Date(item.data).toLocaleString("pt-BR")} — {item.tipo.replaceAll("_", " ")} —{" "}
                  {item.origem}
                  {item.referencia_tipo ? ` → ${item.referencia_tipo}` : ""}
                </p>
              </div>
              {!item.lida ? (
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={() => void handleMarcarLida(item.id)}
                >
                  Marcar como lida
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </section>

      {preferencias ? (
        <section className="card p-5" data-testid="notificacoes-preferencias">
          <h2 className="font-medium text-ink">Preferências de comunicação</h2>
          <p className="mt-1 text-xs text-ink-soft">Contratos definidos — sem integração externa nesta versão.</p>
          <div className="mt-4 space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferencias.receber_email}
                onChange={(e) =>
                  setPreferencias({ ...preferencias, receber_email: e.target.checked })
                }
              />
              Receber por e-mail
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferencias.receber_whatsapp}
                onChange={(e) =>
                  setPreferencias({ ...preferencias, receber_whatsapp: e.target.checked })
                }
              />
              Receber por WhatsApp (contrato)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferencias.somente_plataforma}
                onChange={(e) =>
                  setPreferencias({ ...preferencias, somente_plataforma: e.target.checked })
                }
              />
              Somente na plataforma
            </label>
          </div>
          <button type="button" className="btn-primary mt-4" onClick={() => void handleSalvarPreferencias()}>
            Salvar preferências
          </button>
        </section>
      ) : null}
    </div>
  );
}
