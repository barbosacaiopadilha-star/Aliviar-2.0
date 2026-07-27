"use client";

/**
 * A REDE COM RECORTE — filtro instantâneo sobre a lista que já existia.
 *
 * @metodo Engine §5.5 — o Curador vê tudo do caso
 *
 * Por que existe: com a Rede crescendo, "quem ainda não foi avaliado" custava
 * percorrer a lista inteira. O recorte acontece aqui, no cliente, sem menu,
 * sem reload e sem sair da etapa — o painel de elegibilidade continua o mesmo,
 * certificado, apenas recebendo quem exibir.
 *
 * O que nunca faz: esconder em silêncio. O número exibido/total acompanha
 * qualquer recorte, e limpar os filtros é um toque.
 */

import { useState } from "react";

import { EligibilityPanel } from "@/components/curadoria/cruzamento-mesa";
import { FiltrosRapidos } from "@/components/curadoria/mesa/filtros-rapidos";
import { FILTROS_ID } from "@/components/curadoria/mesa/mesa-shell";
import {
  aplicarFiltros,
  filtrosDisponiveis,
  recorteSentence,
  type InvestigacaoProfissional,
  type MesaFiltroId,
} from "@/modules/curadoria/mesa-investigacao";
import type { MesaCruzamentoView } from "@/modules/curadoria/mesa-cruzamento";

export function RedeFiltravel({
  view,
  profissionais,
}: {
  view: MesaCruzamentoView;
  profissionais: InvestigacaoProfissional[];
}) {
  const [ativos, setAtivos] = useState<MesaFiltroId[]>([]);

  const visiveis = aplicarFiltros(profissionais, ativos);

  return (
    <div>
      <FiltrosRapidos
        id={FILTROS_ID}
        filtros={filtrosDisponiveis(profissionais, ativos)}
        resumo={recorteSentence(visiveis.length, profissionais.length, ativos.length)}
        onAlternar={(filtro) =>
          setAtivos((atuais) =>
            atuais.includes(filtro)
              ? atuais.filter((entrada) => entrada !== filtro)
              : [...atuais, filtro],
          )
        }
        onLimpar={() => setAtivos([])}
      />

      <div className="mt-6">
        <EligibilityPanel view={view} somente={visiveis.map((profissional) => profissional.id)} />
      </div>
    </div>
  );
}
