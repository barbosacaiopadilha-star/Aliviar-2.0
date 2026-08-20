"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ActionResult } from "@/modules/profiles/types";
import type { PublicationPendency } from "@/modules/profiles/publication-pendencies";

type StatefulAction = (prevState: ActionResult | undefined, formData: FormData) => Promise<ActionResult>;

/**
 * A CONFIRMAÇÃO É O ESTADO, NÃO UM AVISO.
 *
 * Antes, cada gravação respondia com uma frase ("Verificação registrada.")
 * guardada na memória da tela. Quando a página se atualizava — e ela precisa
 * se atualizar, senão a lista de pendências continua mentindo —, a frase
 * sumia junto. Ficamos entre dado velho e confirmação que evapora.
 *
 * O selo desfaz o dilema: ele vem do servidor, com a data do próprio registro.
 * Se está na tela, está no banco. Não é uma afirmação sobre o passado que
 * ninguém pode conferir — é o dado, e ele sobrevive a qualquer atualização.
 */
function SeloDeVerificacao({
  rotulo,
  feito,
  em,
}: {
  rotulo: string;
  feito: boolean;
  em: string | null;
}) {
  if (!feito) return null;
  return (
    <p className="text-sm text-ink-muted" role="status">
      {rotulo}
      {em ? ` em ${new Date(em).toLocaleDateString("pt-BR")}` : ""}.
    </p>
  );
}

type PublicationPanelProps = {
  isPublished: boolean;
  pendencies: PublicationPendency[];
  registration: { status: string | null; source: string | null; verifiedAt: string | null };
  practiceArea: {
    rawText: string;
    tags: string[];
    source: string | null;
    verified: boolean;
    verifiedAt: string | null;
  } | null;
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

  /**
   * O `revalidatePath` das actions limpa o cache do SERVIDOR — não obriga este
   * cliente a rebuscar. Sem `router.refresh()`, a gravação acontecia e a tela
   * continuava a anterior: selo ausente, botão parado em "Aguarde…", e quem
   * operava concluía que tinha perdido o trabalho. Só recarregar a página
   * revelava que estava tudo salvo.
   *
   * Comprovado por sonda que consultou o Postgres direto: registro e área de
   * atuação gravados, tela intacta. E por instrumentação do middleware: o POST
   * da action chega e volta, e nenhuma requisição RSC é feita em seguida.
   */
  const router = useRouter();
  const houveSucesso =
    registroState?.success === true || areaState?.success === true || publishState?.success === true;
  useEffect(() => {
    if (houveSucesso) router.refresh();
  }, [houveSucesso, registroState, areaState, publishState, router]);

  // A régua é a mesma que a porta do banco usa (`assert_publication_requirements`,
  // desde 20260727071000). Aqui ela não é reimplementada: as pendências chegam
  // prontas de `listPublicationPendencies`, e a interface apenas obedece.
  const publicacaoBloqueada = !isPublished && pendencies.length > 0;

  return (
    <div className="space-y-6">
      {pendencies.length > 0 && !isPublished ? (
        <div id="pendencias-de-publicacao" className="rounded-md border border-border-strong bg-recessed p-4" role="status">
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
        <SeloDeVerificacao
          rotulo="Verificação registrada"
          feito={Boolean(registration.status) && Boolean(registration.source)}
          em={registration.verifiedAt}
        />
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
        <SeloDeVerificacao
          rotulo="Área de atuação salva"
          feito={Boolean(practiceArea?.rawText)}
          em={practiceArea?.verifiedAt ?? null}
        />
        <Button type="submit" variant="secondary" isLoading={areaPending}>
          Salvar área de atuação
        </Button>
      </form>

      <form action={publishFormAction} className="space-y-3 border-t border-border pt-5">
        {publishState && !publishState.success ? (
          <FormMessage variant="error">{publishState.error}</FormMessage>
        ) : null}
        {/* O estado de publicação já é dito pelo badge do cabeçalho e pelo
            rótulo do próprio botão ("Publicar" vira "Despublicar"). Uma frase
            a mais só repetia — e era a frase que sumia. */}
        {/*
          Publicar com pendência não é um erro a ser explicado depois: é um ato
          que não deveria ser oferecido. O botão fica indisponível de verdade —
          não só apagado —, e `aria-describedby` aponta para a lista de
          pendências, de modo que quem usa leitor de tela ouça POR QUE está
          indisponível, em vez de encontrar um botão mudo.

          Despublicar nunca é bloqueado: tirar da vitrine é sempre possível.
        */}
        <Button
          type="submit"
          isLoading={publishPending}
          disabled={publicacaoBloqueada}
          aria-describedby={publicacaoBloqueada ? "pendencias-de-publicacao" : undefined}
        >
          {isPublished ? "Despublicar" : "Publicar"}
        </Button>
        {publicacaoBloqueada ? (
          <p className="text-sm text-ink-muted">
            {pendencies.length === 1
              ? "Falta uma condição para publicar. Ela está descrita acima."
              : `Faltam ${pendencies.length} condições para publicar. Elas estão descritas acima.`}
          </p>
        ) : null}
      </form>
    </div>
  );
}
