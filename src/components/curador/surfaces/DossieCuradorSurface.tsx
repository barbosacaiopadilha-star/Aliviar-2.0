"use client";

import { useState } from "react";

import { curadorPost, curadorPut } from "@/curator-layer/api/curador-client";
import type { CasoCuradorExperienceModel } from "@/curator-layer/resolve-curator-experience";
import type {
  DimensaoPrioridadeView,
  DossieOpcaoView,
  RotuloOpcaoDossie,
} from "@/curadoria-flow/contracts/dossie-view";

const ROTULOS: RotuloOpcaoDossie[] = ["A", "B", "C"];

const DIMENSOES_PADRAO: DimensaoPrioridadeView[] = [
  { nome: "Experiência clínica", descricao: "Trajetória e volume de casos similares" },
  { nome: "Proximidade", descricao: "Facilidade de acesso e logística" },
  { nome: "Abordagem", descricao: "Estilo de comunicação e método" },
];

function opcaoVazia(indice: number, rotulo: RotuloOpcaoDossie): DossieOpcaoView {
  return {
    id: "",
    indice,
    rotulo,
    nome: "",
    especialidade: "",
    parecer: "",
    pontos_favoraveis: "",
    pontos_atencao: "",
    perguntas_sugeridas: "",
    o_que_esperar: "",
    evidencias_resumo: "",
  };
}

function opcoesFromModel(model: CasoCuradorExperienceModel): DossieOpcaoView[] {
  const versao = model.caso.dossie_versao_atual ?? model.caso.caso_curadoria?.dossie?.versao_publicada;
  if (versao?.opcoes?.length === 3) {
    return versao.opcoes;
  }

  const candidatos = model.caso.caso_curadoria?.curadoria_tecnica?.candidatos_selecionados ?? [];
  return ROTULOS.map((rotulo, indice) => {
    const candidato = candidatos[indice];
    return {
      ...opcaoVazia(indice, rotulo),
      nome: candidato?.nome ?? "",
      especialidade: candidato?.especialidade ?? "",
    };
  });
}

export function DossieCuradorSurface({
  model,
  onAction,
}: {
  model: CasoCuradorExperienceModel;
  onAction: () => Promise<void>;
}) {
  const versaoKey =
    model.caso.dossie_versao_atual?.id ??
    model.caso.caso_curadoria?.dossie?.id ??
    model.caso.jornada_id;

  return (
    <DossieCuradorSurfaceInner
      key={versaoKey}
      model={model}
      onAction={onAction}
    />
  );
}

function DossieCuradorSurfaceInner({
  model,
  onAction,
}: {
  model: CasoCuradorExperienceModel;
  onAction: () => Promise<void>;
}) {
  const casoCuradoria = model.caso.caso_curadoria;
  const perfil = casoCuradoria?.perfil_prioridades;
  const mesa = casoCuradoria?.curadoria_tecnica;
  const dossie = casoCuradoria?.dossie;
  const versaoAtual = model.caso.dossie_versao_atual;

  const [dimensoes, setDimensoes] = useState<DimensaoPrioridadeView[]>(
    perfil?.dimensoes?.length ? perfil.dimensoes : DIMENSOES_PADRAO,
  );
  const [pesos, setPesos] = useState<Record<string, number>>(perfil?.pesos ?? {});
  const [opcoes, setOpcoes] = useState<DossieOpcaoView[]>(() => opcoesFromModel(model));
  const [loading, setLoading] = useState(false);

  const base = `/api/v1/curador/casos/${model.caso.jornada_id}`;

  function updatePeso(nome: string, valor: number) {
    setPesos((prev) => ({ ...prev, [nome]: valor }));
  }

  function updateOpcao(indice: number, field: keyof DossieOpcaoView, value: string) {
    setOpcoes((prev) => prev.map((o) => (o.indice === indice ? { ...o, [field]: value } : o)));
  }

  async function runAction(action: () => Promise<void>) {
    setLoading(true);
    try {
      await action();
      await onAction();
    } finally {
      setLoading(false);
    }
  }

  async function handleValidarPerfil() {
    await curadorPost(`${base}/perfil-prioridades/validar`, { dimensoes, pesos });
  }

  async function handleIniciarDossie() {
    await curadorPost(`${base}/dossie/iniciar`);
  }

  async function handleSalvarRascunho() {
    if (!dossie || !versaoAtual) return;
    await curadorPut(`${base}/dossie/rascunho`, {
      dossie_id: dossie.id,
      versao_id: versaoAtual.id,
      opcoes,
    });
  }

  async function handleCriarVersao() {
    if (!dossie) return;
    await curadorPost(`${base}/dossie/versao`, { dossie_id: dossie.id });
  }

  async function handleAprovar() {
    if (!versaoAtual) return;
    await curadorPost(`${base}/dossie/aprovar`, { versao_id: versaoAtual.id });
  }

  async function handlePublicar() {
    await curadorPost(`${base}/dossie/publicar`);
  }

  return (
    <div className="space-y-6" data-testid="dossie-curador-surface">
      <section className="card p-5" data-testid="perfil-prioridades-form">
        <h2 className="font-medium text-ink">Perfil de prioridades</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Valide dimensões e pesos antes de iniciar o dossiê. Sem ranking automático.
        </p>
        {perfil?.validado ? (
          <p className="mt-3 text-sm text-sage" data-testid="perfil-validado">
            Perfil validado em {new Date(perfil.validado_em ?? "").toLocaleDateString("pt-BR")}
          </p>
        ) : null}
        <div className="mt-4 space-y-4">
          {dimensoes.map((dim) => (
            <div key={dim.nome} className="rounded-lg border border-line p-4">
              <p className="font-medium text-ink">{dim.nome}</p>
              {dim.descricao ? <p className="mt-1 text-sm text-ink-soft">{dim.descricao}</p> : null}
              <label className="mt-3 block text-sm">
                <span className="text-ink-soft">Peso (0–10)</span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2"
                  value={pesos[dim.nome] ?? 5}
                  onChange={(e) => updatePeso(dim.nome, Number(e.target.value))}
                  data-testid={`peso-${dim.nome}`}
                />
              </label>
            </div>
          ))}
        </div>
        {model.pode_validar_perfil ? (
          <button
            type="button"
            className="btn-primary mt-4"
            disabled={loading}
            onClick={() => void runAction(handleValidarPerfil)}
            data-testid="validar-perfil"
          >
            Validar perfil de prioridades
          </button>
        ) : null}
      </section>

      <section className="card p-5" data-testid="mesa-status">
        <h2 className="font-medium text-ink">Mesa de curadoria técnica</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Status: {mesa?.status === "CONCLUIDA" ? "Concluída" : "Em andamento"}
        </p>
        {mesa?.candidatos_selecionados?.length ? (
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {mesa.candidatos_selecionados.map((c) => (
              <li key={c.id}>
                {c.nome} — {c.especialidade}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">Nenhum candidato selecionado na mesa.</p>
        )}
      </section>

      {dossie ? (
        <section className="card p-5" data-testid="dossie-editor">
          <h2 className="font-medium text-ink">Editor do dossiê</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Versão {dossie.versao_atual} — status {dossie.status.replaceAll("_", " ")}
          </p>
          <div className="mt-4 space-y-6">
            {opcoes.map((opcao) => (
              <article key={opcao.rotulo} className="rounded-lg border border-line p-4">
                <h3 className="font-medium text-ink">Opção {opcao.rotulo}</h3>
                {(
                  [
                    ["nome", "Nome"],
                    ["especialidade", "Especialidade"],
                    ["parecer", "Parecer"],
                    ["pontos_favoraveis", "Pontos favoráveis"],
                    ["pontos_atencao", "Pontos de atenção"],
                    ["perguntas_sugeridas", "Perguntas sugeridas"],
                  ] as const
                ).map(([field, label]) => (
                  <label key={field} className="mt-3 block text-sm">
                    <span className="text-ink-soft">{label}</span>
                    <textarea
                      className="mt-1 w-full rounded-lg border border-line px-3 py-2"
                      value={opcao[field]}
                      onChange={(e) => updateOpcao(opcao.indice, field, e.target.value)}
                      rows={field === "nome" || field === "especialidade" ? 1 : 2}
                      data-testid={`opcao-${opcao.rotulo}-${field}`}
                    />
                  </label>
                ))}
              </article>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {model.pode_salvar_rascunho_dossie ? (
              <button
                type="button"
                className="btn-secondary"
                disabled={loading}
                onClick={() => void runAction(handleSalvarRascunho)}
                data-testid="salvar-rascunho-dossie"
              >
                Salvar rascunho
              </button>
            ) : null}
            {model.pode_criar_versao_dossie ? (
              <button
                type="button"
                className="btn-secondary"
                disabled={loading}
                onClick={() => void runAction(handleCriarVersao)}
                data-testid="criar-versao-dossie"
              >
                Criar versão
              </button>
            ) : null}
            {model.pode_aprovar_dossie ? (
              <button
                type="button"
                className="btn-secondary"
                disabled={loading}
                onClick={() => void runAction(handleAprovar)}
                data-testid="aprovar-dossie"
              >
                Aprovar
              </button>
            ) : null}
            {model.pode_publicar_dossie ? (
              <button
                type="button"
                className="btn-primary"
                disabled={loading}
                onClick={() => void runAction(handlePublicar)}
                data-testid="publicar-dossie"
              >
                Publicar
              </button>
            ) : null}
          </div>
        </section>
      ) : model.pode_iniciar_dossie ? (
        <button
          type="button"
          className="btn-primary"
          disabled={loading}
          onClick={() => void runAction(handleIniciarDossie)}
          data-testid="iniciar-dossie"
        >
          Iniciar dossiê
        </button>
      ) : null}
    </div>
  );
}
