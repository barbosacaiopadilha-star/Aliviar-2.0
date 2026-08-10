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
 * Sobre a área de trabalho corre a linha de investigação — hipótese,
 * evidências, conferência, conclusão. Ela não é o workflow: é onde o
 * raciocínio está, e por isso não tem botão.
 *
 * O que nunca faz: trocar de página entre etapas, esconder o contexto ao
 * abrir um painel, impedir o Curador de entrar numa etapa, ou executar ato
 * irreversível por tecla.
 */

import "@/app/mesa-curador.css";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { MesaFocoProvider, useMesaFoco } from "@/components/curadoria/mesa/mesa-foco";
import { MesaHeader } from "@/components/curadoria/mesa/mesa-header";
import { MesaNavegacaoProvider } from "@/components/curadoria/mesa/mesa-navegacao";
import { MesaSteps } from "@/components/curadoria/mesa/mesa-steps";
import { LinhaInvestigacao } from "@/components/curadoria/mesa/linha-investigacao";
import {
  AjudaRapida,
  AtalhosDica,
  useAtalhosDaMesa,
} from "@/components/curadoria/mesa/mesa-atalhos";
import { ATALHO_DESTINO, type MesaAcao } from "@/modules/curadoria/mesa-atalhos";
import type { LinhaEtapaState } from "@/modules/curadoria/mesa-investigacao";
import {
  MESA_ETAPAS,
  MESA_ETAPA_QUESTIONS,
  type MesaEtapaId,
  type MesaEtapaState,
  type ProximaDecisao,
} from "@/modules/curadoria/mesa-etapas";

export const FILTROS_ID = "mesa-filtros-rapidos";

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
  /** Onde o raciocínio está — faixa acima da área de trabalho. */
  linha?: LinhaEtapaState[];
  /** Quantos profissionais o teclado percorre com J/K. */
  totalProfissionais?: number;
};

export function MesaShell(props: MesaShellProps) {
  return (
    <MesaFocoProvider total={props.totalProfissionais ?? 0}>
      <MesaAmbiente {...props} />
    </MesaFocoProvider>
  );
}

function MesaAmbiente({
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
  linha,
}: MesaShellProps) {
  // A Mesa abre onde está a próxima decisão — mas a partir daí quem escolhe é
  // o Curador, e a escolha dele não é sobrescrita quando o estado muda.
  const [etapaAtual, setEtapaAtual] = useState<MesaEtapaId>(decisao.etapa);
  const [ajuda, setAjuda] = useState(false);
  const foco = useMesaFoco();

  // A altura real do topo fixo vira variável CSS. O contexto lateral precisa
  // dela para saber onde começar e onde parar — e ela muda com alertas, com a
  // quebra do cabeçalho e com a largura da tela. Medir é mais honesto do que
  // um número mágico que fica errado no primeiro alerta.
  const topo = useRef<HTMLDivElement>(null);
  const mesa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const alvo = topo.current;
    const raiz = mesa.current;
    if (!alvo || !raiz || typeof ResizeObserver === "undefined") return;

    const medir = () => raiz.style.setProperty("--mesa-topo", `${alvo.offsetHeight}px`);
    medir();

    const observador = new ResizeObserver(medir);
    observador.observe(alvo);
    return () => observador.disconnect();
  }, []);

  const executar = useCallback(
    (acao: MesaAcao) => {
      const destino = ATALHO_DESTINO[acao];
      if (destino) {
        setEtapaAtual(destino);
        return;
      }

      switch (acao) {
        case "ETAPA_PROXIMA":
        case "ETAPA_ANTERIOR": {
          const passo = acao === "ETAPA_PROXIMA" ? 1 : -1;
          setEtapaAtual((atual) => {
            const indice = MESA_ETAPAS.indexOf(atual) + passo;
            // Para nas pontas: circular aqui faria o Curador sair do Relatório
            // e cair no Perfil sem perceber.
            return MESA_ETAPAS[Math.min(Math.max(indice, 0), MESA_ETAPAS.length - 1)]!;
          });
          return;
        }
        case "PROFISSIONAL_PROXIMO":
          foco.mover(1);
          return;
        case "PROFISSIONAL_ANTERIOR":
          foco.mover(-1);
          return;
        case "ABRIR_DETALHES":
          foco.alternarDetalhes();
          return;
        case "FILTROS":
          document.getElementById(FILTROS_ID)?.querySelector("button")?.focus();
          return;
        case "AJUDA":
          setAjuda((atual) => !atual);
          return;
        case "FECHAR":
          setAjuda(false);
          foco.fechar();
          return;
        default:
          return;
      }
    },
    [foco],
  );

  useAtalhosDaMesa(executar);

  return (
    <MesaNavegacaoProvider value={setEtapaAtual}>
      <div className="mesa" ref={mesa}>
        <div className="mesa-topo" ref={topo}>
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
        </div>

        <div className="mesa-layout">
          <main className="mesa-work" aria-live="polite">
            {linha && linha.length > 0 ? <LinhaInvestigacao etapas={linha} /> : null}

            {/* A-1 · o rótulo da etapa saiu daqui. Ele era a terceira
                ocorrência simultânea da mesma constante — a trilha já diz onde
                estou (`mesa-step--ativa` + `aria-current="step"`) e a faixa de
                pendência a nomeia quando a etapa deve algo. Aqui ele não
                acrescentava nada, e a pergunta é que é a tarefa. */}
            <h2 className="mesa-work__question">{MESA_ETAPA_QUESTIONS[etapaAtual]}</h2>

            <div className="mt-6">{conteudo[etapaAtual]}</div>
          </main>

          {/* Ordem do contexto: primeiro o que ainda depende dele, depois o
              que ele já declarou, e só então a orientação temporal. A linha do
              tempo abria o painel e empurrava as pendências para fora da
              altura útil — orientação é consultada uma vez, pendência é
              consultada a cada decisão. */}
          <aside className="mesa-aside" aria-label="Contexto do Case">
            {contexto}

            <section className="mesa-aside__section">
              <h2 className="mesa-aside__title">Linha do tempo</h2>
              <div className="mt-3">{timeline}</div>
            </section>

            <div className="mesa-aside__section">
              <AtalhosDica onAbrir={() => setAjuda(true)} />
              <AjudaRapida aberta={ajuda} onFechar={() => setAjuda(false)} />
            </div>
          </aside>
        </div>
      </div>
    </MesaNavegacaoProvider>
  );
}
