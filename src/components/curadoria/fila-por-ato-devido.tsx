import Link from "next/link";

import { Card } from "@/components/ui/card";
import {
  montarFila,
  type FatosDaFila,
  type GrupoMontado,
} from "@/modules/curadoria/fila-por-ato-devido";

/**
 * A FILA DO CURADOR — agrupada pelo ato devido.
 *
 * @metodo Experience §3 — a fila mostra quem precisa de um passo, e nunca métrica de produtividade.
 * @metodo Jornada §6 — os sete grupos são os atos devidos da jornada, na ordem em que ela acontece.
 *
 * Por que existe: o Curador abre o portal com uma pergunta só — "por onde eu
 * começo agora?". A lista única obrigava a ler cada cartão para descobrir se a
 * bola era dele. O agrupamento responde antes da leitura, e responde também o
 * contrário: estes aqui não são seus, e está certo que estejam parados.
 *
 * A tela anterior ordenava por "quem precisa de você", numa lista só. Funcionava
 * para três Casos e desmontava com dez: o Curador precisava ler cada cartão para
 * descobrir se a bola era dele. Agora o agrupamento responde isso antes da
 * leitura — e responde também o contrário, que é a parte que faltava: **estes
 * aqui não são seus, e está certo que estejam parados**.
 *
 * O que esta tela deliberadamente NÃO faz:
 *  - não inventa prazo, "atrasado", SLA ou contagem de dias — não existe regra
 *    temporal aprovada, e a Fila não é lugar de criar uma;
 *  - não mostra conteúdo clínico: nem parecer, nem história, nem diagnóstico,
 *    nem justificativa de composição, nem nota de filtro;
 *  - não oferece ao Curador nenhum ato que pertence à paciente — o grupo
 *    "Aguarda o reconhecimento dela" informa e para aí (ADR-042);
 *  - não some com grupo vazio: um grupo que desaparece ensina a não procurar
 *    por ele, e volta um dia mudando a tela de forma sem aviso.
 */
export function FilaPorAtoDevido({ casos }: { casos: FatosDaFila[] }) {
  const { grupos, total } = montarFila(casos);

  return (
    <section aria-labelledby="fila-heading" className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="fila-heading" className="font-sans text-xl font-semibold text-ink">
          Suas Curadorias
        </h2>
        {/* O contraponto do agrupamento: quantos são no total, para o Curador
            saber que nada sumiu ao ser distribuído entre os grupos. */}
        <p className="text-sm text-ink-muted">
          {total === 0
            ? "Nenhum Caso ativo."
            : total === 1
              ? "1 Caso ativo, agrupado pelo ato devido."
              : `${total} Casos ativos, agrupados pelo ato devido.`}
        </p>
      </div>

      <div className="space-y-8">
        {grupos.map((grupo) => (
          <GrupoDaFilaSecao key={grupo.definicao.id} grupo={grupo} />
        ))}
      </div>
    </section>
  );
}

function GrupoDaFilaSecao({ grupo }: { grupo: GrupoMontado }) {
  const { definicao, casos, contagem } = grupo;
  const idDoTitulo = `fila-grupo-${definicao.id.toLowerCase()}`;

  return (
    <section aria-labelledby={idDoTitulo} className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pb-2">
        <h3 id={idDoTitulo} className="font-sans text-base font-semibold text-ink">
          {definicao.titulo}
        </h3>
        {/* A contagem é TEXTO, não um badge colorido: quem não distingue cor
            lê o mesmo que todo mundo, e nenhum número vira sinal de urgência. */}
        <span className="text-sm text-ink-muted">
          {contagem === 1 ? "1 Caso" : `${contagem} Casos`}
        </span>
      </div>

      <p className="max-w-reading text-sm leading-relaxed text-ink-muted">{definicao.atoDevido}</p>

      {contagem === 0 ? (
        <p className="text-sm text-ink-muted">{definicao.vazio}</p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {casos.map((caso) => (
            <li key={caso.caseId}>
              <Card className="space-y-3">
                {/* Identificação operacional mínima: o nome, e só. Nenhum ID
                    interno, nenhum contato, nenhum dado clínico. */}
                <h4 className="font-sans text-base font-medium text-ink">{caso.patientName}</h4>

                {definicao.temAcaoDoCurador ? (
                  <Link
                    href={`/coa/curadoria/casos/${caso.caseId}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors duration-fast ease-standard hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  >
                    Abrir o caso
                    <span aria-hidden="true">→</span>
                  </Link>
                ) : (
                  /* Ato de outra pessoa: existe caminho para LER o caso, e
                     nenhum botão que sugira executá-lo no lugar dela. */
                  <Link
                    href={`/coa/curadoria/casos/${caso.caseId}`}
                    className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-brand-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  >
                    Ver o caso
                  </Link>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
