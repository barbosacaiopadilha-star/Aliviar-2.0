import { PatientCard } from "@/components/paciente/dashboard/patient-primitives";
import { ExpandableSection } from "@/components/paciente/experiencia/expandable-section";
import { PerfilPanel } from "@/components/paciente/perfil-panel";
import type { PerfilView } from "@/modules/paciente/experiencia";

/**
 * ProfileCard — o Perfil como resumo, nunca como formulário aberto.
 *
 * Antes, o Perfil inteiro (dois grupos, seis critérios, barra e pergunta de
 * validação) ficava permanentemente na home: informação demais para quem só
 * queria saber se algo andou. Agora o cartão responde três coisas — o que já
 * foi definido de cada lado e se ela já reconheceu o Perfil como seu — e o
 * resto abre quando ela pedir, no mesmo lugar.
 *
 * O painel detalhado é o mesmo componente certificado (`PerfilPanel`): a
 * mudança é de quando ele aparece, nunca do que ele diz.
 */
export function ProfileCard({ perfil }: { perfil: PerfilView }) {
  const definidos = (items: PerfilView["tecnicas"]) => items.filter((item) => item.importance).length;
  const tecnicas = definidos(perfil.tecnicas);
  const assistenciais = definidos(perfil.modeloDeCuidado);

  return (
    <PatientCard>
      <h2 className="patient-section-title">Meu Perfil</h2>

      <dl className="mt-4 space-y-2.5">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-[var(--color-ink-muted)]">Prioridades técnicas</dt>
          <dd className="text-sm font-medium text-[var(--patient-ink)]">
            {tecnicas === 0 ? "Em conversa" : `${tecnicas} de 3 definidas`}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-[var(--color-ink-muted)]">Prioridades do cuidado</dt>
          <dd className="text-sm font-medium text-[var(--patient-ink)]">
            {assistenciais === 0 ? "Em conversa" : `${assistenciais} de 3 definidas`}
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
