"use client";

import { useCallback, useEffect, useState } from "react";

import {
  adicionarFavorito,
  criarNota,
  criarTemplate,
  listarFavoritos,
  listarNotas,
  listarTemplates,
  obterChecklist,
  obterHistoricoConsolidado,
  obterProdutividade,
  removerFavorito,
  salvarChecklist,
} from "@/curator-layer/api/curador-tools-client";
import { registrarFeedbackCurador } from "@/quality-layer/api/quality-client";
import type {
  CuratorChecklistItemView,
  CuratorChecklistView,
  CuratorFavoriteView,
  CuratorHistoricoConsolidadoView,
  CuratorPrivateNoteView,
  CuratorProdutividadeView,
  CuratorTemplateCategory,
  CuratorTemplateView,
} from "@/curator-tools-flow/contracts/curator-tools";

export function CuradorCaseTools({
  jornadaId,
  jornadaTitulo,
}: {
  jornadaId: string;
  jornadaTitulo: string;
}) {
  const [favoritos, setFavoritos] = useState<CuratorFavoriteView[]>([]);
  const [notas, setNotas] = useState<CuratorPrivateNoteView[]>([]);
  const [checklist, setChecklist] = useState<CuratorChecklistView | null>(null);
  const [templates, setTemplates] = useState<CuratorTemplateView[]>([]);
  const [historico, setHistorico] = useState<CuratorHistoricoConsolidadoView | null>(null);
  const [produtividade, setProdutividade] = useState<CuratorProdutividadeView | null>(null);

  const [notaConteudo, setNotaConteudo] = useState("");
  const [templateCategoria, setTemplateCategoria] = useState<CuratorTemplateCategory>("MENSAGEM");
  const [templateTitulo, setTemplateTitulo] = useState("");
  const [templateConteudo, setTemplateConteudo] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedbackSugestoes, setFeedbackSugestoes] = useState("");
  const [feedbackEnviado, setFeedbackEnviado] = useState(false);

  const jornadaFavoritada = favoritos.some(
    (f) => f.entity_type === "JORNADA" && f.entity_id === jornadaId,
  );

  const reload = useCallback(async () => {
    const [fav, noteList, chk, tpl, hist, prod] = await Promise.all([
      listarFavoritos(),
      listarNotas(jornadaId),
      obterChecklist(jornadaId),
      listarTemplates(),
      obterHistoricoConsolidado(jornadaId),
      obterProdutividade(),
    ]);
    setFavoritos(fav);
    setNotas(noteList);
    setChecklist(chk);
    setTemplates(tpl);
    setHistorico(hist);
    setProdutividade(prod);
  }, [jornadaId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void reload().catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [reload]);

  async function toggleFavoritoJornada() {
    setLoading(true);
    try {
      if (jornadaFavoritada) {
        await removerFavorito("JORNADA", jornadaId);
      } else {
        await adicionarFavorito({
          entity_type: "JORNADA",
          entity_id: jornadaId,
          label: jornadaTitulo,
        });
      }
      await reload();
    } finally {
      setLoading(false);
    }
  }

  async function handleCriarNota() {
    if (!notaConteudo.trim()) return;
    setLoading(true);
    try {
      await criarNota({ jornada_id: jornadaId, conteudo: notaConteudo.trim() });
      setNotaConteudo("");
      await reload();
    } finally {
      setLoading(false);
    }
  }

  async function handleSalvarChecklist(items: CuratorChecklistItemView[]) {
    setLoading(true);
    try {
      const saved = await salvarChecklist(jornadaId, items);
      setChecklist(saved);
    } finally {
      setLoading(false);
    }
  }

  async function handleCriarTemplate() {
    if (!templateTitulo.trim() || !templateConteudo.trim()) return;
    setLoading(true);
    try {
      await criarTemplate({
        categoria: templateCategoria,
        titulo: templateTitulo.trim(),
        conteudo: templateConteudo.trim(),
      });
      setTemplateTitulo("");
      setTemplateConteudo("");
      await reload();
    } finally {
      setLoading(false);
    }
  }

  function toggleChecklistItem(itemId: string) {
    if (!checklist) return;
    const items = checklist.items.map((item) =>
      item.id === itemId ? { ...item, concluido: !item.concluido } : item,
    );
    void handleSalvarChecklist(items);
  }

  return (
    <div className="space-y-6" data-testid="curador-case-tools">
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-medium text-ink">Favoritos</h2>
          <button
            type="button"
            className="btn-secondary"
            disabled={loading}
            onClick={() => void toggleFavoritoJornada()}
            data-testid="toggle-favorito-jornada"
          >
            {jornadaFavoritada ? "Remover dos favoritos" : "Favoritar jornada"}
          </button>
        </div>
        {favoritos.length > 0 ? (
          <ul className="mt-3 space-y-1 text-sm text-ink-soft">
            {favoritos.map((fav) => (
              <li key={`${fav.entity_type}:${fav.entity_id}`}>
                {fav.label} — {fav.entity_type}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">Nenhum favorito registrado.</p>
        )}
      </section>

      <section className="card p-5" data-testid="curador-checklist">
        <h2 className="font-medium text-ink">Checklist da curadoria</h2>
        <p className="mt-1 text-xs text-ink-soft">Organização pessoal — não bloqueia o fluxo.</p>
        {checklist ? (
          <ul className="mt-3 space-y-2">
            {checklist.items.map((item) => (
              <li key={item.id}>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={item.concluido}
                    onChange={() => toggleChecklistItem(item.id)}
                    disabled={loading}
                  />
                  {item.label}
                </label>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="card p-5" data-testid="curador-notas">
        <h2 className="font-medium text-ink">Anotações privadas</h2>
        <p className="mt-1 text-xs text-ink-soft">Visíveis apenas para a equipe — auditáveis.</p>
        <textarea
          className="mt-3 w-full rounded-lg border border-line px-3 py-2 text-sm"
          rows={3}
          value={notaConteudo}
          onChange={(e) => setNotaConteudo(e.target.value)}
          placeholder="Registrar nota interna..."
          data-testid="nota-input"
        />
        <button
          type="button"
          className="btn-primary mt-2"
          disabled={loading || !notaConteudo.trim()}
          onClick={() => void handleCriarNota()}
        >
          Salvar nota
        </button>
        {notas.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {notas.map((nota) => (
              <li key={nota.id} className="rounded-lg border border-line/60 p-3 text-sm">
                <p className="font-medium text-ink">{nota.titulo}</p>
                <p className="mt-1 text-ink-soft">{nota.conteudo}</p>
                <p className="mt-2 text-xs text-ink-soft">
                  {new Date(nota.updated_at).toLocaleString("pt-BR")}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="card p-5" data-testid="curador-templates">
        <h2 className="font-medium text-ink">Templates</h2>
        <p className="mt-1 text-xs text-ink-soft">Modelos reutilizáveis — sempre editáveis antes do uso.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <select
            className="rounded-lg border border-line px-3 py-2 text-sm"
            value={templateCategoria}
            onChange={(e) => setTemplateCategoria(e.target.value as CuratorTemplateCategory)}
          >
            <option value="MENSAGEM">Mensagem</option>
            <option value="JUSTIFICATIVA">Justificativa</option>
            <option value="OBSERVACAO">Observação</option>
          </select>
          <input
            className="rounded-lg border border-line px-3 py-2 text-sm sm:col-span-2"
            placeholder="Título do template"
            value={templateTitulo}
            onChange={(e) => setTemplateTitulo(e.target.value)}
          />
        </div>
        <textarea
          className="mt-2 w-full rounded-lg border border-line px-3 py-2 text-sm"
          rows={3}
          value={templateConteudo}
          onChange={(e) => setTemplateConteudo(e.target.value)}
          placeholder="Conteúdo do template..."
        />
        <button
          type="button"
          className="btn-secondary mt-2"
          disabled={loading || !templateTitulo.trim() || !templateConteudo.trim()}
          onClick={() => void handleCriarTemplate()}
        >
          Criar template
        </button>
        {templates.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {templates.map((tpl) => (
              <li key={tpl.id} className="rounded-lg border border-line/60 p-3 text-sm">
                <p className="font-medium text-ink">
                  {tpl.titulo} — {tpl.categoria}
                </p>
                <p className="mt-1 text-ink-soft">{tpl.conteudo}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="card p-5" data-testid="curador-historico-consolidado">
        <h2 className="font-medium text-ink">Histórico operacional consolidado</h2>
        {historico && historico.itens.length > 0 ? (
          <ol className="mt-3 space-y-2">
            {historico.itens.map((item) => (
              <li key={item.id} className="rounded-lg border border-line/60 p-3 text-sm">
                <p className="font-medium text-ink">
                  {item.titulo} — {item.tipo}
                </p>
                <p className="mt-1 text-ink-soft">{item.descricao}</p>
                <p className="mt-2 text-xs text-ink-soft">
                  {new Date(item.ocorrido_em).toLocaleString("pt-BR")}
                  {item.responsavel ? ` — ${item.responsavel}` : ""}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">Sem eventos registrados.</p>
        )}
      </section>

      <section className="card p-5" data-testid="curador-produtividade">
        <h2 className="font-medium text-ink">Produtividade operacional</h2>
        <p className="mt-1 text-xs text-ink-soft">Métricas agregadas — sem ranking de pessoas.</p>
        {produtividade ? (
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-ink-soft">Tempo médio por caso (h)</dt>
              <dd className="text-lg font-medium text-ink">{produtividade.tempo_medio_caso_horas}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">Casos em andamento</dt>
              <dd className="text-lg font-medium text-ink">{produtividade.casos_em_andamento}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">Tempo médio em revisão (h)</dt>
              <dd className="text-lg font-medium text-ink">{produtividade.tempo_medio_revisao_horas}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">Tempo médio até entrega (h)</dt>
              <dd className="text-lg font-medium text-ink">
                {produtividade.tempo_medio_ate_entrega_horas}
              </dd>
            </div>
          </dl>
        ) : null}
      </section>

      <section className="card p-5" data-testid="curador-feedback">
        <h2 className="font-medium text-ink">Feedback operacional</h2>
        <p className="mt-1 text-xs text-ink-soft">Opcional — dificuldades, informações ausentes ou sugestões.</p>
        {feedbackEnviado ? (
          <p className="mt-2 text-sm text-ink-soft">Feedback registrado. Obrigado.</p>
        ) : (
          <>
            <textarea
              className="mt-3 w-full rounded-lg border border-line px-3 py-2 text-sm"
              rows={3}
              placeholder="Sugestões ou problemas operacionais..."
              value={feedbackSugestoes}
              onChange={(e) => setFeedbackSugestoes(e.target.value)}
            />
            <button
              type="button"
              className="btn-secondary mt-2"
              disabled={loading || !feedbackSugestoes.trim()}
              onClick={() => {
                setLoading(true);
                void registrarFeedbackCurador({
                  jornada_id: jornadaId,
                  sugestoes: feedbackSugestoes.trim(),
                })
                  .then(() => setFeedbackEnviado(true))
                  .finally(() => setLoading(false));
              }}
            >
              Enviar feedback
            </button>
          </>
        )}
      </section>
    </div>
  );
}
