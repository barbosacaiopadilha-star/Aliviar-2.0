"use client";

/**
 * O QUE AINDA DEPENDE DE VOCÊ — o índice de um documento longo demais.
 *
 * @metodo ADR-093 — as lacunas viram tarefa, com nome e dono
 * @metodo Experience §3 — o copiloto sinaliza e nunca bloqueia sem explicar
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POR QUE ELE EXISTE AQUI, SE A AUDITORIA F-6 JÁ O TINHA ENCOLHIDO UMA VEZ.
 *
 * Na Mesa antiga, "merece atenção" virou espelho: repetia, item a item, o
 * trabalho que a etapa em foco já listava no centro da tela. Seis
 * profissionais sem declaração de área apareciam duas vezes na mesma página.
 * A correção foi mostrar só o que estava FORA da etapa da vez — porque o que
 * era da vez já era a própria tela.
 *
 * Na Mesa nova não existe etapa da vez: tudo está na mesma página, sempre. O
 * mesmo recorte não se aplica, e copiá-lo sem pensar traria o espelho de volta.
 *
 * O que muda a natureza dele é o tamanho. Esta página passa de dez mil pixels
 * — o `SIM-13` medido — e nenhuma pessoa segura onze telas de contexto na
 * cabeça. Aqui o painel não repete um foco: ele é o **índice das pendências**
 * de um documento que não cabe na tela, no topo, com um salto para o lugar
 * onde cada uma se resolve.
 *
 * É mitigação do `SIM-13`, não solução. A solução é decidir se isto cabe numa
 * tela só, e essa decisão vem depois de os painéis todos estarem dentro.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POR QUE ESTE COMPONENTE EXISTE, e não é a rota chamando o painel direto:
 * `onIr` e `rotuloDoDestino` são funções, e função não atravessa a fronteira
 * de um Server Component. O mapa da tela mora no cliente — que é onde ele
 * pertence de qualquer forma: a pendência é do Método, a geografia é da tela.
 */

import { PainelAtencao } from "@/components/curadoria/mesa/painel-atencao";
import type { AtencaoItem } from "@/modules/curadoria/mesa-investigacao";
import type { MesaEtapaId } from "@/modules/curadoria/mesa-etapas";

/**
 * A ETAPA DO MÉTODO → A SEÇÃO DESTA TELA.
 *
 * O item de atenção sabe a que etapa pertence, e isso é vocabulário do Método
 * — não muda porque a tela mudou. O que cada Mesa faz com essa informação é
 * problema dela. Aqui, etapa vira âncora.
 */
const DESTINO: Record<MesaEtapaId, { ancora: string; nome: string }> = {
  PERFIL: { ancora: "quanto-importa", nome: "Quanto cada coisa importa" },
  REDE: { ancora: "quem-pode-participar", nome: "Quem pode participar" },
  AVALIACAO: { ancora: "o-que-ela-pediu", nome: "O que ela pediu" },
  COMPATIBILIDADE: { ancora: "o-que-ela-pediu", nome: "O que ela pediu" },
  CAMINHOS: { ancora: "compor-os-tres", nome: "Compor os três" },
  RELATORIO: { ancora: "o-relatorio", nome: "O relatório" },
};

export function OQueDependeDeVoce({ itens }: { itens: AtencaoItem[] }) {
  return (
    <section className="flex flex-col gap-3 rounded-md border border-border px-4 py-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-medium text-ink">O que ainda depende de você</h2>
        <p className="max-w-3xl text-sm text-ink-muted">
          Esta página é longa. Aqui está o que continua aberto, com um salto para o lugar onde
          cada coisa se resolve — nada aqui é ranking, e a ordem é a de quem atrapalha primeiro.
        </p>
      </header>

      <PainelAtencao
        itens={itens}
        rotuloDoDestino={(etapa) => DESTINO[etapa].nome}
        onIr={(etapa) => {
          const alvo = document.getElementById(DESTINO[etapa].ancora);
          // Sem âncora, não finge que navegou: rolar para lugar nenhum foi
          // exatamente a queixa do `SIM-13` ("larga o usuário em região vazia").
          if (alvo) alvo.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />
    </section>
  );
}
