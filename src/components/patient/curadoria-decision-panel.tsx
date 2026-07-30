"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Radio } from "@/components/ui/radio";
import { Textarea } from "@/components/ui/textarea";
import { registerDecisionAction } from "@/modules/curadoria/actions";

/**
 * A decisão — o único ato desta jornada que é só do paciente.
 *
 * @metodo Ontologia §3.14 — “nenhuma destas” significa que alguma etapa anterior não capturou algo, nunca falha do paciente
 * @metodo Experience §2.6 — os oito vetores de indução ficam fechados
 * @metodo Fundamentos §13 — P14: nem o algoritmo nem a Aliviar escolhem
 *
 * Por que existe: `registerDecisionAction` estava pronta, com guarda de papel
 * `paciente` e RLS que só aceita a própria pessoa — e não tinha nenhuma
 * superfície. A decisão da pessoa sobre o próprio tratamento só podia ser
 * gravada por fora do produto, o que é o oposto exato do Método.
 *
 * O que NUNCA faz: destacar uma opção, ordenar por preferência, marcar padrão,
 * sugerir prazo, ou tratar “nenhuma destas” como caminho secundário — ela tem
 * o mesmo peso visual das outras, porque é uma resposta legítima.
 */

type Opcao = { id: string; professionalName: string };

export function CuradoriaDecisionPanel({
  curatedSelectionId,
  options,
  decided,
}: {
  curatedSelectionId: string;
  /** Na ordem de apresentação em que o Curador as escreveu. */
  options: Opcao[];
  decided: { outcome: "CHOSEN" | "NONE_OF_THEM"; chosenName: string | null; decidedAt: string } | null;
}) {
  const router = useRouter();
  const [escolha, setEscolha] = useState<string>("");
  const [nota, setNota] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (decided) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sua decisão está registrada</CardTitle>
          <CardDescription>
            {new Date(decided.decidedAt).toLocaleDateString("pt-BR")}
          </CardDescription>
        </CardHeader>
        <p className="max-w-reading text-sm leading-relaxed text-ink">
          {decided.outcome === "CHOSEN"
            ? `Você escolheu ${decided.chosenName ?? "um dos caminhos"}. A partir daqui, cuidamos do agendamento e seguimos com você.`
            : "Você registrou que nenhuma das três serviu. Isso não é uma falha sua — significa que algo importante para você não foi capturado, e vamos entender o quê."}
        </p>
      </Card>
    );
  }

  function registrar() {
    if (!escolha) return;
    setErro(null);
    startTransition(async () => {
      const nenhuma = escolha === "NENHUMA";
      const result = await registerDecisionAction({
        curatedSelectionId,
        outcome: nenhuma ? "NONE_OF_THEM" : "CHOSEN",
        chosenOptionId: nenhuma ? undefined : escolha,
        note: nota.trim() || undefined,
      });
      if (result.success) router.refresh();
      else setErro(result.error ?? "Não foi possível registrar sua decisão.");
    });
  }

  return (
    <Card className="space-y-5">
      <CardHeader>
        <CardTitle>Sua decisão</CardTitle>
        <CardDescription>
          Os três caminhos são legítimos e não há ordem de preferência entre eles. Não existe prazo —
          registre quando você estiver pronta.
        </CardDescription>
      </CardHeader>

      <fieldset className="space-y-0.5">
        <legend className="sr-only">Escolha um caminho, ou registre que nenhum serviu</legend>
        {options.map((option) => (
          <Radio
            key={option.id}
            id={`decisao-${option.id}`}
            name="decisao"
            value={option.id}
            checked={escolha === option.id}
            onChange={() => setEscolha(option.id)}
            label={option.professionalName}
            disabled={pending}
          />
        ))}
        {/* Mesmo peso visual das outras: recusar é uma resposta, não um desvio. */}
        <Radio
          id="decisao-nenhuma"
          name="decisao"
          value="NENHUMA"
          checked={escolha === "NENHUMA"}
          onChange={() => setEscolha("NENHUMA")}
          label="Nenhuma destas serviu para mim"
          disabled={pending}
        />
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor="decisao-nota" className="block text-sm font-medium text-ink">
          Quer contar o que pesou na sua escolha? (opcional)
        </label>
        <Textarea
          id="decisao-nota"
          rows={3}
          maxLength={2000}
          value={nota}
          disabled={pending}
          onChange={(event) => setNota(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={registrar} disabled={pending || !escolha} isLoading={pending}>
          {pending ? "Registrando…" : "Registrar minha decisão"}
        </Button>
        {erro ? (
          <span role="alert" className="text-sm text-error">
            {erro}
          </span>
        ) : null}
      </div>
    </Card>
  );
}
