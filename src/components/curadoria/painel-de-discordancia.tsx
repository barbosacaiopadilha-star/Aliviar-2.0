import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CATALOGO_GERADO } from "@/modules/curadoria/catalogo-gerado";
import type {
  PainelDeDiscordancia,
  SerieObservacional,
} from "@/modules/curadoria/painel-de-discordancia";

/**
 * PAINEL DE DISCORDÂNCIA — a superfície da Mesa (Item 1.11).
 *
 * @metodo Engine §1 — o Motor emoldura a decisão e nunca a ocupa: a derivação
 *         propõe, o humano decide, e a discordância é observada por conceito
 * @metodo Engine §4.5 — conflito sobe para o humano; o Motor nomeia, quantifica
 *         e para — a taxa por versão de regra é o instrumento de calibração
 *         (R-02: discordância alta corrige a tabela, nunca o Curador)
 *
 * Por que existe: quando as regras de derivação começarem a propor, o Método
 * precisa saber ONDE elas erram — por conceito e por versão exata — antes de
 * qualquer outra coisa. Este painel responde só isso, observacionalmente.
 *
 * O que esta superfície não faz: ordenar por taxa (a ordem é a neutra do
 * Catálogo, decidida no modelo), mostrar proposta individual, mostrar
 * qualquer dimensão pessoal — ela nem chega até aqui, porque não existe na
 * capability (CONTRATO_1_11 §3/§7).
 */

const NOME_DO_CONCEITO = new Map(CATALOGO_GERADO.map((c) => [c.code, c.name]));

function formatarTaxa(serie: SerieObservacional): string {
  if (!serie.discordancia.ha) return serie.discordancia.declaracao;
  const percentual = (serie.discordancia.taxa * 100).toFixed(0);
  return `${percentual}% de discordância em ${serie.discordancia.decididas} propostas decididas`;
}

export function PainelDeDiscordanciaMesa({ painel }: { painel: PainelDeDiscordancia }) {
  if (painel.vazio) {
    // §8 — o painel nasce vazio e diz isso. Nenhum demo, nenhum "0%".
    return (
      <Card>
        <CardHeader>
          <CardTitle>Discordância das derivações</CardTitle>
          <CardDescription>
            Nenhuma proposta derivada foi registrada até aqui. O painel passa a
            observar quando a primeira existir — nada é simulado.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {painel.series.map((serie) => (
        <Card key={`${serie.subcriterionCode}-${serie.ruleId}-v${serie.ruleVersion}`}>
          <CardHeader>
            <CardTitle>
              {NOME_DO_CONCEITO.get(serie.subcriterionCode) ?? serie.subcriterionCode}
            </CardTitle>
            <CardDescription>
              Regra {serie.ruleId} · versão {serie.ruleVersion} — cada versão é
              uma série própria; versões nunca somam.
            </CardDescription>
            <CardDescription>{formatarTaxa(serie)}</CardDescription>
            <CardDescription>
              {serie.contagens.CONFIRMADA} confirmadas · {serie.contagens.RECUSADA} recusadas ·{" "}
              {serie.contagens.PROPOSTA} aguardam juízo · {serie.contagens.SUPERADA} superadas ·{" "}
              {serie.contagens.RETIRADA} retiradas
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
