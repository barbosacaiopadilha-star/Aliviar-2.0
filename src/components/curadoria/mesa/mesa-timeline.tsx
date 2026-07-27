/**
 * Linha do tempo do Case — sempre visível, nunca navegável daqui.
 *
 * @metodo Guided Experience §2 — o que já aconteceu e o que vem depois
 * @metodo Ontologia §3.13 — ordem, jamais colocação
 *
 * Por que existe: o Curador precisa saber onde o Case inteiro está enquanto
 * trabalha numa etapa da Mesa. Consulta, Perfil, Validação, Curadoria,
 * Relatório e Entrega em seis marcas — informação de orientação, não menu.
 *
 * O que nunca faz: virar navegação. Sair da Mesa é ato explícito, feito pela
 * jornada do Case; um clique acidental aqui perderia o trabalho em curso.
 */

import { cn } from "@/components/ui/cn";

export type CaseTimelineMark = {
  id: string;
  label: string;
  status: "done" | "current" | "ahead";
};

const ESTADO: Record<CaseTimelineMark["status"], string> = {
  done: "concluída",
  current: "em andamento",
  ahead: "ainda por vir",
};

export function MesaTimeline({ marks }: { marks: CaseTimelineMark[] }) {
  return (
    <ol className="mesa-timeline">
      {marks.map((mark) => (
        <li
          key={mark.id}
          aria-current={mark.status === "current" ? "step" : undefined}
          className={cn("mesa-timeline__item", `mesa-timeline__item--${mark.status}`)}
        >
          <span className="mesa-timeline__bar" aria-hidden="true" />
          <span>{mark.label}</span>
          <span className="sr-only">, {ESTADO[mark.status]}</span>
        </li>
      ))}
    </ol>
  );
}
