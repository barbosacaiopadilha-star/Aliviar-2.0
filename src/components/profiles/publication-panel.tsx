"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ActionResult } from "@/modules/profiles/types";
import type { PublicationPendency } from "@/modules/profiles/publication-pendencies";

type StatefulAction = (prevState: ActionResult | undefined, formData: FormData) => Promise<ActionResult>;

type PublicationPanelProps = {
  isPublished: boolean;
  pendencies: PublicationPendency[];
  registration: { status: string | null; source: string | null };
  practiceArea: { rawText: string; tags: string[]; source: string | null; verified: boolean } | null;
  verifyRegistrationAction: StatefulAction;
  savePracticeAreaAction: StatefulAction;
  publishAction: StatefulAction;
};

/**
 * A porta de publicação, visível (ETAPA 6 da Release de Reconstrução).
 *
 * O banco recusa publicação sem registro regular verificado e área de atuação
 * verificada — mas até aqui nenhuma superfície permitia cumprir essas
 * condições, e a recusa chegava como error boundary genérico. Este painel diz
 * o que falta, como corrigir, e oferece os dois blocos que faltavam.
 */
export function PublicationPanel({
  isPublished,
  pendencies,
  registration,
  practiceArea,
  verifyRegistrationAction,
  savePracticeAreaAction,
  publishAction,
}: PublicationPanelProps) {
  const [registroState, registroFormAction, registroPending] = useActionState(verifyRegistrationAction, undefined);
  const [areaState, areaFormAction, areaPending] = useActionState(savePracticeAreaAction, undefined);
  const [publishState, publishFormAction, publishPending] = useActionState(publishAction, undefined);

  return (
    <div className="space-y-6">
      {pendencies.length > 0 && !isPublished ? (
        <div className="rounded-md border border-border-strong bg-recessed p-4" role="status">
          <p className="text-sm font-semibold text-ink">
            Pendências para publicação ({pendencies.length})
          </p>
          <ul className="mt-2 space-y-2">
            {pendencies.map((pendency) => (
              <li key={pendency.code} className="text-sm text-ink">
                <span className="font-medium">{pendency.label}</span>
                <span className="block text-ink-muted">{pendency.howToFix}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <form action={registroFormAction} className="space-y-3">
        <p className="text-sm font-semibold text-ink">Verificação do registro no conselho</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Situação verificada" htmlFor="registrationStatus">
            <Select id="registrationStatus" name="registrationStatus" defaultValue={registration.status ?? ""}>
              <option value="">— ainda não verificado —</option>
              <option value="regular">Regular</option>
              <option value="irregular">Irregular</option>
              <option value="nao_localizado">Não localizado</option>
            </Select>
          </FormField>
          <Input
            name="registrationSource"
            type="text"
            label="Fonte da verificação"
            placeholder="ex.: portal do CFM, consulta em 02/08/2026"
            defaultValue={registration.source ?? ""}
          />
        </div>
        {registroState && !registroState.success ? (
          <FormMessage variant="error">{registroState.error}</FormMessage>
        ) : null}
        {registroState?.success ? <FormMessage variant="success">Verificação registrada.</FormMessage> : null}
        <Button type="submit" variant="secondary" isLoading={registroPending}>
          Registrar verificação
        </Button>
      </form>

      <form action={areaFormAction} className="space-y-3 border-t border-border pt-5">
        <p className="text-sm font-semibold text-ink">Área de Atuação</p>
        <Input
          name="practiceAreaText"
          type="text"
          label="Descrição (texto original, sempre preservado)"
          defaultValue={practiceArea?.rawText ?? ""}
          placeholder="ex.: Ortopedia — cirurgia de coluna e dor crônica"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            name="practiceAreaTags"
            type="text"
            label="Tags normalizadas (separadas por vírgula)"
            defaultValue={practiceArea?.tags.join(", ") ?? ""}
            placeholder="ex.: ortopedia, coluna, dor_cronica"
          />
          <Input
            name="practiceAreaSource"
            type="text"
            label="Fonte"
            defaultValue={practiceArea?.source ?? ""}
            placeholder="ex.: site institucional, entrevista"
          />
        </div>
        <Checkbox
          name="practiceAreaVerify"
          label="Marcar como verificada (exige fonte)"
          defaultChecked={practiceArea?.verified ?? false}
        />
        {areaState && !areaState.success ? <FormMessage variant="error">{areaState.error}</FormMessage> : null}
        {areaState?.success ? <FormMessage variant="success">Área de atuação salva.</FormMessage> : null}
        <Button type="submit" variant="secondary" isLoading={areaPending}>
          Salvar área de atuação
        </Button>
      </form>

      <form action={publishFormAction} className="space-y-3 border-t border-border pt-5">
        {publishState && !publishState.success ? (
          <FormMessage variant="error">{publishState.error}</FormMessage>
        ) : null}
        {publishState?.success ? (
          <FormMessage variant="success">Estado de publicação atualizado.</FormMessage>
        ) : null}
        <Button type="submit" isLoading={publishPending}>
          {isPublished ? "Despublicar" : "Publicar"}
        </Button>
      </form>
    </div>
  );
}
