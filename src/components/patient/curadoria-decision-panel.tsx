"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Radio } from "@/components/ui/radio";
import { Textarea } from "@/components/ui/textarea";
import { whatsappHref } from "@/components/curadoria/whatsapp-contact";
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
  const [pending, setPending] = useState(false);
  const [registrado, setRegistrado] = useState(false);
  const focoDaConfirmacao = useRef<HTMLDivElement>(null);

  // O foco vai para a confirmação: quem navega por teclado ou leitor de tela
  // não fica com o foco num botão que deixou de existir.
  useEffect(() => {
    if (registrado) focoDaConfirmacao.current?.focus();
  }, [registrado]);

  // ESTADO DURÁVEL — controlado pelo FATO persistido, nunca por estado React.
  // Sobrevive a refresh, reload, nova montagem e nova sessão, porque a
  // projeção da página é quem o alimenta.
  if (decided) {
    return (
      <Card className="space-y-4">
        <CardHeader>
          <CardTitle>Sua decisão está registrada.</CardTitle>
          <CardDescription>
            {new Date(decided.decidedAt).toLocaleDateString("pt-BR")}
          </CardDescription>
        </CardHeader>

        {/* Qual decisão foi registrada — com o dado que a projeção já traz. */}
        <p className="max-w-reading text-sm leading-relaxed text-ink">
          {decided.outcome === "CHOSEN"
            ? `Você escolheu ${decided.chosenName ?? "um dos caminhos"}.`
            : "Você registrou que nenhuma das três serviu. Isso não é uma falha sua — significa que algo importante para você não foi capturado, e vamos entender o quê."}
        </p>

        {/* O handoff dito em uma frase: muda quem acompanha, não termina o
            serviço. "Equipe Aliviar" é fallback institucional — não existe
            identidade persistida de Concierge, e inventar uma seria pior. */}
        <p className="max-w-reading text-sm leading-relaxed text-ink">
          Com sua decisão registrada, a próxima etapa passa a ser acompanhada pela Equipe Aliviar.
        </p>
        <p className="max-w-reading text-sm leading-relaxed text-ink-muted">
          Você continua podendo consultar sua Curadoria sempre que precisar.
        </p>

        {/* Canal REAL já configurado no produto (MISSÃO 205), reutilizado —
            nenhum número novo, nenhuma integração nova. */}
        <p>
          <a
            href={whatsappHref("duvida")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center text-sm font-medium text-[var(--patient-acento)] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            Falar com a Aliviar
          </a>
        </p>
      </Card>
    );
  }

  // FEEDBACK IMEDIATO — a ponte entre o sucesso da action e a chegada do fato
  // pela projeção. É transitório de propósito, e NÃO é a fonte da verdade:
  // o `decided` acima é. Sem ele, o `router.refresh()` sozinho fazia o
  // formulário voltar ao início como se nada tivesse acontecido.
  if (registrado) {
    return (
      <Card className="space-y-3">
        <div ref={focoDaConfirmacao} tabIndex={-1} role="status" aria-live="polite">
          <CardTitle>Sua decisão foi registrada.</CardTitle>
          <p className="mt-2 max-w-reading text-sm leading-relaxed text-ink">
            Agora a Aliviar pode seguir com os próximos passos.
          </p>
        </div>
      </Card>
    );
  }

  /**
   * Handler assíncrono comum, e não `startTransition`.
   *
   * A versão anterior envolvia o await numa transition e chamava
   * `setRegistrado` depois dele — atualização de estado posterior ao await,
   * dentro de uma transition assíncrona, não aterrissa: a action era chamada,
   * o refresh acontecia, e a confirmação nunca aparecia. Era metade da causa
   * do silêncio, e só um teste de interação a expõe.
   */
  async function registrar() {
    if (!escolha || pending) return;
    setErro(null);
    setPending(true);
    try {
      const nenhuma = escolha === "NENHUMA";
      const result = await registerDecisionAction({
        curatedSelectionId,
        outcome: nenhuma ? "NONE_OF_THEM" : "CHOSEN",
        chosenOptionId: nenhuma ? undefined : escolha,
        note: nota.trim() || undefined,
      });

      if (result.success) {
        // A ordem importa: confirma primeiro, revalida depois. O refresh
        // continua necessário — é ele que troca o transitório pelo estado
        // durável vindo do fato canônico.
        setRegistrado(true);
        router.refresh();
      } else {
        // Erro preserva o contexto: a escolha e a nota dela ficam onde estão.
        setErro(result.error ?? "Não foi possível registrar sua decisão.");
      }
    } finally {
      setPending(false);
    }
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
