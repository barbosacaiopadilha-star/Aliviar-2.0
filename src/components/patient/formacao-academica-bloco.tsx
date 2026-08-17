import {
  FORMACAO_INDISPONIVEL,
  FORMACAO_KIND_LABELS,
  SELO_FORMACAO_VERIFICADA,
  linhasPublicas,
  temSeloDeVerificacao,
  type FormacaoPublica,
} from "@/modules/profiles/formacao-academica";

/**
 * A formação acadêmica na carta do caminho — fatos confirmados, principalmente
 * o NOME DA INSTITUIÇÃO, sem fonte, documento ou método de comprovação.
 *
 * O que este bloco se recusa a fazer, por decisão vinculante:
 * - imprimir "não informado", traço ou linha vazia — ausência é omissão;
 * - dar à formação qualquer cor, número ou destaque comparável entre cartas
 *   (formação não é mérito, é fato);
 * - mostrar mais de UM selo — "Formação verificada pela equipe" é binário.
 *
 * F-2 · três estados, não dois: formação confirmada (lista), silêncio legítimo
 * (nada confirmado ainda → o bloco não existe) e leitura indisponível (frase
 * neutra). O terceiro nunca se disfarça de segundo.
 */
export function FormacaoAcademicaBloco({
  formacao,
  indisponivel = false,
}: {
  formacao: FormacaoPublica[];
  indisponivel?: boolean;
}) {
  if (indisponivel) {
    return (
      <section aria-label="Formação acadêmica">
        <h4 className="patient-section-title">Formação</h4>
        <p
          role="status"
          className="mt-2 max-w-prose text-sm leading-relaxed text-[var(--color-ink-muted)]"
        >
          {FORMACAO_INDISPONIVEL}
        </p>
      </section>
    );
  }

  if (formacao.length === 0) return null;

  return (
    <section aria-label="Formação acadêmica">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="patient-section-title">Formação</h4>
        {temSeloDeVerificacao(formacao) ? (
          <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-white/70 px-3 py-1 text-xs font-medium text-[var(--patient-ink)]">
            {SELO_FORMACAO_VERIFICADA}
          </span>
        ) : null}
      </div>

      <ul className="mt-3 space-y-3">
        {formacao.map((entrada, indice) => {
          const linhas = linhasPublicas(entrada);
          return (
            <li key={`${entrada.kind}-${entrada.title}-${indice}`} className="max-w-prose">
              <p className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-muted)]">
                {FORMACAO_KIND_LABELS[entrada.kind]}
              </p>
              <p className="font-serif text-sm leading-relaxed text-[var(--patient-ink)]">
                {entrada.title}
              </p>
              {linhas.map((linha, i) => (
                <p
                  key={linha}
                  className={
                    i === 0
                      ? "text-sm font-medium leading-relaxed text-[var(--patient-ink)]"
                      : "text-sm leading-relaxed text-[var(--color-ink-muted)]"
                  }
                >
                  {linha}
                </p>
              ))}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
