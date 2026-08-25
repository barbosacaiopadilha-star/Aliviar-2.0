"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
  /**
   * Auditoria F-9 · o custo que a porta não dizia. Publicar com o Mapa vazio
   * é permitido — mas até aqui o custo só aparecia DEPOIS, na Mesa: colunas
   * inteiras de lacuna, avaliação travada, o Curador descobrindo na hora o
   * que o cadastro não colheu. Informação, nunca trava: a frase avisa e o
   * botão continua disponível.
   */
  mapaAviso: string | null;
  /**
   * ONDE ATENDE — ADR-088, achado SIM-08 da Curadoria simulada de 25/08.
   *
   * A coluna existia desde 27/07 e nenhuma tela a escrevia. Efeito na
   * operação: um Case que exige atendimento numa UF não conseguia avaliar
   * profissional nenhum — todos em "informação não localizada", para sempre.
   * Não é campo novo; é a tela que faltava.
   */
  careLocation: {
    states: string[];
    cities: string[];
    source: string | null;
    verified: boolean;
    verifiedAt: string | null;
  } | null;
  /** O custo dito na porta: sem UF, este perfil não atravessa Case com exigência de estado. */
  ondeAtendeAviso: string | null;
  verifyRegistrationAction: StatefulAction;
  savePracticeAreaAction: StatefulAction;
  saveCareLocationAction: StatefulAction;
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
  mapaAviso,
  careLocation,
  ondeAtendeAviso,
  verifyRegistrationAction,
  savePracticeAreaAction,
  saveCareLocationAction,
  publishAction,
}: PublicationPanelProps) {
  /**
   * ESPERAR A AÇÃO, DEPOIS ATUALIZAR — nesta ordem, sempre.
   *
   * `revalidatePath` limpa o cache do SERVIDOR e não obriga este cliente a
   * rebuscar. Sem nada aqui, a gravação acontecia e a tela continuava a
   * anterior: selo ausente, botão parado em "Aguarde…". Quem operava concluía
   * que tinha perdido o trabalho — e não tinha.
   *
   * A primeira tentativa foi `useActionState` com um `useEffect` observando o
   * sucesso para chamar `router.refresh()`. Melhorou, mas continuou
   * intermitente: o efeito corre depois do render, sem ordem garantida em
   * relação ao que a action fez. Medido em sonda: numa rodada o selo aparecia,
   * na seguinte não, com o servidor devolvendo o dado certo nas duas.
   *
   * Aqui a ação é aguardada e só então o cliente rebusca. É o mesmo padrão de
   * `botao-ciclo-do-profissional.tsx`, que foi o primeiro a parar de falhar —
   * e a mesma razão pela qual os links de etapa são `<a>` e não `<Link>`: nesta
   * aplicação, o que o servidor grava só chega à tela quando alguém manda
   * buscar de novo, e o "quando" precisa ser explícito.
   */
  const router = useRouter();
  const [registroState, setRegistroState] = useState<ActionResult | undefined>();
  const [areaState, setAreaState] = useState<ActionResult | undefined>();
  const [localState, setLocalState] = useState<ActionResult | undefined>();

  /**
   * ONDE ATENDE — CAMPOS CONTROLADOS, e o motivo é um defeito medido.
   *
   * `<form action={…}>` do React 19 RESETA os campos não-controlados depois
   * da ação — dê certo ou dê errado. Medido na tela em 25/08:
   *
   *   antes do envio:   careStates="SP, RJ" · careCities="Sao Paulo"
   *   depois da recusa: careStates=""       · careCities=""
   *
   * Ou seja: quem digita as UFs, as cidades e a fonte, esquece de marcar uma
   * coisa e leva o aviso, PERDE TUDO. Redigita, erra de novo, desiste — e a
   * ficha do profissional segue sem o dado que trava Case com exigência de
   * estado.
   *
   * O projeto já tem essa doutrina escrita em outro lugar ("erro preserva o
   * contexto: a escolha e a nota dela ficam onde estão"); aqui ela não valia.
   * Campo controlado sobrevive ao re-render, e é o que a corrige.
   */
  const [careStates, setCareStates] = useState(careLocation?.states.join(", ") ?? "");
  const [careCities, setCareCities] = useState(careLocation?.cities.join(", ") ?? "");
  const [careSource, setCareSource] = useState(careLocation?.source ?? "");
  const [careVerify, setCareVerify] = useState(careLocation?.verified ?? false);
  const [publishState, setPublishState] = useState<ActionResult | undefined>();
  const [registroPending, iniciarRegistro] = useTransition();
  const [areaPending, iniciarArea] = useTransition();
  const [localPending, iniciarLocal] = useTransition();
  const [publishPending, iniciarPublicacao] = useTransition();

  function executar(
    acao: StatefulAction,
    guardarEstado: (resultado: ActionResult) => void,
    iniciar: (fn: () => void) => void,
    /**
     * `recarregar` só para PUBLICAR.
     *
     * `router.refresh()` atualiza este painel de forma confiável, mas os selos
     * "Ativo / Publicado" vivem no CABEÇALHO — outro componente, renderizado no
     * servidor, irmão deste na página. Para eles o rebusco continuou
     * intermitente: em três execuções seguidas o selo apareceu em uma e faltou
     * em duas, com o servidor devolvendo o dado certo nas três.
     *
     * Publicar acontece UMA vez por profissional e decide se a pessoa passa a
     * ser vista por pacientes. Um cabeçalho que diz "Não publicado" depois de
     * publicar é pior do que um piscar de tela — este é o raro caso em que a
     * recarga inteira é a resposta honesta. Registro e área de atuação são
     * salvos muitas vezes seguidas e continuam sem recarregar.
     */
    recarregar = false,
  ) {
    return (formData: FormData) => {
      iniciar(async () => {
        const resultado = await acao(undefined, formData);
        guardarEstado(resultado);
        if (!resultado.success) return;
        if (recarregar) window.location.reload();
        else router.refresh();
      });
    };
  }

  const registroFormAction = executar(verifyRegistrationAction, setRegistroState, iniciarRegistro);
  const areaFormAction = executar(savePracticeAreaAction, setAreaState, iniciarArea);
  const localFormAction = executar(saveCareLocationAction, setLocalState, iniciarLocal);
  const publishFormAction = executar(publishAction, setPublishState, iniciarPublicacao, true);

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

      {/*
        ONDE ATENDE — ADR-088 (achado SIM-08).

        Fica ao lado da Área de Atuação de propósito: são os dois fatos que a
        Mesa confere antes de comparar qualquer coisa. Separado do `crm_uf` do
        Cadastro, também de propósito — aquele é o estado do REGISTRO no
        conselho, e um médico registrado em SP pode atender só na Bahia.
      */}
      <form action={localFormAction} className="space-y-3 border-t border-border pt-5">
        <p className="text-sm font-semibold text-ink">Onde atende</p>
        <p className="text-sm text-ink-muted">
          Os estados em que este profissional atende de fato — não o estado do registro no
          conselho, que é outro fato e já vive no Cadastro.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            name="careStates"
            type="text"
            label="UFs de atendimento (siglas separadas por vírgula)"
            value={careStates}
            onChange={(evento) => setCareStates(evento.target.value)}
            placeholder="ex.: SP, RJ"
          />
          <Input
            name="careCities"
            type="text"
            label="Cidades (opcional, separadas por vírgula)"
            value={careCities}
            onChange={(evento) => setCareCities(evento.target.value)}
            placeholder="ex.: São Paulo, Campinas"
          />
        </div>
        <Input
          name="careSource"
          type="text"
          label="Fonte"
          value={careSource}
          onChange={(evento) => setCareSource(evento.target.value)}
          placeholder="ex.: site institucional, entrevista"
        />
        <Checkbox
          name="careVerify"
          label="Marcar como verificada (exige fonte)"
          checked={careVerify}
          onChange={(evento) => setCareVerify(evento.target.checked)}
        />
        <p className="text-xs text-ink-muted">
          Sem verificação, o fato entra na Mesa como declaração do próprio profissional: aparece
          na comparação com essa origem à vista e <strong>não elimina ninguém</strong>. Verificado,
          ele passa a valer como filtro.
        </p>
        {ondeAtendeAviso ? (
          <p className="text-sm text-ink" role="status">
            {ondeAtendeAviso}
          </p>
        ) : null}
        {localState && !localState.success ? (
          <FormMessage variant="error">{localState.error}</FormMessage>
        ) : null}
        <SeloDeVerificacao
          rotulo="Onde atende salvo"
          feito={(careLocation?.states.length ?? 0) > 0}
          em={careLocation?.verifiedAt ?? null}
        />
        <Button type="submit" variant="secondary" isLoading={localPending}>
          Salvar onde atende
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
        {mapaAviso && !isPublished ? (
          <p className="rounded-md border border-[color-mix(in_srgb,var(--color-brand-gold)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-brand-gold)_8%,transparent)] px-3 py-2 text-sm text-ink">
            {mapaAviso}
          </p>
        ) : null}
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
