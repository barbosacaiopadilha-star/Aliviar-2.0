"use client";

/**
 * A MESA — os quatro painéis, num ambiente só.
 *
 * @metodo Guided Experience §2 — onde estou, o que já foi feito, o que falta, de quem é a vez
 * @metodo Fundamentos §13 — P14: a interface organiza; a decisão é do Curador
 * @metodo Ontologia §3.13 — ordem de leitura, jamais colocação
 * @metodo Experience §3 — o copiloto sinaliza a lacuna e nunca bloqueia sem explicar
 *
 * Por que existe: a Mesa empilhava orçamento, elegibilidade, comparação e
 * seleção na mesma rolagem — dez painéis competindo pela atenção de quem
 * precisa tomar uma decisão de cada vez. Aqui o contexto (A e D) nunca sai da
 * tela, a navegação (B) troca só a área de trabalho (C), e a Mesa diz o tempo
 * todo qual é a próxima decisão.
 *
 * O que nunca faz: trocar de página entre etapas, esconder o contexto ao
 * abrir um painel, ou impedir o Curador de entrar numa etapa. Ele conduz a
 * investigação; a Mesa só evita que ele procure.
 */

import "@/app/mesa-curador.css";

import { useState, type ReactNode } from "react";

import { MesaHeader } from "@/components/curadoria/mesa/mesa-header";
import { MesaSteps } from "@/components/curadoria/mesa/mesa-steps";
import {
  MESA_ETAPA_QUESTIONS,
  MESA_ETAPA_LABELS,
  type MesaEtapaId,
  type MesaEtapaState,
  type ProximaDecisao,
} from "@/modules/curadoria/mesa-etapas";

export type MesaShellProps = {
  patientName: string;
  areaRequirement: string | null;
  curatorName: string;
  progress: { done: number; total: number };
  decisao: ProximaDecisao;
  alerts: string[];
  etapas: MesaEtapaState[];
  /** O conteúdo de cada etapa. A Mesa monta o ambiente; o conteúdo é de fora. */
  conteudo: Record<MesaEtapaId, ReactNode>;
  /** Painel D — contexto persistente. */
  contexto: ReactNode;
  /** Linha do tempo do Case, sempre visível. */
  timeline: ReactNode;
};

export function MesaShell({
  patientName,
  areaRequirement,
  curatorName,
  progress,
  decisao,
  alerts,
  etapas,
  conteudo,
  contexto,
  timeline,
}: MesaShellProps) {
  // A Mesa abre onde está a próxima decisão — mas a partir daí quem escolhe é
  // o Curador, e a escolha dele não é sobrescrita quando o estado muda.
  const [etapaAtual, setEtapaAtual] = useState<MesaEtapaId>(decisao.etapa);

  return (
    <div className="mesa">
      <MesaHeader
        patientName={patientName}
        areaRequirement={areaRequirement}
        curatorName={curatorName}
        progress={progress}
        decisao={decisao}
        alerts={alerts}
      />

      <MesaSteps
        etapas={etapas}
        atual={etapaAtual}
        proxima={decisao.etapa}
        onSelecionar={setEtapaAtual}
      />

      <div className="mesa-layout">
        <main className="mesa-work" aria-live="polite">
          <p className="mesa-work__title">{MESA_ETAPA_LABELS[etapaAtual]}</p>
          <h2 className="mesa-work__question">{MESA_ETAPA_QUESTIONS[etapaAtual]}</h2>

          <div className="mt-6">{conteudo[etapaAtual]}</div>
        </main>

        <aside className="mesa-aside" aria-label="Contexto do Case">
          <section className="mesa-aside__section">
            <h2 className="mesa-aside__title">Linha do tempo</h2>
            <div className="mt-3">{timeline}</div>
          </section>
          {contexto}
        </aside>
      </div>
    </div>
  );
}
