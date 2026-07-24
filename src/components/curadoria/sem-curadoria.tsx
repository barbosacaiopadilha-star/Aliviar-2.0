/**
 * Estado vazio — paciente sem Curadoria iniciada.
 *
 * @metodo Experience §1 — acolher sem pressionar quando ainda não há jornada
 *
 * Por que existe: explicar com clareza o que acontece a seguir, sem parecer
 * erro ou abandono.
 */

import { WhatsappContact } from "@/components/curadoria/whatsapp-contact";
import { PatientCard, PatientPageHeader } from "@/components/paciente/dashboard/patient-primitives";

export function SemCuradoria() {
  return (
    <div className="space-y-10">
      <PatientPageHeader
        title="Sua Jornada"
        description="Sua Curadoria ainda não começou — e está tudo bem."
      />

      <PatientCard className="max-w-2xl space-y-4">
        <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">O que acontece a seguir</h2>
        <p className="patient-body text-[var(--color-ink-muted)]">
          Assim que sua Consulta Inicial for marcada, este espaço passa a mostrar cada etapa: quem está com o
          seu caso, em que ponto ele está e quando você terá notícia.
        </p>
        <p className="patient-body text-[var(--patient-ink)]">
          Nada está carregando e nada deu errado. Sua jornada aparece aqui inteira a partir da primeira
          conversa — e você nunca vai precisar perguntar em que etapa ela está.
        </p>
      </PatientCard>

      <WhatsappContact topics={["duvida"]} />
    </div>
  );
}
