import { Compass, HeartHandshake, MessageCircleHeart } from "lucide-react";
import Link from "next/link";

import { Card, CardHeader } from "@/components/ui/card";
import { LinkButton } from "@/components/landing/link-button";

type CurationStatusCardProps = {
  // Quando existe um Caso (ÉPICO 1/SPRINT 2), mostramos o status real,
  // traduzido (nunca o enum bruto — a tradução já vem pronta da view
  // patient_case_overview). Sem Caso ainda, o estado de espera explicado
  // permanece — nunca "nenhum caso encontrado".
  caseStatusLabel?: string | null;
};

export function CurationStatusCard({ caseStatusLabel }: CurationStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-sans text-lg font-semibold text-ink">Status da sua curadoria</h2>
      </CardHeader>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <span
          aria-hidden="true"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-sage-light/40 text-brand-primary-deep"
        >
          <HeartHandshake className="size-5" aria-hidden="true" />
        </span>
        <div className="space-y-2">
          {caseStatusLabel ? (
            <p className="text-sm text-ink">{caseStatusLabel}</p>
          ) : (
            <>
              <p className="text-sm text-ink">
                Você ainda não começou sua jornada de curadoria com a Aliviar. Quando quiser, conte
                a sua história — nossa equipe organiza o restante e te acompanha em cada etapa,
                sem pressa.
              </p>
              <LinkButton href="/sua-historia" variant="secondary">
                Contar minha história
              </LinkButton>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

type NextStepsCardProps = {
  hasProfileData: boolean;
  hasDocuments: boolean;
};

export function NextStepsCard({ hasProfileData, hasDocuments }: NextStepsCardProps) {
  const steps: { label: string; href: string }[] = [];

  if (!hasProfileData) {
    steps.push({ label: "Complete seus dados de contato no seu perfil", href: "/paciente/perfil" });
  }

  steps.push({ label: "Conte sua história para iniciar sua curadoria", href: "/sua-historia" });

  if (!hasDocuments) {
    steps.push({
      label: "Envie documentos que possam ajudar sua curadoria, se tiver",
      href: "/paciente/documentos",
    });
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-sans text-lg font-semibold text-ink">Próximos passos</h2>
      </CardHeader>
      <ul className="space-y-3">
        {steps.map((step) => (
          <li key={step.href}>
            <Link
              href={step.href}
              className="flex items-center gap-2 text-sm font-medium text-brand-primary hover:text-brand-primary-deep"
            >
              <Compass className="size-4 shrink-0" aria-hidden="true" />
              {step.label}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

const INSTITUTIONAL_MESSAGES = [
  {
    title: "Você nunca está sozinho aqui",
    body: "Em cada etapa da sua jornada com a Aliviar, existe uma pessoa acompanhando — a tecnologia só apoia, nunca substitui esse cuidado.",
  },
  {
    title: "No seu tempo",
    body: "Não existe pressa nem prazo forçado. Você avança quando fizer sentido para você.",
  },
] as const;

export function InstitutionalMessages() {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-sans text-lg font-semibold text-ink">Mensagens da Aliviar</h2>
      </CardHeader>
      <ul className="space-y-4">
        {INSTITUTIONAL_MESSAGES.map((message) => (
          <li key={message.title} className="flex gap-3">
            <MessageCircleHeart className="size-5 shrink-0 text-brand-sage" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-ink">{message.title}</p>
              <p className="mt-0.5 text-sm text-ink-muted">{message.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
