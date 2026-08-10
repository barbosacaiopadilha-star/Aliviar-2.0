import { cn } from "@/components/ui/cn";
import { classeDoPapel, SINAL_DO_PAPEL, type PapelVisual } from "@/foundation/estado-visual";

/**
 * `StateMark` — a marca de um estado: **cor + símbolo + texto**, sempre os três.
 *
 * @metodo docs/repaginacao/12_DESIGN_SYSTEM_ALVO.md §4
 * @metodo docs/repaginacao/13_MODELO_DE_ESTADOS.md §4 — cor nunca sozinha
 *
 * Por que este primitivo existe, e por que não é o `Badge`: o `Badge` é
 * deliberadamente **não semântico** — ele não tem variante `success` nem
 * `danger`, e o comentário lá diz que *"a ausência é a proteção"*. Ele decora;
 * não afirma estado. Quando uma tela precisa dizer *em que ponto uma coisa
 * está*, ela precisa de algo que carregue papel, símbolo e frase juntos, e que
 * não deixe nenhum dos três cair.
 *
 * O que ele impede, concretamente:
 *
 * - **cor sozinha** — o símbolo acompanha sempre, e sobrevive ao daltonismo,
 *   à impressão em cinza e ao contraste ruim de tela barata;
 * - **texto sozinho** — sem `children` não há marca; o componente exige a frase;
 * - **papel inventado** — só os cinco da gramática certificada entram, e o
 *   TypeScript recusa o resto.
 *
 * O símbolo é decorativo para tecnologia assistiva (`aria-hidden`): quem usa
 * leitor de tela recebe a frase, que já diz tudo — ouvir "bola" antes dela
 * seria ruído, não informação.
 */
export function StateMark({
  papel,
  children,
  sinal,
  className,
}: {
  papel: PapelVisual;
  /** A frase do estado. Obrigatória: a marca não existe sem texto. */
  children: React.ReactNode;
  /** Símbolo próprio, quando ele diz mais que o canônico do papel. */
  sinal?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      <span aria-hidden="true" className={classeDoPapel(papel)}>
        {sinal ?? SINAL_DO_PAPEL[papel]}
      </span>
      <span>{children}</span>
    </span>
  );
}
