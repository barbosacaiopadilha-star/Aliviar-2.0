"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  createIncident,
  fetchQualityIndicators,
  fetchQualityPanel,
  updateIncident,
} from "@/quality-layer/api/quality-client";
import {
  INCIDENT_CATEGORY_LABELS,
  type IncidentCategory,
  type IncidentSeverity,
  type QualityIndicatorsView,
  type QualityPanelView,
} from "@/quality-flow/contracts/operational-quality";

export function AdminQualidadeContent() {
  const [painel, setPainel] = useState<QualityPanelView | null>(null);
  const [indicadores, setIndicadores] = useState<QualityIndicatorsView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [jornadaId, setJornadaId] = useState("");
  const [categoria, setCategoria] = useState<IncidentCategory>("PLATAFORMA");
  const [severidade, setSeveridade] = useState<IncidentSeverity>("MEDIA");
  const [descricao, setDescricao] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [panel, metrics] = await Promise.all([fetchQualityPanel(), fetchQualityIndicators()]);
      setPainel(panel);
      setIndicadores(metrics);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar painel.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void reload();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [reload]);

  async function handleCriarIncidente() {
    if (!jornadaId.trim() || !descricao.trim()) return;
    await createIncident({
      jornada_id: jornadaId.trim(),
      categoria,
      severidade,
      descricao: descricao.trim(),
    });
    setDescricao("");
    await reload();
  }

  async function handleResolver(id: string) {
    await updateIncident(id, { status: "RESOLVIDO", nota: "Resolvido via painel de qualidade." });
    await reload();
  }

  return (
    <div className="space-y-8" data-testid="admin-qualidade">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">Painel de Qualidade</h1>
          <p className="text-sm text-ink-soft">Feedback, incidentes e melhoria contínua</p>
        </div>
        <Link href="/admin" className="btn-secondary">
          Voltar ao admin
        </Link>
      </div>

      {error ? <p className="text-sm text-coral">{error}</p> : null}
      {loading ? <p className="text-sm text-ink-soft">Carregando...</p> : null}

      {indicadores ? (
        <section className="card p-5" data-testid="qualidade-indicadores">
          <h2 className="font-medium text-ink">Indicadores</h2>
          <dl className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-ink-soft">Tempo médio até resolução (h)</dt>
              <dd className="text-lg font-medium">{indicadores.tempo_medio_resolucao_horas}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">Satisfação média</dt>
              <dd className="text-lg font-medium">{indicadores.satisfacao_media}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">Incidentes abertos</dt>
              <dd className="text-lg font-medium">{indicadores.feedback_pendente}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">Amostras</dt>
              <dd className="text-lg font-medium">
                {indicadores.amostras_feedback} feedback / {indicadores.amostras_incidentes} incidentes
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      <section className="card p-5" data-testid="qualidade-novo-incidente">
        <h2 className="font-medium text-ink">Registrar incidente</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            className="rounded-lg border border-line px-3 py-2 text-sm"
            placeholder="ID da jornada"
            value={jornadaId}
            onChange={(e) => setJornadaId(e.target.value)}
          />
          <select
            className="rounded-lg border border-line px-3 py-2 text-sm"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as IncidentCategory)}
          >
            {Object.entries(INCIDENT_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-line px-3 py-2 text-sm"
            value={severidade}
            onChange={(e) => setSeveridade(e.target.value as IncidentSeverity)}
          >
            <option value="BAIXA">Baixa</option>
            <option value="MEDIA">Média</option>
            <option value="ALTA">Alta</option>
            <option value="CRITICA">Crítica</option>
          </select>
        </div>
        <textarea
          className="mt-2 w-full rounded-lg border border-line px-3 py-2 text-sm"
          rows={3}
          placeholder="Descrição do incidente"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <button type="button" className="btn-primary mt-2" onClick={() => void handleCriarIncidente()}>
          Criar incidente
        </button>
      </section>

      {painel ? (
        <>
          <section className="card p-5" data-testid="qualidade-incidentes-abertos">
            <h2 className="font-medium text-ink">Incidentes abertos ({painel.incidentes_abertos.length})</h2>
            <ul className="mt-3 space-y-2">
              {painel.incidentes_abertos.map((item) => (
                <li key={item.id} className="rounded-lg border border-line/60 p-3 text-sm">
                  <p className="font-medium">{item.descricao}</p>
                  <p className="mt-1 text-ink-soft">
                    {INCIDENT_CATEGORY_LABELS[item.categoria]} — {item.severidade} — jornada{" "}
                    {item.jornada_id.slice(0, 8)}…
                  </p>
                  <button
                    type="button"
                    className="btn-secondary mt-2 text-xs"
                    onClick={() => void handleResolver(item.id)}
                  >
                    Marcar resolvido
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5" data-testid="qualidade-incidentes-resolvidos">
            <h2 className="font-medium text-ink">
              Incidentes resolvidos ({painel.incidentes_resolvidos.length})
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              {painel.incidentes_resolvidos.map((item) => (
                <li key={item.id}>
                  {item.descricao} — {item.resolvido_em ? new Date(item.resolvido_em).toLocaleString("pt-BR") : "—"}
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5" data-testid="qualidade-categorias">
            <h2 className="font-medium text-ink">Principais categorias</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {painel.principais_categorias.map((cat) => (
                <li key={cat.categoria}>
                  {INCIDENT_CATEGORY_LABELS[cat.categoria]}: {cat.total}
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5" data-testid="qualidade-feedback-paciente">
            <h2 className="font-medium text-ink">Feedback recente — Paciente</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {painel.feedback_paciente_recente.map((fb) => (
                <li key={fb.id}>
                  Jornada {fb.jornada_id.slice(0, 8)}… — satisfação {fb.satisfacao_geral}/5
                  {fb.comentarios ? ` — "${fb.comentarios}"` : ""}
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5" data-testid="qualidade-feedback-curador">
            <h2 className="font-medium text-ink">Feedback recente — Curador</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {painel.feedback_curador_recente.map((fb) => (
                <li key={fb.id}>
                  Jornada {fb.jornada_id.slice(0, 8)}…
                  {fb.sugestoes ? ` — ${fb.sugestoes}` : ""}
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
