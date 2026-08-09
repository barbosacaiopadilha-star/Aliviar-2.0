/**
 * LEITURA RELACIONAL — a quarta leitura da Curadoria na Mesa (ADR-065).
 *
 * @metodo docs/curadoria/DOMINIO_COMPATIBILIDADE_RELACIONAL.md (Parte 7.1)
 *
 * Uma seção por profissional elegível; dentro dela, uma linha por conceito
 * respondido pela pessoa: o grau dela, o que ela pediu, o que o profissional
 * declara, e a leitura — célula da matriz ou "Aguarda juízo do Curador".
 *
 * O que nunca faz (Decisão B, ADR-065): ordenar por resultado, marcar
 * posição, somar leituras, comparar profissionais entre si ou converter a
 * sinalização humana em resultado. O juízo do Curador sobre os conceitos
 * humanos é exercido no Relatório — aqui as duas declarações aparecem lado a
 * lado, na íntegra, para serem lidas.
 */

import { NEED_DEGREE_LABELS } from "@/modules/curadoria/protocolos";
import { COMPATIBILITY_LABELS } from "@/modules/curadoria/motor-compatibilidade";
import {
  RELATIONAL_CONCEPTS,
  type RelationalReading,
} from "@/modules/curadoria/motor-relacional";
import type { CaseRelationalReading } from "@/modules/curadoria/motor-relacional-repository";

/** Rótulo de cada conduta do lado profissional, por conceito — do Catálogo. */
const CONDUTA_LABELS: ReadonlyMap<string, ReadonlyMap<string, string>> = new Map(
  RELATIONAL_CONCEPTS.map((concept) => [
    concept.code,
    new Map(
      concept.profissional
        .filter((campo) => campo.field === "principal")
        .flatMap((campo) => campo.options.filter((o) => o.active).map((o) => [o.value, o.label] as const)),
    ),
  ]),
);

const OPCAO_PESSOA_LABELS: ReadonlyMap<string, ReadonlyMap<string, string>> = new Map(
  RELATIONAL_CONCEPTS.map((concept) => [
    concept.code,
    new Map(
      concept.paciente
        .filter((campo) => campo.field === "principal")
        .flatMap((campo) => campo.options.filter((o) => o.active).map((o) => [o.value, o.label] as const)),
    ),
  ]),
);

function rotulosDeConduta(code: string, condutas: readonly string[]): string {
  const mapa = CONDUTA_LABELS.get(code);
  if (condutas.length === 0) return "— sem registro";
  return condutas.map((value) => mapa?.get(value) ?? value).join("; ");
}

function rotulosDaPessoa(code: string, opcoes: readonly string[]): string {
  const mapa = OPCAO_PESSOA_LABELS.get(code);
  return opcoes.map((value) => mapa?.get(value) ?? value).join("; ");
}

function leituraDe(reading: RelationalReading): { texto: string; tom: "alta" | "media" | "lacuna" | "neutra" | "juizo" } {
  if (reading.kind === "JUIZO_HUMANO") {
    return { texto: "Aguarda juízo do Curador", tom: "juizo" };
  }
  const tons = {
    ALTA_COMPATIBILIDADE: "alta",
    MEDIA_COMPATIBILIDADE: "media",
    LACUNA_DE_INFORMACAO: "lacuna",
    NAO_RELEVANTE: "neutra",
  } as const;
  return { texto: COMPATIBILITY_LABELS[reading.result], tom: tons[reading.result] };
}

/**
 * E-3 · a leitura relacional NÃO é acerto e erro.
 *
 * Antes, `ALTA_COMPATIBILIDADE` era verde e `MEDIA` era âmbar: cor
 * interpretando o CONTEÚDO da evidência, que é exatamente o que o Método
 * proíbe. Verde ensinaria a ler "boa opção"; âmbar, "cuidado" — e nenhuma
 * das duas leituras existe no domínio.
 *
 * Agora as leituras compartilham a cor institucional e se distinguem por
 * FORMA — sólida, tracejada, apagada —, que sobrevive ao daltonismo e à
 * impressão em cinza. O rótulo textual (`COMPATIBILITY_LABELS`) continua ao
 * lado e não mudou.
 *
 * A única exceção é `juizo`: "Aguarda juízo do Curador" é falta de ATO
 * HUMANO, não leitura de evidência — e por isso é o único que recebe âmbar,
 * na mesma gramática do resto da Mesa.
 */
const TOM_CLASSES: Record<string, string> = {
  alta: "border-l-2 border-[color-mix(in_srgb,var(--color-brand-primary)_70%,transparent)]",
  media: "border-l-2 border-dotted border-[color-mix(in_srgb,var(--color-brand-primary)_70%,transparent)]",
  lacuna: "border-l-2 border-dashed border-slate-400",
  neutra: "border-l-2 border-slate-200",
  juizo: "border-l-2 border-double border-[color-mix(in_srgb,var(--color-attention)_75%,transparent)]",
};

export function LeituraRelacionalPanel({
  colunas,
  relationalNeedsCount,
}: {
  colunas: Array<CaseRelationalReading & { nome: string }>;
  relationalNeedsCount: number;
}) {
  if (relationalNeedsCount === 0) {
    return (
      <div className="mesa-bloco">
        <p className="max-w-reading text-sm leading-relaxed text-ink-muted">
          A pessoa ainda não respondeu o bloco &ldquo;Como você quer ser cuidada&rdquo; do
          Protocolo. Sem a declaração dela, não há leitura relacional — nada aqui é inferido.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="leitura-relacional">
      {colunas.map((coluna) => (
        <section key={coluna.professionalProfileId} className="mesa-bloco space-y-3">
          <header className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-ink">{coluna.nome}</h3>
            <p className="text-xs text-ink-muted">{coluna.summarySentence}</p>
          </header>

          <ul className="space-y-2">
            {coluna.readings.map((reading) => {
              const leitura = leituraDe(reading);
              return (
                <li
                  key={reading.code}
                  className={`rounded-md bg-surface px-3 py-2 ${TOM_CLASSES[leitura.tom]}`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-ink">{reading.conceptName}</span>
                    <span className="text-xs text-ink-muted">{NEED_DEGREE_LABELS[reading.degree]}</span>
                  </div>
                  <dl className="mt-1 grid gap-x-6 gap-y-1 text-xs leading-relaxed sm:grid-cols-2">
                    <div>
                      <dt className="text-ink-muted">Ela pediu</dt>
                      <dd className="text-ink">
                        {reading.kind === "JUIZO_HUMANO" && reading.personGuidedText
                          ? reading.personGuidedText
                          : rotulosDaPessoa(
                              reading.code,
                              reading.kind === "JUIZO_HUMANO"
                                ? reading.personOptions
                                : reading.matches.map((m) => m.personOption),
                            ) || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-muted">Ele declara</dt>
                      <dd className="text-ink">{rotulosDeConduta(reading.code, reading.declaredConducts)}</dd>
                    </div>
                  </dl>
                  <p className="mt-1 text-xs font-medium text-ink">{leitura.texto}</p>
                  {reading.kind === "JUIZO_HUMANO" && !reading.hasEvidence ? (
                    <p className="text-xs text-ink-muted">
                      Sem registro do profissional para este conceito — a lacuna não some por ser
                      juízo humano.
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>

          {coluna.notAnsweredByPerson.length > 0 ? (
            <p className="text-xs text-ink-muted">
              Fora do cruzamento (sem resposta da pessoa): {coluna.notAnsweredByPerson.length}{" "}
              conceito(s).
            </p>
          ) : null}
        </section>
      ))}
    </div>
  );
}
