import { CuratorAvatar } from "@/components/paciente/dashboard/patient-primitives";
import type { CoaCurrentResponsible } from "@/modules/coa/journey-responsibility";

/**
 * QUEM ACOMPANHA VOCÊ AGORA — o nível 3 da Home.
 *
 * @metodo docs/repaginacao/04_EXPERIENCIA_DO_PACIENTE.md — o caso tem sempre
 *         uma pessoa com nome, nunca "a equipe"
 *
 * Uma linha, não um cartão. A pergunta *"quem está comigo?"* merece resposta
 * imediata e merece **pouco** espaço: quem pergunta isso quer reconhecer um
 * nome, não abrir um canal de atendimento. Um painel aqui competiria com o
 * estado e com a próxima ação, que são o que a pessoa veio ver.
 *
 * A responsabilidade é **lida**, nunca decidida aqui: `currentResponsible` vem
 * de `resolveCurrentResponsible`, onde vive a regra de que antes da decisão
 * responde o Curador e depois dela o Concierge. Este componente não conhece
 * fase, não conhece `devolutiva` e não tem `switch`.
 */
export function QuemAcompanha({ responsavel }: { responsavel: CoaCurrentResponsible }) {
  return (
    <section
      aria-labelledby="quem-acompanha-titulo"
      className="flex items-center gap-4 border-t border-[color-mix(in_srgb,var(--color-brand-gold)_20%,transparent)] pt-6"
    >
      <CuratorAvatar name={responsavel.name} className="size-10" />
      <div className="min-w-0">
        <h2
          id="quem-acompanha-titulo"
          className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-muted)]"
        >
          Quem acompanha você agora
        </h2>
        <p className="mt-1 text-[0.9375rem] leading-snug text-[var(--patient-ink)]">
          <span className="font-medium">{responsavel.name}</span>
          <span className="text-[var(--color-ink-muted)]">, {responsavel.roleLabel}</span>
        </p>
      </div>
    </section>
  );
}
