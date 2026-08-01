import { ReconhecerPerfil } from "@/components/paciente/reconhecer-perfil";
import { PatientCard } from "@/components/paciente/dashboard/patient-primitives";
import type { PerfilView } from "@/modules/paciente/experiencia";

/**
 * O que mais importa para o seu caso — ADR-042, agora como eco.
 *
 * Antes este painel mostrava distribuição de pontos por critério. Ponto é
 * mecanismo interno: dizia como a Aliviar pondera, não o que ela escolheu.
 * Agora responde a pergunta dela — quais fatores foram considerados
 * prioritários —, agrupados pelo peso que ela mesma deu.
 *
 * A linguagem é de eco, nunca de diagnóstico (Linguagem §5): "foi isto que
 * entendemos do que você contou" — e o reconhecimento é dela, aqui (ADR-042).
 *
 * O que nunca atravessa: número, porcentagem, orçamento, cálculo. E nem os
 * níveis que ela declarou como pouco importantes somem: esconder o que ela
 * escolheu deixar de fora seria editar as palavras dela.
 *
 * Reabriga o conteúdo de /portal-paciente/prioridades (sem endereço desde o
 * 301 — Narrativa §8): a nota de que níveis nunca são nota de médico, o que
 * também foi registrado, e a data em que ela reconheceu o Perfil.
 */
export function PerfilPanel({
  perfil,
  caseId,
  observations = [],
  validatedAt,
  curatorName,
}: {
  perfil: PerfilView;
  caseId?: string;
  /** O que ela contou e orienta o cuidado — vem do registro da Curadoria. */
  observations?: string[];
  /** Quando ela reconheceu o Perfil; ausente enquanto o ato é dela. */
  validatedAt?: string | null;
  curatorName?: string | null;
}) {
  return (
    <PatientCard>
      <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">
        O que mais importa para o seu caso
      </h2>
      {/* O headline é a voz de estado do eco — "foi isto que entendemos", e
          depois do reconhecimento, "este Perfil é seu". Nunca diagnóstico. */}
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-[var(--color-ink-muted)]">
        {perfil.headline}
      </p>

      {perfil.prioridades.length === 0 ? (
        // Nunca um card vazio: o estado é dito por nome.
        <p className="mt-4 max-w-reading text-sm leading-relaxed text-ink-muted">
          Assim que esta etapa for concluída, você verá aqui o que foi considerado mais importante
          para o seu caso. Isso nasce da conversa com seu Curador, com as suas palavras.
        </p>
      ) : (
        <div className="mt-5 space-y-5">
          {perfil.prioridades.map((nivel) => (
            <div key={nivel.level}>
              <h3 className="text-xs uppercase tracking-wide text-ink-muted">{nivel.label}</h3>
              <ul className="mt-2 space-y-1">
                {nivel.itens.map((item) => (
                  <li key={item} className="text-sm text-ink">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {observations.length > 0 ? (
        <div className="mt-6 border-t border-[var(--color-border)] pt-5">
          <h3 className="text-xs uppercase tracking-wide text-ink-muted">Também registramos</h3>
          <ul className="mt-2 space-y-2">
            {observations.map((observation) => (
              <li key={observation} className="text-sm leading-relaxed text-ink">
                {observation}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {perfil.prioridades.length > 0 ? (
        <p className="mt-6 max-w-prose text-sm leading-relaxed text-[var(--color-ink-muted)]">
          Estes níveis representam apenas a importância que você atribuiu a cada aspecto durante a
          conversa. Eles falam do que importa para você — nenhum profissional é medido por eles.
        </p>
      ) : null}

      {validatedAt ? (
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-[var(--color-ink-muted)]">
          Você reconheceu este Perfil em{" "}
          {new Date(validatedAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
          {curatorName ? `, junto com ${curatorName}` : ""}. A partir daí ele passou a orientar
          toda a Curadoria.
        </p>
      ) : null}

      {!perfil.validated && perfil.prioridades.length > 0 && caseId ? (
        <ReconhecerPerfil
          caseId={caseId}
          pendentes={perfil.total - perfil.classificados}
          validated={perfil.validated}
        />
      ) : null}
    </PatientCard>
  );
}
