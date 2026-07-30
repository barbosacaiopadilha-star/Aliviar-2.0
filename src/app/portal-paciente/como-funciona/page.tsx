import { SemCuradoria } from "@/components/curadoria/sem-curadoria";
import type { Metadata } from "next";

import { WhatsappContact } from "@/components/curadoria/whatsapp-contact";
import { PatientCard, PatientPageHeader } from "@/components/paciente/dashboard/patient-primitives";
import { buildJornada } from "@/modules/curadoria/jornada";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { listCaseIds, loadCuradoriaRecord } from "@/modules/curadoria/cos/repository";

export const metadata: Metadata = { title: "Como está sendo feita" };

async function loadMinhaCuradoria() {
  await requireRole("paciente");
  const supabase = await createServerSupabaseClient();
  const [caseId] = await listCaseIds(supabase);
  if (!caseId) return null;
  return loadCuradoriaRecord(supabase, caseId);
}

const PASSOS = [
  {
    titulo: "Sua história",
    texto:
      "Seu Curador escuta tudo antes de organizar qualquer coisa, e devolve organizado até você reconhecer: “é exatamente isso”.",
    quem: "Você e seu Curador",
  },
  {
    titulo: "O que precisa ser decidido",
    texto:
      "A conversa vira material de trabalho: o que é necessidade, o que é limite, o que é receio. Nada é acrescentado além do que você disse.",
    quem: "Seu Curador",
  },
  {
    titulo: "Suas prioridades",
    texto:
      "Vocês distribuem cem pontos entre o que mais importa para você. Cada peso fica registrado com a frase que o originou — e nada avança sem a sua validação.",
    quem: "Você decide, seu Curador registra",
  },
  {
    titulo: "A análise",
    texto:
      "Suas prioridades são aplicadas aos profissionais que a Aliviar já aprovou, por critério próprio e independente. Nenhum profissional paga para estar aqui.",
    quem: "Seu Curador, apoiado pela organização do sistema",
  },
  {
    titulo: "Seu Dossiê",
    texto:
      "Seu Curador escolhe três caminhos e escreve, para cada um, por que ele está ali, o que oferece e o que custa. A escolha das três é dele — nunca do sistema.",
    quem: "Seu Curador",
  },
  {
    titulo: "A apresentação",
    texto:
      "As opções são sempre apresentadas por uma pessoa, que explica as diferenças e responde suas dúvidas. A decisão final é exclusivamente sua.",
    quem: "Você e seu Curador",
  },
] as const;

export default async function ComoFuncionaPage() {
  const record = await loadMinhaCuradoria();
  if (!record) return <SemCuradoria />;
  const jornada = buildJornada(record);

  return (
    <div className="space-y-10">
      <PatientPageHeader
        eyebrow="Transparência"
        title="Como sua Curadoria é feita"
        description="Toda Curadoria da Aliviar segue exatamente a mesma sequência — a sua não é diferente. Isto é o que acontece entre a nossa conversa e o momento em que você decide."
      />

      <ol className="space-y-4">
        {PASSOS.map((passo, index) => (
          <li key={passo.titulo}>
            <PatientCard className="space-y-3">
              <div className="flex items-baseline gap-4">
                <span className="font-serif text-2xl text-[var(--color-brand-sage)]" aria-hidden="true">
                  {index + 1}
                </span>
                <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">{passo.titulo}</h2>
              </div>
              <p className="patient-body max-w-2xl text-[var(--color-ink-muted)]">{passo.texto}</p>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-brand-sage)]">
                {passo.quem}
              </p>
            </PatientCard>
          </li>
        ))}
      </ol>

      <PatientCard variant="note">
        <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">Três coisas que nunca mudam</h2>
        <ul className="mt-4 max-w-2xl space-y-3 text-[var(--patient-ink)]">
          <li className="patient-body">
            Nenhum profissional paga para estar na nossa rede, nem para aparecer no seu Dossiê.
          </li>
          <li className="patient-body">
            Nenhuma opção é escolhida por um sistema — a seleção é sempre de uma pessoa, com nome.
          </li>
          <li className="patient-body">
            A decisão final é sua, no seu tempo. Não existe prazo para você responder.
          </li>
        </ul>
      </PatientCard>

      <p className="patient-body max-w-2xl text-sm text-[var(--color-ink-muted)]">
        Sua Curadoria está sendo conduzida por {jornada.curatorName}.
      </p>

      <WhatsappContact topics={["duvida"]} />
    </div>
  );
}
