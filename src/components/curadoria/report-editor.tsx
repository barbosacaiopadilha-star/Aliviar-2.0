"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import {
  deliverSelectionAction,
  emitReportAction,
  generateAssistedDraftAction,
  saveReportAction,
} from "@/modules/curadoria/actions";

/**
 * O Relatório — escrever, revisar, emitir e entregar, num ambiente só.
 *
 * @metodo Ontologia §3.12 — o Relatório nunca contém score interno nem linguagem de ranking
 * @metodo Ontologia §3.13 — a ordem é de apresentação, nunca colocação
 * @metodo Experience §2.5 — toda opção diz o que custa; assimetria de entusiasmo é indução
 * @metodo Engine §4.6 — as justificativas são escritas pelo Curador, nunca pelo Motor
 *
 * Por que existe: as tabelas do Relatório existiam no banco, com RLS, e nada no
 * produto escrevia nelas — a fase era inalcançável por qualquer caminho que não
 * fosse SQL. O rascunho agora nasce na Mesa, junto da comparação que o
 * fundamenta, e é aqui que ele é lido com calma, corrigido e entregue.
 *
 * O que nunca faz: escrever por ninguém. Os títulos e a ordem dos campos são
 * estrutura sugerida; toda frase é do Curador. E nunca entrega sem confirmação
 * — depois de entregue, o documento é o que o paciente tem nas mãos.
 */

export type ReportOptionDraft = {
  professionalProfileId: string;
  professionalName: string;
  justification: string;
  relationToWeights: string;
  attentionPoints: string;
  suggestedQuestions: string;
  curatorObservations: string;
};

type Props = {
  priorityProfileId: string;
  curatedSelectionId: string;
  patientFirstName: string;
  initialOptions: ReportOptionDraft[];
  initialComposition: string;
  emittedAt: string | null;
  deliveredAt: string | null;
  /** Quando o rascunho assistido foi gerado — null se o texto nasceu humano. */
  assistedGeneratedAt?: string | null;
  /** Para onde ir depois de entregar. */
  nextStepHref: string;
};

const CAMPOS: {
  field: keyof Omit<ReportOptionDraft, "professionalProfileId" | "professionalName">;
  title: string;
  guidance: string;
  required: boolean;
}[] = [
  {
    field: "justification",
    title: "Por que esta opção está aqui",
    guidance: "Nomeie o critério dela que esta opção responde. Precisa poder ser lido em voz alta.",
    required: true,
  },
  {
    field: "relationToWeights",
    title: "Relação com as prioridades dela",
    // M4: o rótulo visível fala prioridades — a coluna `relation_to_weights`
    // permanece como armazenamento histórico (renomeá-la é decisão futura).
    guidance: "Como esta opção conversa com as prioridades que ela reconheceu como suas.",
    required: true,
  },
  {
    field: "attentionPoints",
    title: "O que esta opção custa",
    guidance: "Obrigatório. Opção só com virtudes não é opção — é recomendação disfarçada.",
    required: true,
  },
  {
    field: "suggestedQuestions",
    title: "Perguntas para a primeira consulta",
    guidance: "O que vale ela perguntar nesse encontro.",
    required: false,
  },
  {
    field: "curatorObservations",
    title: "Suas observações",
    guidance: "O que mais você quer que fique registrado, com sua autoria.",
    required: false,
  },
];

export function ReportEditor({
  priorityProfileId,
  curatedSelectionId,
  patientFirstName,
  initialOptions,
  initialComposition,
  emittedAt,
  deliveredAt,
  assistedGeneratedAt = null,
  nextStepHref,
}: Props) {
  const router = useRouter();
  const [options, setOptions] = useState(initialOptions);
  const [composition, setComposition] = useState(initialComposition);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [confirmandoEntrega, setConfirmandoEntrega] = useState(false);
  const [pending, startTransition] = useTransition();

  const entregue = Boolean(deliveredAt);
  const emitido = Boolean(emittedAt);

  const faltando = options.flatMap((option) =>
    CAMPOS.filter((campo) => campo.required && !option[campo.field].trim()).map(
      (campo) => `${option.professionalName}: falta “${campo.title.toLowerCase()}”.`,
    ),
  );
  if (!composition.trim()) {
    faltando.push("Falta explicar por que estas três, juntas, servem a esta pessoa.");
  }

  function atualizar(
    id: string,
    field: keyof Omit<ReportOptionDraft, "professionalProfileId" | "professionalName">,
    value: string,
  ) {
    setOptions((atual) =>
      atual.map((option) =>
        option.professionalProfileId === id ? { ...option, [field]: value } : option,
      ),
    );
  }

  function payload() {
    return {
      priorityProfileId,
      compositionRationale: composition,
      options: options.map((option) => ({
        professionalProfileId: option.professionalProfileId,
        justification: option.justification,
        relationToWeights: option.relationToWeights,
        attentionPoints: [option.attentionPoints].filter((entry) => entry.trim()),
        favorablePoints: [],
        suggestedQuestions: [option.suggestedQuestions].filter((entry) => entry.trim()),
        curatorObservations: option.curatorObservations.trim() || null,
      })),
    };
  }

  function salvar() {
    setErro(null);
    setAviso(null);
    startTransition(async () => {
      const result = await saveReportAction(payload());
      if (result.success) {
        setAviso("Relatório salvo. Você pode continuar revisando.");
        router.refresh();
      } else {
        setErro(result.error ?? "Não foi possível salvar o Relatório.");
      }
    });
  }

  function emitir() {
    setErro(null);
    setAviso(null);
    startTransition(async () => {
      // Salvar antes de emitir: emitir o que está na tela, nunca uma versão
      // anterior que o Curador acha que já corrigiu.
      const saved = await saveReportAction(payload());
      if (!saved.success) {
        setErro(saved.error ?? "Não foi possível salvar o Relatório.");
        return;
      }
      const result = await emitReportAction({ priorityProfileId });
      if (result.success) {
        setAviso("Relatório emitido. Agora combine a conversa para apresentá-lo.");
        router.refresh();
      } else {
        setErro(result.error ?? "Não foi possível emitir o Relatório.");
      }
    });
  }

  function gerarRascunho(force: boolean) {
    setErro(null);
    setAviso(null);
    startTransition(async () => {
      const result = await generateAssistedDraftAction({ priorityProfileId, force });
      if (result.success) {
        setAviso(
          "Rascunho assistido gerado a partir do que já foi declarado e verificado. Cada frase tem origem registrada — revise, corrija e assuma a versão final.",
        );
        router.refresh();
      } else {
        setErro(result.error ?? "Não foi possível gerar o rascunho assistido.");
      }
    });
  }

  function entregar() {
    setErro(null);
    setAviso(null);
    startTransition(async () => {
      const result = await deliverSelectionAction({ curatedSelectionId });
      if (result.success) {
        setConfirmandoEntrega(false);
        router.refresh();
      } else {
        setErro(result.error ?? "Não foi possível entregar a Curadoria.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>O documento que {patientFirstName} vai reler sozinha</CardTitle>
          <CardDescription>
            {entregue
              ? "Já entregue. O que está aqui é exatamente o que ela recebeu — por isso não muda mais."
              : assistedGeneratedAt
                ? "Rascunho assistido: o texto abaixo foi montado a partir das suas declarações e das evidências registradas — nada foi presumido. A versão final é sua: revise, corrija e emita."
                : "O rascunho veio da Mesa, com o que você já escreveu lá. Leia com calma e corrija o que precisar."}
          </CardDescription>
        </CardHeader>

        {!emitido ? (
          <div className="mt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => gerarRascunho(false)}
            >
              Gerar rascunho assistido
            </Button>
            <p className="mt-1 text-xs text-ink-muted">
              Determinístico, sem IA: transforma o que você já declarou na Mesa em texto organizado.
              Nunca sobrescreve o que você editou sem pedir.
            </p>
            {erro?.includes("Regenerar substituiria o texto") ? (
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => gerarRascunho(true)}
                className="mt-2"
              >
                Regenerar mesmo assim, descartando minhas edições
              </Button>
            ) : null}
          </div>
        ) : null}
      </Card>

      {options.map((option, index) => (
        <Card key={option.professionalProfileId} className="space-y-5">
          <CardHeader>
            <CardTitle>{option.professionalName}</CardTitle>
            <CardDescription>
              Opção {index + 1} de {options.length} — ordem de apresentação, nunca colocação.
            </CardDescription>
          </CardHeader>

          {CAMPOS.map((campo) => (
            <div key={campo.field} className="space-y-1.5">
              <label
                htmlFor={`${campo.field}-${option.professionalProfileId}`}
                className="block text-sm font-medium text-ink"
              >
                {campo.title}
                {campo.required ? null : (
                  <span className="ml-2 text-xs font-normal text-ink-muted">opcional</span>
                )}
              </label>
              <p className="text-xs leading-relaxed text-ink-muted">{campo.guidance}</p>
              <textarea
                id={`${campo.field}-${option.professionalProfileId}`}
                value={option[campo.field]}
                disabled={entregue || pending}
                rows={3}
                onChange={(event) =>
                  atualizar(option.professionalProfileId, campo.field, event.target.value)
                }
                className={cn(
                  "w-full rounded-sm border bg-surface px-3 py-2 text-sm leading-relaxed text-ink",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
                  "transition-colors duration-fast ease-standard disabled:cursor-not-allowed disabled:opacity-70",
                  campo.required && !option[campo.field].trim()
                    ? "border-brand-gold/50"
                    : "border-border",
                )}
              />
            </div>
          ))}
        </Card>
      ))}

      <Card className="space-y-3">
        <CardHeader>
          <CardTitle>Por que estas três, juntas</CardTitle>
          <CardDescription>
            O que diferencia os caminhos entre si, para que {patientFirstName} escolha qual troca faz
            sentido para ela.
          </CardDescription>
        </CardHeader>
        <textarea
          aria-label="Justificativa da composição"
          value={composition}
          disabled={entregue || pending}
          rows={4}
          onChange={(event) => setComposition(event.target.value)}
          className={cn(
            "w-full rounded-sm border bg-surface px-3 py-2 text-sm leading-relaxed text-ink",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
            "transition-colors duration-fast ease-standard disabled:cursor-not-allowed disabled:opacity-70",
            composition.trim() ? "border-border" : "border-brand-gold/50",
          )}
        />
      </Card>

      {/* SALVAR · EMITIR · ENTREGAR — três atos distintos, nunca um só botão. */}
      <Card className={cn("space-y-4", faltando.length === 0 && !entregue && "border-brand-sage/50")}>
        <CardHeader>
          <CardTitle>
            {entregue
              ? "Curadoria entregue"
              : emitido
                ? "Relatório emitido — pronto para entregar"
                : "Fechar o Relatório"}
          </CardTitle>
          <CardDescription>
            {entregue
              ? `${patientFirstName} já tem acesso ao documento. A decisão é dela, no tempo dela.`
              : emitido
                ? "Entregar libera o documento para ela ler. Faça isso junto da conversa em que você apresenta as opções — nunca antes."
                : "Emitir é você dizer que está pronto. Entregar é ela receber. São atos separados de propósito."}
          </CardDescription>
        </CardHeader>

        {entregue ? (
          <a
            href={nextStepHref}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors duration-fast ease-standard hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Registrar a apresentação
            <span aria-hidden="true">→</span>
          </a>
        ) : faltando.length > 0 ? (
          <div>
            <p className="text-sm text-ink">Antes de emitir:</p>
            <ul className="mt-1.5 space-y-1">
              {faltando.map((item) => (
                <li key={item} className="text-sm text-ink-muted">
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <Button type="button" variant="secondary" onClick={salvar} disabled={pending} isLoading={pending}>
                {pending ? "Salvando…" : "Salvar rascunho"}
              </Button>
            </div>
          </div>
        ) : confirmandoEntrega ? (
          <div className="space-y-3">
            <p className="max-w-reading text-sm leading-relaxed text-ink">
              Ao entregar, {patientFirstName} passa a ver as três opções e tudo o que você escreveu
              sobre cada uma. Depois disso o documento não muda mais. Confirma?
            </p>
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={entregar} disabled={pending} isLoading={pending}>
                {pending ? "Entregando…" : `Entregar a Curadoria a ${patientFirstName}`}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmandoEntrega(false)}
                disabled={pending}
              >
                Ainda não
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="secondary" onClick={salvar} disabled={pending}>
              Salvar rascunho
            </Button>
            {emitido ? (
              <Button type="button" onClick={() => setConfirmandoEntrega(true)} disabled={pending}>
                Entregar a Curadoria
              </Button>
            ) : (
              <Button type="button" onClick={emitir} disabled={pending} isLoading={pending}>
                {pending ? "Emitindo…" : "Emitir o Relatório"}
              </Button>
            )}
          </div>
        )}

        {aviso ? (
          <p role="status" className="text-sm text-ink-muted">
            {aviso}
          </p>
        ) : null}
        {erro ? (
          <p role="alert" className="rounded-md border border-error bg-error-surface px-3 py-2 text-sm text-ink">
            {erro}
          </p>
        ) : null}
      </Card>
    </div>
  );
}
