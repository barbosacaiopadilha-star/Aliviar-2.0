"use client";

import { CuradorGlobalSearch } from "@/components/curador/tools/CuradorGlobalSearch";
import { useCurator } from "@/components/curador/CuratorProvider";
import { FilaCuradorSurface } from "@/components/curador/surfaces/FilaCuradorSurface";
import { obterProdutividade } from "@/curator-layer/api/curador-tools-client";
import { useEffect, useState } from "react";
import type { CuratorProdutividadeView } from "@/curator-tools-flow/contracts/curator-tools";

export function FilaCuradorContent() {
  const { loadState } = useCurator();
  const [produtividade, setProdutividade] = useState<CuratorProdutividadeView | null>(null);

  useEffect(() => {
    void obterProdutividade()
      .then(setProdutividade)
      .catch(() => setProdutividade(null));
  }, []);

  if (loadState.status === "loading") {
    return <p className="text-ink-soft">Carregando fila...</p>;
  }

  if (loadState.status === "error") {
    return <p className="text-coral">{loadState.message}</p>;
  }

  if (!loadState.snapshot.fila) {
    return null;
  }

  return (
    <div className="space-y-6">
      <CuradorGlobalSearch />
      {produtividade ? (
        <section className="card p-4 text-sm" data-testid="fila-produtividade">
          <p className="font-medium text-ink">Visão operacional</p>
          <p className="mt-1 text-ink-soft">
            {produtividade.casos_em_andamento} casos em andamento — tempo médio{" "}
            {produtividade.tempo_medio_caso_horas}h por caso
          </p>
        </section>
      ) : null}
      <FilaCuradorSurface model={loadState.snapshot.fila} />
    </div>
  );
}
