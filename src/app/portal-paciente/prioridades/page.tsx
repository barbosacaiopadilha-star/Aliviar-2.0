import type { Metadata } from "next";

import { EvidenceCard } from "@/components/curadoria/evidence-card";
import { WhatsappContact } from "@/components/curadoria/whatsapp-contact";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PERFIL_MESSAGE } from "@/modules/curadoria/jornada";
import { findRecord } from "@/modules/curadoria/cos/mock-records";
import { PRIORITY_CRITERION_LABELS } from "@/modules/curadoria/types";

export const metadata: Metadata = { title: "Minhas prioridades" };

// TELA 2 — MEU PERFIL DE PRIORIDADES
//
// Qual pergunta esta tela responde?
//   "O que exatamente eu disse que importava, e como isso foi registrado?"
//
// É o mesmo Perfil que o Curador vê — sem simplificação, sem resumo. A
// diferença entre as duas telas é zero (Experiência §6: não existe "versão do
// paciente" de um artefato compartilhado).
//
// Mostrar os pesos aumenta credibilidade porque cada um vem com a fala que o
// originou: o paciente não vê um número do sistema, vê a si mesmo
// (Experiência §Momento 4).

const DEMO_CASE_ID = "caso-2024";

export default function MinhasPrioridadesPage() {
  const record = findRecord(DEMO_CASE_ID)!;
  const { weights, observations } = record.prioridades;
  const total = weights.reduce((sum, weight) => sum + weight.weight, 0);

  return (
    <div className="space-y-8">
      <header className="max-w-reading space-y-2">
        <h1 className="font-serif text-3xl text-ink">Suas prioridades</h1>
        <p className="text-base leading-relaxed text-ink-muted">{PERFIL_MESSAGE}</p>
      </header>

      <Card padding="lg" className="space-y-6">
        <ul className="space-y-6">
          {weights.map((weight) => (
            <li key={weight.criterion}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-sans text-base font-medium text-ink">
                  {PRIORITY_CRITERION_LABELS[weight.criterion]}
                </h2>
                <p className="tabular-nums font-serif text-2xl font-semibold text-brand-primary-deep">
                  {weight.weight}
                  <span className="ml-1 font-sans text-xs font-normal text-ink-muted">
                    {weight.weight === 1 ? "ponto" : "pontos"}
                  </span>
                </p>
              </div>
              <div
                aria-hidden="true"
                className="mt-2 h-2 overflow-hidden rounded-full bg-canvas"
              >
                <div
                  className="h-full rounded-full bg-brand-sage"
                  style={{ width: `${weight.weight}%` }}
                />
              </div>
              <EvidenceCard evidence={weight.evidence} className="mt-2.5" />
            </li>
          ))}
        </ul>

        <div className="flex items-baseline justify-between gap-3 border-t border-border pt-4">
          <span className="font-sans text-sm font-medium text-ink">Total</span>
          <span className="tabular-nums font-serif text-xl font-semibold text-ink">{total}</span>
        </div>
      </Card>

      {/* A frase que impede a leitura errada mais provável desta tela. */}
      <Card className="border-brand-gold/40">
        <p className="max-w-reading text-sm leading-relaxed text-ink">
          Estes pesos representam apenas a importância que{" "}
          <strong className="font-medium">você</strong> atribuiu a cada critério durante nossa
          conversa. Eles nunca representam nota de médico — nenhum profissional é avaliado por
          eles. Servem para comparar o quanto cada opção responde ao que importa para você.
        </p>
      </Card>

      {observations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Também registramos</CardTitle>
            <CardDescription>Coisas que você contou e que orientam o cuidado.</CardDescription>
          </CardHeader>
          <ul className="space-y-2 text-sm leading-relaxed text-ink-muted">
            {observations.map((observation) => (
              <li key={observation}>{observation}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      {record.validacao ? (
        <p className="max-w-reading text-sm text-ink-muted">
          Você validou este Perfil em{" "}
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
