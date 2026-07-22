"use client";

import type { AceAnaliseCuradorView } from "@/ace-flow/contracts/ace-analysis";

export function AceAnaliseCuradorSurface({ analise }: { analise: AceAnaliseCuradorView }) {
  return (
    <section className="card p-5" data-testid="ace-analise-curador">
      <h2 className="font-medium text-ink">Análise ACE Melhorado</h2>
      <p className="mt-1 text-xs text-ink-soft">
        v{analise.versao} — {analise.status} — exec {analise.execution_id.slice(0, 8)}…
      </p>
      <p className="mt-3 text-sm text-ink">{analise.resumo_para_curador}</p>

      {analise.lacunas_informacao.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-ink">Lacunas identificadas</h3>
          <ul className="mt-1 list-inside list-disc text-sm text-ink-soft">
            {analise.lacunas_informacao.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {analise.pontos_atencao_operacional.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-ink">Pontos de atenção</h3>
          <ul className="mt-1 list-inside list-disc text-sm text-ink-soft">
            {analise.pontos_atencao_operacional.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {analise.proximos_passos_sugeridos.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-ink">Próximos passos sugeridos</h3>
          <ul className="mt-1 list-inside list-disc text-sm text-ink-soft">
            {analise.proximos_passos_sugeridos.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-4 text-xs text-ink-soft">
        Atualizado em {new Date(analise.atualizado_em).toLocaleString("pt-BR")}
      </p>
    </section>
  );
}
