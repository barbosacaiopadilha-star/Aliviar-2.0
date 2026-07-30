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

export function MesaTimeline({ marks, label }: { marks: CaseTimelineMark[]; label?: string }) {
  return (
    <ol className="mesa-timeline" aria-label={label}>
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

/**
 * LINHA DO TEMPO DUPLA — onde o paciente está, onde a investigação está.
 *
 * As duas correm no mesmo tempo e quase nunca no mesmo ponto: o paciente pode
 * estar esperando há uma semana enquanto a investigação ainda reúne
 * evidência. Ver as duas juntas é o que impede a Mesa de virar um ambiente
 * fechado em si mesmo — do outro lado tem alguém contando os dias.
 *
 * Continua sem navegação: duas linhas de orientação, nenhum clique.
 */
export function MesaTimelineDupla({
  paciente,
  investigacao,
}: {
  paciente: CaseTimelineMark[];
  investigacao: CaseTimelineMark[];
}) {
  return (
    <div className="mesa-dupla">
      <div>
        <p className="mesa-rotulo">Jornada do paciente</p>
        <div className="mt-1.5">
          <MesaTimeline marks={paciente} label="Jornada do paciente" />
        </div>
      </div>

      <div className="mesa-dupla__segunda">
        <p className="mesa-rotulo">Investigação do Curador</p>
        <div className="mt-1.5">
          <MesaTimeline marks={investigacao} label="Investigação do Curador" />
        </div>
      </div>
    </div>
  );
}
