"use client";

/**
 * PAINEL B — Navegação da Curadoria, no mesmo ambiente.
 *
 * @metodo Guided Experience §1 — a plataforma se organiza pela jornada mental de quem a usa
 * @metodo Ontologia §3.13 — ordem de leitura, jamais colocação
 * @metodo Engine §2 — o Motor nunca avança um estado sozinho
 *
 * Por que existe: a Mesa empilhava tudo — orçamento, elegibilidade,
 * comparação e seleção na mesma rolagem, dez painéis competindo. Agora cada
 * etapa da investigação abre na área de trabalho, sem trocar de tela e sem
 * perder o contexto.
 *
 * O que nunca faz: bloquear uma etapa. O Curador conduz a investigação e
 * entra onde quiser; etapas que dependem de outra dizem do que dependem.
 */

import { cn } from "@/components/ui/cn";
import type { MesaEtapaId, MesaEtapaState } from "@/modules/curadoria/mesa-etapas";

import { MARCA_DA_ETAPA, classeDoPapel } from "./gramatica-de-estados";

const ESTADO_LABEL: Record<MesaEtapaState["status"], string> = {
  PRONTA: "respondida",
  PENDENTE: "aguarda você",
  AGUARDA: "depende de outra etapa",
};

/**
 * A frase curta que a etapa já carrega — `pending` (o que falta) ou
 * `waitingOn` (de que depende). Nenhum cálculo, nenhuma contagem nova: é o
 * mesmo campo que o leitor de tela já recebia, e nada mais.
 */
function frase(etapa: MesaEtapaState): string | null {
  return etapa.pending ?? etapa.waitingOn ?? null;
}

export function MesaSteps({
  etapas,
  atual,
  proxima,
  onSelecionar,
}: {
  etapas: MesaEtapaState[];
  atual: MesaEtapaId;
  /** A etapa onde está a próxima decisão — recebe a marca de destino. */
  proxima: MesaEtapaId;
  onSelecionar: (etapa: MesaEtapaId) => void;
}) {
  // A-2 · o que a etapa deve deixa de ser exclusivo do leitor de tela. Duas
  // linhas no máximo — a etapa ATIVA (onde estou) e a PRÓXIMA DECISÃO (para
  // onde vou) —, porque revelar as seis recriaria o muro de texto que a
  // trilha existe para evitar. As demais seguem no `sr-only` de sempre.
  const emFoco = [
    etapas.find((etapa) => etapa.id === atual),
    proxima === atual ? undefined : etapas.find((etapa) => etapa.id === proxima),
  ].filter((etapa): etapa is MesaEtapaState => Boolean(etapa && frase(etapa)));

  return (
    <nav aria-label="Etapas da Curadoria Técnica" className="mesa-steps">
      <ol className="mesa-steps__list">
        {etapas.map((etapa) => {
          const ativa = etapa.id === atual;
          return (
            <li key={etapa.id}>
              <button
                type="button"
                onClick={() => onSelecionar(etapa.id)}
                aria-current={ativa ? "step" : undefined}
                className={cn("mesa-step", ativa && "mesa-step--ativa")}
              >
                <span
                  aria-hidden="true"
                  className={cn("mesa-step__marca", classeDoPapel(MARCA_DA_ETAPA[etapa.status].papel))}
                >
                  {MARCA_DA_ETAPA[etapa.status].sinal}
                </span>
                <span className="mesa-step__label">{etapa.label}</span>
                {etapa.id === proxima && !ativa ? (
                  <span aria-hidden="true" className="mesa-step__destino" />
                ) : null}
                <span className="sr-only">
                  , {ESTADO_LABEL[etapa.status]}
                  {etapa.pending ? `: ${etapa.pending}` : ""}
                  {etapa.waitingOn ? `: ${etapa.waitingOn}` : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* `aria-hidden` de propósito: o leitor de tela JÁ recebe estas frases
          dentro de cada botão, no `sr-only` acima. Repeti-las aqui seria
          anúncio duplicado; omiti-las do visual era a sonegação que o A-2
          nomeou. Cada lado recebe a mesma informação, uma vez. */}
      {emFoco.length > 0 ? (
        <ul aria-hidden="true" className="mesa-steps__pendencias">
          {emFoco.map((etapa) => (
            <li key={etapa.id} className="mesa-steps__pendencia">
              <span
                className={cn(
                  "mesa-steps__pendencia-marca",
                  classeDoPapel(MARCA_DA_ETAPA[etapa.status].papel),
                )}
              >
                {MARCA_DA_ETAPA[etapa.status].sinal}
              </span>
              <span className="mesa-steps__pendencia-etapa">{etapa.label}</span>
              <span className="mesa-steps__pendencia-frase">{frase(etapa)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </nav>
  );
}
