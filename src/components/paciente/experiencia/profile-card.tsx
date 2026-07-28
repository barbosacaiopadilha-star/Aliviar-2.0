import { PatientCard } from "@/components/paciente/dashboard/patient-primitives";
import { ExpandableSection } from "@/components/paciente/experiencia/expandable-section";
import { PerfilPanel } from "@/components/paciente/perfil-panel";
import type { PerfilView } from "@/modules/paciente/experiencia";

/**
 * ProfileCard — o Perfil como resumo, nunca como formulário aberto.
 *
 * Depois da ADR-042 o cartão mudou de conceito: em vez de contar critérios
 * definidos, ele antecipa **o que mais importa** — os primeiros fatores do
 * nível mais alto — e abre o retrato inteiro quando ela pedir, no mesmo
 * lugar.
 *
 * Nenhum número de ponderação atravessa. "3 de 26" é contagem de conversa,
 * não peso: diz o quanto já foi conversado, nunca o quanto algo vale.
 */
export function ProfileCard({ perfil }: { perfil: PerfilView }) {
  const maisImportante = perfil.prioridades[0];

  return (
    <PatientCard>
      <h2 className="patient-section-title">O que mais importa para o seu caso</h2>

      {maisImportante ? (
        <div className="mt-4">
          <p className="text-sm text-[var(--color-ink-muted)]">{maisImportante.label}</p>
          <ul className="mt-1.5 space-y-1">
            {maisImportante.itens.slice(0, 3).map((item) => (
              <li key={item} className="text-sm font-medium text-[var(--patient-ink)]">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-muted)]">
          Ainda em conversa com seu Curador.
        </p>
      )}

      <dl className="mt-5 space-y-2.5">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-[var(--color-ink-muted)]">Fatores conversados</dt>
          <dd className="text-sm font-medium text-[var(--patient-ink)]">
            {perfil.classificados === 0
              ? "Em conversa"
              : `${perfil.classificados} de ${perfil.total}`}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-[var(--color-ink-muted)]">Validação</dt>
          <dd className="text-sm font-medium text-[var(--patient-ink)]">
            {perfil.validated ? "Reconhecido por você" : "Ainda com você"}
          </dd>
        </div>
      </dl>

      <ExpandableSection
        className="mt-6"
        label="Conhecer meu Perfil"
        expandedLabel="Recolher meu Perfil"
      >
        <PerfilPanel perfil={perfil} />
      </ExpandableSection>
    </PatientCard>
  );
}
