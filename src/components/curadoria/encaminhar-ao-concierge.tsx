"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { transferCaseResponsibilityAction } from "@/modules/cases/responsibility-actions";

/**
 * A passagem de bastão ao Concierge — o elo que faltava no fim da Curadoria.
 *
 * @metodo Jornada §9 — o primeiro contato depois da escolha parte da Aliviar
 * @metodo Experience §2.5 — a entrega é humana; o acompanhamento também
 *
 * A Correção de Domínio §2 e §3 completam o desenho fora do Método canônico:
 * o Concierge recebe o MESMO Case após a Curadoria, e o responsável muda sem
 * que o Case mude de identidade.
 *
 * Por que existe: achado da curadoria simulada de 25/08. A transferência
 * auditada (`transfer_case_responsibility`) existia, o portal do Concierge
 * (`/acompanhamento`) existia, a Fila do Curador tinha até o grupo "Com o
 * Concierge" — e NENHUMA superfície oferecia o ato. O Case terminava a
 * Curadoria e ficava com o Curador para sempre; o Concierge nunca via nada.
 *
 * O que este componente NÃO decide: quem assina (o banco lê de `auth.uid()`),
 * se a auditoria grava (sem rastro o Case não se move), e quando o Curador
 * deixa de enxergar (a RLS responde — o Curador designado segue lendo o Case
 * que conduziu). Aqui só vive o gesto: destinatário e motivo.
 */
export function EncaminharAoConcierge({
  caseId,
  patientFirstName,
  concierges,
  responsavelAtualRole,
}: {
  caseId: string;
  patientFirstName: string;
  concierges: { id: string; name: string }[];
  responsavelAtualRole: string | null;
}) {
  const router = useRouter();
  const [destino, setDestino] = useState(concierges[0]?.id ?? "");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Já entregue ao Concierge: a tela diz o estado em vez de repetir o botão.
  if (responsavelAtualRole === "concierge") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>O acompanhamento está com o Concierge</CardTitle>
          <CardDescription>
            O mesmo Case, agora sob responsabilidade do Concierge — a passagem ficou registrada na
            auditoria. Você continua vendo o Case que conduziu.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (concierges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Encaminhar ao Concierge</CardTitle>
          <CardDescription>
            Nenhuma pessoa com o papel de Concierge está cadastrada. O papel é concedido pelo
            administrador, na tela de Equipe — sem isso não há a quem encaminhar.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  function encaminhar() {
    setErro(null);
    startTransition(async () => {
      const result = await transferCaseResponsibilityAction({
        caseId,
        newResponsibleId: destino,
        newRole: "concierge",
        reason: motivo,
      });
      if (result.success) {
        router.refresh();
      } else {
        setErro(result.error ?? "Não foi possível encaminhar agora.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Encaminhar ao Concierge</CardTitle>
        <CardDescription>
          Com a decisão de {patientFirstName} registrada, o acompanhamento segue com o Concierge —
          o mesmo Case, com a passagem auditada. O motivo fica no registro: é o que permite
          reconstruir depois por que o Case mudou de mão.
        </CardDescription>
      </CardHeader>
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-ink" htmlFor="encaminhar-concierge">
            Concierge
          </label>
          <Select
            id="encaminhar-concierge"
            value={destino}
            onChange={(event) => setDestino(event.target.value)}
          >
            {concierges.map((pessoa) => (
              <option key={pessoa.id} value={pessoa.id}>
                {pessoa.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-ink" htmlFor="encaminhar-motivo">
            Motivo do encaminhamento
          </label>
          <Textarea
            id="encaminhar-motivo"
            rows={3}
            value={motivo}
            onChange={(event) => setMotivo(event.target.value)}
            placeholder={`Curadoria entregue e decisão registrada — ${patientFirstName} segue para o acompanhamento.`}
          />
        </div>
        {erro ? <FormMessage variant="error">{erro}</FormMessage> : null}
        <Button type="button" onClick={encaminhar} isLoading={pending}>
          Encaminhar ao Concierge
        </Button>
      </div>
    </Card>
  );
}
