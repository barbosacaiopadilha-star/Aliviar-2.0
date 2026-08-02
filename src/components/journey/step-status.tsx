import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

/**
 * O que já sabemos · O que ainda precisa ser decidido.
 *
 * @metodo Guided Experience §2 — perguntas 2 e 4
 * @metodo UX_PRINCIPLES P4 — estado derivado de fato, nunca de rótulo
 * @metodo UX_PRINCIPLES P11 — estado vazio é informação, não vazio
 *
 * Por que existe: antes, uma etapa mostrava só "o que esta fase espera" — uma
 * lista de pendências sem o contrapeso do que já ficou pronto. Quem abre a tela
 * no meio do trabalho precisa das duas metades para saber onde está: sem o "já
 * sabemos", toda etapa parece começar do zero toda vez.
 *
 * Os dois lados vêm dos MESMOS critérios de saída do Motor — um é a lista dos
 * atendidos, o outro a dos pendentes. Nada aqui é escrito à mão, e por isso
 * nada aqui pode divergir do que o Motor considera concluído.
 *
 * O que nunca faz: contar ("2 de 4"), pontuar ou mostrar barra. Dentro de uma
 * etapa, contagem é pressão sem informação: o Curador precisa saber O QUE
 * falta, não quantos.
 */
export function StepStatus({
  settled,
  missing,
  blockedReason,
  completionSentence,
  stepName,
}: {
  /**
   * Nome da etapa. Obrigatório quando a página mostra mais de um quadro —
   * dois blocos com o mesmo título "Onde esta etapa está" na mesma tela
   * obrigam a pessoa a inferir qual é qual.
   */
  stepName?: string;
  /** Critérios já atendidos, em linguagem humana. */
  settled: string[];
  /** Critérios ainda em aberto. */
  missing: string[];
  /** Quando a etapa depende de outra, o motivo — nunca um cinza mudo. */
  blockedReason?: string | null;
  /** O que o Curador consegue dizer quando esta etapa termina. */
  completionSentence: string;
}) {
  const concluida = missing.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {concluida
            ? `${stepName ?? "Esta etapa"}: fechada`
            : `Onde ${stepName ? `“${stepName}” está` : "esta etapa está"}`}
        </CardTitle>
        <CardDescription>
          {concluida ? completionSentence : `Esta etapa fecha quando você puder dizer: “${completionSentence}”`}
        </CardDescription>
      </CardHeader>

      {blockedReason ? (
        <p className="max-w-reading rounded-md border border-border bg-canvas p-3 text-sm leading-relaxed text-ink-muted">
          Depende de: {blockedReason}
        </p>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <section aria-labelledby="etapa-sabemos">
          <h3 id="etapa-sabemos" className="text-xs uppercase tracking-wide text-ink-muted">
            O que já sabemos
          </h3>
          {settled.length === 0 ? (
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Nada registrado nesta etapa ainda.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {settled.map((item) => (
                <li key={item} className="flex items-baseline gap-2 text-sm text-ink">
                  <span aria-hidden="true" className="text-brand-sage-deep">
                    ✓
                  </span>
                  <span>{item}</span>
                  <span className="sr-only">(pronto)</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="etapa-decidir">
          <h3 id="etapa-decidir" className="text-xs uppercase tracking-wide text-ink-muted">
            O que ainda precisa ser decidido
          </h3>
          {missing.length === 0 ? (
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Nada em aberto aqui.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {missing.map((item) => (
                <li key={item} className="flex items-baseline gap-2 text-sm text-ink">
                  <span aria-hidden="true" className="text-ink-muted">
                    ○
                  </span>
                  <span>{item}</span>
                  <span className="sr-only">(em aberto)</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Card>
  );
}
