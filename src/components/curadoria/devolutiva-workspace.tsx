"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { registerDevolutivaAction } from "@/modules/curadoria/actions";

/**
 * A Devolutiva — registrar o encontro em que as opções foram apresentadas.
 *
 * @metodo Experience §2.5 — a entrega é sempre humana, nunca uma notificação com anexo
 * @metodo Experience §2.6 — os oito vetores de indução ficam fechados; a decisão é do paciente
 * @metodo Ontologia §3.14 — “nenhuma destas” é desfecho legítimo, nunca falha do paciente
 *
 * Por que existe: `devolutiva_records` existia no banco, com RLS de escrita
 * para o Curador, e nenhuma linha de código escrevia nela. O encontro — as
 * dúvidas que a pessoa trouxe, o que o Curador observou, o que ficou combinado
 * — não tinha onde ser registrado, e sem esse registro a Curadoria não podia
 * ser reconstruída meses depois.
 *
 * O que NUNCA faz: registrar a decisão dela. A decisão é ato do paciente, e a
 * RLS de `patient_curadoria_decisions` só aceita a própria pessoa — o Curador
 * acompanha, nunca decide em nome de ninguém. E nenhum prazo é imposto.
 */

function linhas(texto: string): string[] {
  return texto
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean);
}

export function DevolutivaWorkspace({
  priorityProfileId,
  patientFirstName,
  presentedAt,
  initial,
}: {
  priorityProfileId: string;
  patientFirstName: string;
  presentedAt: string | null;
  initial: { patientQuestions: string[]; observations: string[]; nextSteps: string[] };
}) {
  const router = useRouter();
  const [duvidas, setDuvidas] = useState(initial.patientQuestions.join("\n"));
  const [observacoes, setObservacoes] = useState(initial.observations.join("\n"));
  const [combinado, setCombinado] = useState(initial.nextSteps.join("\n"));
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const registrado = Boolean(presentedAt);

  function registrar() {
    setErro(null);
    setAviso(null);
    startTransition(async () => {
      const result = await registerDevolutivaAction({
        priorityProfileId,
        patientQuestions: linhas(duvidas),
        observations: linhas(observacoes),
        nextSteps: linhas(combinado),
      });
      if (result.success) {
        setAviso(
          registrado
            ? "Registro atualizado."
            : `Apresentação registrada. Agora é o tempo de ${patientFirstName} — a decisão é dela, sem prazo.`,
        );
        router.refresh();
      } else {
        setErro(result.error ?? "Não foi possível registrar a apresentação.");
      }
    });
  }

  return (
    <Card className="space-y-5">
      <CardHeader>
        <CardTitle>Registrar a apresentação</CardTitle>
        <CardDescription>
          {registrado
            ? `Encontro registrado em ${new Date(presentedAt!).toLocaleDateString("pt-BR")}. Você pode complementar o que lembrar depois.`
            : `Depois de apresentar as três opções a ${patientFirstName}, registre o que aconteceu no encontro. Uma linha por item.`}
        </CardDescription>
      </CardHeader>

      <div className="space-y-1.5">
        <label htmlFor="devolutiva-duvidas" className="block text-sm font-medium text-ink">
          Dúvidas que {patientFirstName} trouxe
        </label>
        <p className="text-xs text-ink-muted">
          As perguntas dela, como ela fez. Uma lacuna aqui vira melhoria da próxima Curadoria.
        </p>
        <Textarea
          id="devolutiva-duvidas"
          rows={3}
          value={duvidas}
          disabled={pending}
          onChange={(event) => setDuvidas(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="devolutiva-observacoes" className="block text-sm font-medium text-ink">
          O que você observou
        </label>
        <p className="text-xs text-ink-muted">
          Sobre a conversa e a situação — nunca sobre como ela é.
        </p>
        <Textarea
          id="devolutiva-observacoes"
          rows={3}
          value={observacoes}
          disabled={pending}
          onChange={(event) => setObservacoes(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="devolutiva-combinado" className="block text-sm font-medium text-ink">
          O que ficou combinado
        </label>
        <p className="text-xs text-ink-muted">
          Sem prazo imposto: “ela vai conversar com a filha” é um combinado legítimo.
        </p>
        <Textarea
          id="devolutiva-combinado"
          rows={3}
          value={combinado}
          disabled={pending}
          onChange={(event) => setCombinado(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <Button type="button" onClick={registrar} disabled={pending} isLoading={pending}>
          {pending ? "Registrando…" : registrado ? "Atualizar o registro" : "Registrar a apresentação"}
        </Button>
        {aviso ? (
          <span role="status" className="text-sm text-ink-muted">
            {aviso}
          </span>
        ) : null}
        {erro ? (
          <span role="alert" className="text-sm text-error">
            {erro}
          </span>
        ) : null}
      </div>
    </Card>
  );
}
