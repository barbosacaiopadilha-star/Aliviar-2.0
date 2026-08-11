import { StateMark } from "@/components/ui/state-mark";
import type { MarcoDaJornada, NarrativaDaJornada } from "@/modules/paciente/jornada-narrativa";

/**
 * A JORNADA DETALHADA — seis marcos numa coluna, lidos de cima para baixo.
 *
 * @metodo docs/repaginacao/13_MODELO_DE_ESTADOS.md §4 — cor nunca sozinha
 *
 * Não é stepper. Não há bolinha com check verde, não há barra de progresso,
 * não há caixa por etapa: quem separa os marcos é um **fio vertical** e o
 * espaço entre eles. Passado, presente e futuro se distinguem por peso
 * tipográfico e por uma marca com símbolo + texto — nunca só por cor.
 *
 * Este componente **não decide nada**. Recebe a narrativa já projetada e a
 * escreve. Não há `switch` de etapa aqui, nem leitura de fato: um segundo
 * motor de estado é exatamente o que a projeção única existe para impedir.
 */
export function JornadaNarrativa({ narrativa }: { narrativa: NarrativaDaJornada }) {
  const { marcos, responsavel, encerramento } = narrativa;

  return (
    <section aria-labelledby="jornada-titulo" className="max-w-2xl">
      <h2
        id="jornada-titulo"
        className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-muted)]"
      >
        Seu percurso
      </h2>

      {encerramento ? (
        // Cancelado ≠ concluído: o encerramento é dito antes dos marcos, para
        // que nenhum deles seja lido como percurso cumprido.
        <p className="mt-4 max-w-xl font-serif text-xl leading-snug text-[var(--patient-ink)]">
          <StateMark papel="neutro">{encerramento.rotulo}</StateMark>
        </p>
      ) : (
        <p className="mt-4 text-sm leading-relaxed text-[var(--color-ink-muted)]">
          Quem responde pelo seu caso agora é{" "}
          <span className="font-medium text-[var(--patient-ink)]">{responsavel.name}</span>,{" "}
          {responsavel.roleLabel}.
        </p>
      )}

      <ol className="mt-10 space-y-0">
        {marcos.map((marco, indice) => (
          <Marco key={marco.id} marco={marco} ultimo={indice === marcos.length - 1} />
        ))}
      </ol>
    </section>
  );
}

function Marco({ marco, ultimo }: { marco: MarcoDaJornada; ultimo: boolean }) {
  const concluido = marco.status === "CONCLUIDO";
  const atual = marco.status === "ATUAL";

  return (
    <li
      aria-current={atual ? "step" : undefined}
      /* O fio corre à esquerda e liga um marco ao seguinte. No último ele
         para: caminho que continua não termina em traço cortado. */
      className={[
        "relative pl-8",
        ultimo ? "pb-0" : "border-l pb-12",
        ultimo ? "" : concluido ? "border-l-[var(--color-brand-gold)]" : "border-l-[var(--color-border)]",
      ].join(" ")}
    >
      {/* A marca do marco, sobre o fio. Pequena — presença, não medalha. */}
      <span
        aria-hidden="true"
        className={[
          "absolute left-0 top-1.5 size-2 -translate-x-1/2 rounded-full",
          concluido
            ? "bg-[var(--color-brand-gold)]"
            : atual
              ? "bg-[var(--patient-acento)]"
              : "bg-[var(--color-border)]",
        ].join(" ")}
      />

      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-muted)]">
        {concluido ? (
          <StateMark papel="resolvido">Concluído</StateMark>
        ) : atual ? (
          <StateMark papel={marco.aguardaVoce ? "atencao" : "estrutura"}>
            {marco.aguardaVoce ? "Precisa de você" : "Agora"}
          </StateMark>
        ) : (
          <StateMark papel="neutro">Ainda por vir</StateMark>
        )}
      </p>

      <h3
        className={[
          "mt-2 font-serif leading-snug text-[var(--patient-ink)]",
          atual ? "text-2xl" : "text-xl",
          marco.status === "FUTURO" ? "opacity-70" : "",
        ].join(" ")}
      >
        {marco.titulo}
      </h3>

      <p className="patient-body mt-2 max-w-xl text-[var(--color-ink-muted)]">{marco.descricao}</p>

      {marco.submarcos.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {marco.submarcos.map((submarco) => (
            <li key={submarco.rotulo} className="text-sm leading-relaxed">
              <StateMark
                papel={submarco.feito ? "resolvido" : "neutro"}
                className="text-[var(--patient-ink)]"
              >
                <span className={submarco.feito ? "" : "text-[var(--color-ink-muted)]"}>
                  {submarco.rotulo}
                </span>
              </StateMark>
              {submarco.nota ? (
                <span className="mt-0.5 block pl-5 text-[0.8125rem] text-[var(--color-ink-muted)]">
                  {submarco.nota}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}
