"use client";

/**
 * QUANTO ISTO IMPORTA PARA ELA — na linha, ao lado do que ela disse.
 *
 * @metodo ADR-039 — o Case declara quanto cada subcritério importa
 * @metodo ADR-093 — a Mesa se organiza pelas preocupações dela
 *
 * Na Mesa antiga esta classificação era um painel de 29 rádios, longe de tudo.
 * O Curador escolhia "muito importante" para `MODELO_COMUNICACAO` olhando um
 * código — e a frase que justificava aquilo estava em outra tela, no Protocolo.
 *
 * Aqui os dois ficam a um palmo. A linha mostra o que ela respondeu e o peso
 * que ELA deu; a classificação do Curador acontece embaixo. Quando os dois
 * discordam — ela disse "essencial", ele classificou "relevante" — isso fica
 * visível na mesma linha, e vira conversa em vez de divergência silenciosa.
 *
 * Salva em lote, com contagem, como o painel antigo fazia. É o modelo certo, e
 * o `SIM-37` registra por quê: o Mapa do Profissional grava a cada clique e
 * perde o que está em voo quando alguém navega — com a tela dizendo "29 de 29
 * tratados" e nenhum erro.
 */

import { useState, useTransition } from "react";

import {
  IMPORTANCE_LABELS,
  IMPORTANCE_LEVELS,
  type ImportanceLevel,
} from "@/modules/curadoria/mapa-prioridades";
import { MESA_ETAPA_QUESTIONS } from "@/modules/curadoria/mesa-etapas";

import { MomentoDaMesa } from "./momento-da-mesa";
import { savePriorityImportancesAction } from "@/modules/curadoria/mapa-prioridades-actions";

export type ItemParaClassificar = {
  subcriterionCode: string;
  /** Como a linha se chama para quem lê — a frase dela, ou a pergunta. */
  titulo: string;
  atual: ImportanceLevel | null;
};

type Props = {
  caseId: string;
  itens: readonly ItemParaClassificar[];
};

export function ClassificarImportancia({ caseId, itens }: Props) {
  const [escolhas, setEscolhas] = useState<Record<string, ImportanceLevel>>(() =>
    Object.fromEntries(
      itens.filter((i) => i.atual !== null).map((i) => [i.subcriterionCode, i.atual!]),
    ),
  );
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [salvando, iniciar] = useTransition();

  const originais = Object.fromEntries(
    itens.filter((i) => i.atual !== null).map((i) => [i.subcriterionCode, i.atual!]),
  );
  const mudados = Object.entries(escolhas).filter(
    ([code, nivel]) => originais[code] !== nivel,
  );

  function escolher(code: string, nivel: ImportanceLevel) {
    setSalvo(false);
    setEscolhas((atual) => ({ ...atual, [code]: nivel }));
  }

  function salvar() {
    setErro(null);
    iniciar(async () => {
      const resultado = await savePriorityImportancesAction({
        caseId,
        entries: Object.entries(escolhas).map(([subcriterionCode, importance]) => ({
          subcriterionCode,
          importance,
        })),
      });
      if (resultado.success) {
        setSalvo(true);
        return;
      }
      setErro(resultado.error ?? "Não foi possível salvar.");
    });
  }

  const faltam = itens.filter((i) => !escolhas[i.subcriterionCode]).length;

  return (
    <section className="flex flex-col gap-4 rounded-md border border-border p-4">
      <MomentoDaMesa
        pergunta={MESA_ETAPA_QUESTIONS.PERFIL}
        titulo="Quanto cada coisa importa para ela"
      >
        <p className="max-w-3xl text-sm text-ink-muted">
          O Motor não cruza nada sem isto. Classificar não é opinar sobre ela: é registrar o
          que você entendeu da conversa, e ela reconhece depois, no portal dela.
        </p>
      </MomentoDaMesa>

      <div className="flex flex-col divide-y divide-border">
        {itens.map((item) => (
          <div key={item.subcriterionCode} className="flex flex-col gap-2 py-3">
            <span className="text-sm text-ink">{item.titulo}</span>
            <div className="flex flex-wrap gap-1.5">
              {IMPORTANCE_LEVELS.map((nivel) => {
                const escolhido = escolhas[item.subcriterionCode] === nivel;
                return (
                  <button
                    key={nivel}
                    type="button"
                    aria-pressed={escolhido}
                    onClick={() => escolher(item.subcriterionCode, nivel)}
                    className={
                      escolhido
                        ? "rounded-md border border-ink px-2.5 py-1 text-xs font-medium text-ink"
                        : "rounded-md border border-border px-2.5 py-1 text-xs text-ink-muted transition-colors hover:text-ink"
                    }
                  >
                    {IMPORTANCE_LABELS[nivel]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {erro ? <p className="text-sm text-ink">{erro}</p> : null}
      {salvo ? <p className="text-sm text-ink-muted">Mapa salvo.</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={salvar}
          disabled={salvando || mudados.length === 0}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink disabled:opacity-50"
        >
          {salvando
            ? "Salvando…"
            : mudados.length === 0
              ? "Nada mudou"
              : `Salvar ${mudados.length} ${mudados.length === 1 ? "alteração" : "alterações"}`}
        </button>
        {/* "Ainda não avaliado" é diferente de "não influencia": o primeiro é
            item que ninguém tratou, o segundo é decisão registrada. A tela do
            Mapa do Profissional já faz essa distinção, e ela vale aqui. */}
        <span className="text-xs text-ink-muted">
          {faltam === 0
            ? "Todos tratados."
            : `${faltam} ainda não avaliado${faltam === 1 ? "" : "s"} — deixar sem registro é legítimo, e aparece como lacuna.`}
        </span>
      </div>
    </section>
  );
}
