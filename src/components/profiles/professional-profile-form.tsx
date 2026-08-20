"use client";

import { useActionState, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { mapZodFieldErrors } from "@/components/forms/map-zod-field-errors";
import {
  professionalProfileSchema,
} from "@/modules/profiles/professional-schema";
import type { ActionResult } from "@/modules/profiles/types";

import { BRAZILIAN_STATES } from "./brazilian-states";

type ProfessionalProfileFormProps = {
  action: (prevState: ActionResult | undefined, formData: FormData) => Promise<ActionResult>;
  submitLabel: string;
  initialDisplayName?: string;
  initialProfessionalIdentifier?: string;
  initialCrm?: string;
  initialCrmUf?: string;
  initialProfessionalSummary?: string;
  initialInstitutionName?: string;
  initialExperienceLevel?: string;
  initialIntakeApproach?: string;
  initialOffersContinuousCare?: boolean | null;
  initialAvailabilityWindow?: string;
  initialCompetencyDomains?: string[];
};

export function ProfessionalProfileForm({
  action,
  submitLabel,
  initialDisplayName = "",
  initialProfessionalIdentifier = "",
  initialCrm = "",
  initialCrmUf = "",
  initialProfessionalSummary = "",
  initialInstitutionName = "",
}: ProfessionalProfileFormProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState<ActionResult | undefined, FormData>(
    action,
    undefined,
  );
  const router = useRouter();

  /**
   * A criação termina em outra tela — e é ESTE efeito que leva até lá.
   *
   * Antes, quem navegava era o `redirect()` do Next dentro da action. Ele
   * responde 303 com `x-action-redirect` e sem `Location`, e o cliente não
   * navegava: o profissional era criado, a tela ficava parada no formulário
   * sem mensagem nenhuma, e quem operava clicava de novo — criando duplicado.
   *
   * Ações que só salvam (edição) não devolvem destino e seguem exibindo
   * "Salvo com sucesso." aqui mesmo, sem sair da tela.
   */
  const destino = state?.success ? state.redirectTo : undefined;
  useEffect(() => {
    if (destino) router.push(destino);
  }, [destino, router]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsed = professionalProfileSchema.safeParse({
      displayName: formData.get("displayName"),
      professionalIdentifier: formData.get("professionalIdentifier"),
      crm: formData.get("crm"),
      crmUf: formData.get("crmUf"),
      professionalSummary: formData.get("professionalSummary"),
      institutionName: formData.get("institutionName"),
      experienceLevel: formData.get("experienceLevel"),
      intakeApproach: formData.get("intakeApproach"),
      offersContinuousCare: formData.get("offersContinuousCare"),
      availabilityWindow: formData.get("availabilityWindow"),
      competencyDomains: formData.getAll("competencyDomains"),
    });

    if (!parsed.success) {
      const erros = mapZodFieldErrors(parsed.error);
      setFieldErrors(erros);
      // Nenhum erro pode ser invisível: se a validação recusar um campo que a
      // tela não renderiza (foi assim que a criação "morreu sem mensagem" —
      // ADR-042 removeu campos do JSX e o schema continuou exigindo-os), a
      // recusa aparece como mensagem geral em vez de sumir.
      const camposRenderizados = new Set([
        "displayName",
        "professionalIdentifier",
        "crm",
        "crmUf",
        "professionalSummary",
        "institutionName",
      ]);
      const invisiveis = Object.keys(erros).filter((campo) => !camposRenderizados.has(campo));
      setFormError(
        invisiveis.length > 0
          ? `A validação recusou dados fora do formulário (${invisiveis.join(", ")}). Isto é um defeito — reporte à equipe.`
          : null,
      );
      return;
    }

    setFormError(null);
    setFieldErrors({});
    // SEM `startTransition` em volta. A dispatch de `useActionState` já roda
    // em transição própria; envolvê-la numa segunda deixava a transição
    // externa pendente para sempre — `isPending` ficava `true` e o estado
    // NUNCA era comitado. Na tela: o botão girava sem parar e nenhuma
    // mensagem aparecia, embora a gravação tivesse acontecido.
    formAction(formData);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Input
        name="displayName"
        type="text"
        label="Nome de exibição"
        defaultValue={initialDisplayName}
        required
        error={fieldErrors.displayName}
      />

      <Input
        name="professionalIdentifier"
        type="text"
        label="Identificação profissional"
        defaultValue={initialProfessionalIdentifier}
        required
        error={fieldErrors.professionalIdentifier}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
        <Input
          name="crm"
          type="text"
          label="CRM (quando aplicável)"
          defaultValue={initialCrm}
          error={fieldErrors.crm}
        />

        <FormField label="UF do CRM" htmlFor="crmUf" error={fieldErrors.crmUf}>
          <Select id="crmUf" name="crmUf" defaultValue={initialCrmUf} error={Boolean(fieldErrors.crmUf)}>
            <option value="">—</option>
            {BRAZILIAN_STATES.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <Input
        name="institutionName"
        type="text"
        label="Instituição (quando aplicável)"
        defaultValue={initialInstitutionName}
        error={fieldErrors.institutionName}
      />

      {/* A seção "Como este profissional atende" foi removida — ADR-042.
          Ela alimentava o motor de compatibilidade legado, que deixou de
          dirigir a Mesa. O que o Método pergunta sobre um profissional vive
          agora no Mapa do Profissional, sobre o mesmo catálogo canônico que
          o Case usa. Manter as duas seria pedir o mesmo dado duas vezes, em
          vocabulários diferentes. */}

      <FormField label="Resumo profissional" htmlFor="professionalSummary" error={fieldErrors.professionalSummary}>
        <Textarea
          id="professionalSummary"
          name="professionalSummary"
          defaultValue={initialProfessionalSummary}
          error={Boolean(fieldErrors.professionalSummary)}
        />
      </FormField>

      {formError ? <FormMessage variant="error">{formError}</FormMessage> : null}
      {state && !state.success ? <FormMessage variant="error">{state.error}</FormMessage> : null}
      {state?.success ? <FormMessage variant="success">Salvo com sucesso.</FormMessage> : null}

      <Button type="submit" isLoading={isPending} className="w-full sm:w-auto">
        {submitLabel}
      </Button>
    </form>
  );
}
