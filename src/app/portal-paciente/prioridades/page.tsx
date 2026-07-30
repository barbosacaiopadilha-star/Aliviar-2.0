import { SemCuradoria } from "@/components/curadoria/sem-curadoria";
import type { Metadata } from "next";

import { WhatsappContact } from "@/components/curadoria/whatsapp-contact";
import { PatientCard, PatientPageHeader } from "@/components/paciente/dashboard/patient-primitives";
import { PERFIL_MESSAGE } from "@/modules/curadoria/jornada";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { listCaseIds, loadCuradoriaRecord } from "@/modules/curadoria/cos/repository";
import {
  groupPriorityMap,
  IMPORTANCE_LABELS,
  IMPORTANCE_LEVELS,
  type ImportanceLevel,
} from "@/modules/curadoria/mapa-prioridades";
import {
  listSubcriterionCatalog,
  loadCasePriorityMap,
} from "@/modules/curadoria/mapa-prioridades-repository";

export const metadata: Metadata = { title: "Minhas prioridades" };

/**
 * M3 (ADR-042): esta página exibia a distribuição de 100 pontos — "40 pontos",
 * barras e um total —, exatamente a pontuação que a ADR-042 decidiu que a
 * paciente não vê. Agora ela responde "o que mais importa para o seu caso":
 * os subcritérios do Mapa, agrupados pelo nível que ela declarou, na língua
 * dela — nenhum número, nenhuma barra, nenhuma soma.
 */
async function loadMinhasPrioridades() {
  await requireRole("paciente");
  const supabase = await createServerSupabaseClient();
  const [caseId] = await listCaseIds(supabase);
  if (!caseId) return null;

  const record = await loadCuradoriaRecord(supabase, caseId);
  if (!record) return null;

  const [catalogo, mapa] = await Promise.all([
    listSubcriterionCatalog(supabase),
    loadCasePriorityMap(supabase, caseId),
  ]);

  return { record, groups: groupPriorityMap(mapa.items, catalogo) };
}

export default async function MinhasPrioridadesPage() {
  const dados = await loadMinhasPrioridades();
  if (!dados) return <SemCuradoria />;
  const { record, groups } = dados;
  const { observations } = record.prioridades;

  // O Mapa reorganizado por nível — a pergunta desta página é "o que mais
  // importa", não "em qual grupo do Método cada item mora".
  const porNivel = new Map<ImportanceLevel, string[]>();
  for (const group of groups) {
    for (const entry of group.entries) {
      if (entry.importance === null) continue;
      const nomes = porNivel.get(entry.importance) ?? [];
      nomes.push(entry.subcriterion.name);
      porNivel.set(entry.importance, nomes);
    }
  }

  return (
    <div className="space-y-10">
      <PatientPageHeader
        eyebrow="Perfil confirmado"
        title="Suas prioridades, nas suas palavras."
        description={PERFIL_MESSAGE}
      />

      <div className="space-y-5">
        {IMPORTANCE_LEVELS.map((nivel) => {
          const nomes = porNivel.get(nivel);
          if (!nomes || nomes.length === 0) return null;
          return (
            <PatientCard key={nivel} variant="note" className="patient-fade-in">
              <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">
                {IMPORTANCE_LABELS[nivel]}
              </h2>
              <ul className="mt-4 space-y-2 text-[var(--patient-ink)]">
                {nomes.map((nome) => (
                  <li
                    key={nome}
                    className="patient-body border-l-2 border-[var(--color-brand-sage)]/30 pl-4"
                  >
                    {nome}
                  </li>
                ))}
              </ul>
            </PatientCard>
          );
        })}
      </div>

      <PatientCard variant="note">
        <p className="patient-body max-w-2xl text-[var(--patient-ink)]">
          Estes níveis representam apenas a importância que{" "}
          <strong className="font-medium">você</strong> atribuiu a cada aspecto durante nossa
          conversa. Eles nunca representam nota de médico — nenhum profissional é avaliado por
          eles. Servem para mostrar o quanto cada opção responde ao que importa para você.
        </p>
      </PatientCard>

      {observations.length > 0 ? (
        <PatientCard>
          <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">Também registramos</h2>
          <p className="patient-body mt-2 text-[var(--color-ink-muted)]">
            Coisas que você contou e que orientam o cuidado.
          </p>
          <ul className="mt-4 space-y-3 text-[var(--color-ink-muted)]">
            {observations.map((observation) => (
              <li key={observation} className="patient-body border-l-2 border-[var(--color-brand-sage)]/30 pl-4">
                {observation}
              </li>
            ))}
          </ul>
        </PatientCard>
      ) : null}

      {record.validacao ? (
        <p className="patient-body max-w-2xl text-sm text-[var(--color-ink-muted)]">
          Você confirmou este Perfil em{" "}
          {new Date(record.validacao.validatedAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
          , junto com {record.curatorName}. A partir daí ele passou a orientar toda a Curadoria.
        </p>
      ) : null}

      <WhatsappContact topics={["duvida", "curador"]} />
    </div>
  );
}
