"use client";

import { useState } from "react";

import { curadorPut, type OpcaoRegistradaView } from "@/curator-layer/api/curador-client";
import type { CasoCuradorExperienceModel } from "@/curator-layer/resolve-curator-experience";

const OPCAO_VAZIA = (indice: number): OpcaoRegistradaView => ({
  indice,
  nome: "",
  especialidade: "",
  por_que_esta_aqui: "",
  por_que_pode_fazer_sentido: "",
  o_que_esperar: "",
  limitacoes: "",
  evidencias_resumo: "",
});

export function OpcoesCuradorSurface({
  model,
  onSaved,
}: {
  model: CasoCuradorExperienceModel;
  onSaved: () => Promise<void>;
}) {
  const [opcoes, setOpcoes] = useState<OpcaoRegistradaView[]>([
    OPCAO_VAZIA(0),
    OPCAO_VAZIA(1),
    OPCAO_VAZIA(2),
  ]);
  const [loading, setLoading] = useState(false);

  function update(indice: number, field: keyof OpcaoRegistradaView, value: string) {
    setOpcoes((prev) =>
      prev.map((o) => (o.indice === indice ? { ...o, [field]: value } : o)),
    );
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      await curadorPut(`/api/v1/curador/casos/${model.caso.jornada_id}/opcoes`, { opcoes });
      await onSaved();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6" data-testid="opcoes-curador-surface">
      <p className="text-sm text-ink-soft">
        Registre exatamente três opções. Sem ranking, sem score — apenas narrativa.
      </p>
      {opcoes.map((opcao) => (
        <section key={opcao.indice} className="card space-y-3 p-5">
          <h2 className="font-medium text-ink">Opção {opcao.indice + 1}</h2>
          {(
            [
              ["nome", "Nome"],
              ["especialidade", "Especialidade"],
              ["por_que_esta_aqui", "Por que está aqui"],
              ["por_que_pode_fazer_sentido", "Forças / por que pode fazer sentido"],
              ["o_que_esperar", "O que esperar"],
              ["limitacoes", "Limitações"],
              ["evidencias_resumo", "Evidências"],
            ] as const
          ).map(([field, label]) => (
            <label key={field} className="block text-sm">
              <span className="text-ink-soft">{label}</span>
              <textarea
                className="mt-1 w-full rounded-lg border border-line px-3 py-2"
                value={opcao[field]}
                onChange={(e) => update(opcao.indice, field, e.target.value)}
                rows={field === "nome" || field === "especialidade" ? 1 : 2}
              />
            </label>
          ))}
        </section>
      ))}
      <button
        type="button"
        className="btn-primary"
        disabled={loading}
        onClick={() => void handleSubmit()}
        data-testid="registrar-opcoes"
      >
        {loading ? "Salvando..." : "Registrar três opções"}
      </button>
    </div>
  );
}
