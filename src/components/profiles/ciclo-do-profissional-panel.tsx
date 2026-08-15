"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  CICLOS,
  NOTA_MAXIMA,
  NOTA_MINIMA,
  ROTULO_DO_CICLO,
  ROTULO_DO_MOTIVO,
  motivosDaTransicao,
  type CicloDoProfissional,
  type ImpactoDaTransicao,
  type MotivoDoCiclo,
} from "@/modules/profiles/ciclo-do-profissional";

/**
 * OPS-G5 · CORTE 7 — a mudança de ciclo, do lado de quem decide.
 *
 * A tese deste painel é que **nada acontece por engano**. Só aparecem os
 * destinos que existem a partir daqui; só aparecem os motivos que valem para o
 * destino escolhido; o impacto é lido ANTES de confirmar; e a confirmação é um
 * ato separado, deliberado, que a pessoa marca com a mão.
 *
 * Quando o impacto traz um bloqueio, a confirmação nem é oferecida — em vez de
 * deixar clicar e recusar depois.
 */

type Props = {
  cicloAtual: CicloDoProfissional | null;
  destinos: CicloDoProfissional[];
  preverImpacto: (para: CicloDoProfissional) => Promise<
    { success: true; data: ImpactoDaTransicao } | { success: false; error: string }
  >;
  mudarCiclo: (pedido: {
    para: CicloDoProfissional;
    motivo: MotivoDoCiclo;
    nota: string | null;
  }) => Promise<{ success: true; data: unknown } | { success: false; error: string }>;
  /** Só existe para legado sem ciclo. Ausente = a superfície não é oferecida. */
  classificarLegado?: (pedido: {
    para: CicloDoProfissional;
    justificativa: string;
  }) => Promise<{ success: true; data: unknown } | { success: false; error: string }>;
};

export function CicloDoProfissionalPanel({ cicloAtual, destinos, preverImpacto, mudarCiclo, classificarLegado }: Props) {
  const [para, setPara] = useState<CicloDoProfissional | "">("");
  const [motivo, setMotivo] = useState<MotivoDoCiclo | "">("");
  const [nota, setNota] = useState("");
  const [impacto, setImpacto] = useState<ImpactoDaTransicao | null>(null);
  const [confirmado, setConfirmado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState(false);
  const [legadoPara, setLegadoPara] = useState<CicloDoProfissional | "">("");
  const [legadoNota, setLegadoNota] = useState("");
  const [pendente, iniciar] = useTransition();

  const motivosPossiveis = cicloAtual && para ? motivosDaTransicao(cicloAtual, para) : [];
  const precisaDeNota = motivo === "OUTRO";
  const notaValida = !precisaDeNota || (nota.trim().length >= NOTA_MINIMA && nota.trim().length <= NOTA_MAXIMA);
  const bloqueado = impacto?.bloqueio != null;
  const podeConfirmar = Boolean(para && motivo) && notaValida && confirmado && !bloqueado;

  function escolherDestino(valor: string) {
    const destino = valor as CicloDoProfissional | "";
    setPara(destino);
    // Trocar de destino invalida tudo o que foi decidido para o anterior. Um
    // motivo que sobrevive à troca é um motivo escolhido para outra coisa.
    setMotivo("");
    setNota("");
    setConfirmado(false);
    setImpacto(null);
    setErro(null);
    setFeito(false);
    if (!destino) return;

    iniciar(async () => {
      const resultado = await preverImpacto(destino);
      if (resultado.success) setImpacto(resultado.data);
      else setErro(resultado.error);
    });
  }

  function enviar() {
    if (!para || !motivo) return;
    iniciar(async () => {
      const resultado = await mudarCiclo({ para, motivo, nota: precisaDeNota ? nota.trim() : null });
      if (resultado.success) {
        setFeito(true);
        setErro(null);
        setConfirmado(false);
      } else {
        setErro(resultado.error);
      }
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink">
        Estado atual:{" "}
        <strong className="font-semibold">
          {cicloAtual ? ROTULO_DO_CICLO[cicloAtual] : "Legado sem ciclo classificado"}
        </strong>
      </p>

      {cicloAtual === null && classificarLegado ? (
        <div className="space-y-4 rounded-md border border-border-strong bg-recessed p-4">
          <p className="text-sm text-ink">
            Este cadastro é legado e nunca teve o ciclo classificado. Registre em que estado ele está
            hoje, com a sua justificativa — ⛔ nenhuma data ou autoria retroativa é inventada, e
            enquanto não for classificado ele não é apresentado a paciente nenhuma.
          </p>

          <FormField label="Estado atual deste cadastro" htmlFor="legado-estado">
            <Select
              id="legado-estado"
              value={legadoPara}
              onChange={(evento) => setLegadoPara(evento.target.value as CicloDoProfissional | "")}
            >
              <option value="">— escolha o estado —</option>
              {CICLOS.map((c) => (
                <option key={c} value={c}>
                  {ROTULO_DO_CICLO[c]}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label={`Justificativa da classificação (${NOTA_MINIMA} a ${NOTA_MAXIMA} caracteres)`}
            htmlFor="legado-justificativa"
          >
            <Input
              id="legado-justificativa"
              label="Justificativa da classificação"
              hideLabel
              value={legadoNota}
              maxLength={NOTA_MAXIMA}
              onChange={(evento) => setLegadoNota(evento.target.value)}
            />
          </FormField>

          {erro ? <FormMessage variant="error">{erro}</FormMessage> : null}
          {feito ? <FormMessage variant="success">Cadastro legado classificado.</FormMessage> : null}

          <Button
            type="button"
            isLoading={pendente}
            disabled={!legadoPara || legadoNota.trim().length < NOTA_MINIMA}
            onClick={() => {
              if (!legadoPara) return;
              iniciar(async () => {
                const r = await classificarLegado({ para: legadoPara, justificativa: legadoNota.trim() });
                if (r.success) {
                  setFeito(true);
                  setErro(null);
                } else {
                  setErro(r.error);
                }
              });
            }}
          >
            Classificar cadastro legado
          </Button>
        </div>
      ) : destinos.length === 0 ? (
        <FormMessage variant="error">
          {cicloAtual
            ? "Não há mudança de estado possível a partir daqui."
            : "Este cadastro é legado e precisa de revisão antes de qualquer mudança de estado."}
        </FormMessage>
      ) : (
        <>
          <FormField label="Mudar para" htmlFor="ciclo-destino">
            <Select id="ciclo-destino" value={para} onChange={(evento) => escolherDestino(evento.target.value)}>
              <option value="">— escolha o novo estado —</option>
              {destinos.map((destino) => (
                <option key={destino} value={destino}>
                  {ROTULO_DO_CICLO[destino]}
                </option>
              ))}
            </Select>
          </FormField>

          {impacto ? (
            <div className="rounded-md border border-border-strong bg-recessed p-4" role="status">
              {impacto.bloqueio ? (
                <p className="text-sm font-semibold text-ink">{impacto.bloqueio}</p>
              ) : (
                <>
                  <p className="text-sm font-semibold text-ink">O que muda</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
                    {impacto.consequencias.map((linha) => (
                      <li key={linha}>{linha}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm font-semibold text-ink">O que permanece</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
                    {impacto.preservado.map((linha) => (
                      <li key={linha}>{linha}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : null}

          {para && !bloqueado ? (
            <FormField label="Motivo" htmlFor="ciclo-motivo">
              <Select
                id="ciclo-motivo"
                value={motivo}
                onChange={(evento) => setMotivo(evento.target.value as MotivoDoCiclo | "")}
              >
                <option value="">— escolha o motivo —</option>
                {motivosPossiveis.map((possivel) => (
                  <option key={possivel} value={possivel}>
                    {ROTULO_DO_MOTIVO[possivel]}
                  </option>
                ))}
              </Select>
            </FormField>
          ) : null}

          {precisaDeNota && !bloqueado ? (
            <FormField
              label={`Diga o motivo em suas palavras (${NOTA_MINIMA} a ${NOTA_MAXIMA} caracteres)`}
              htmlFor="ciclo-nota"
            >
              <Input
                id="ciclo-nota"
                value={nota}
                label="Diga o motivo em suas palavras"
                hideLabel
                maxLength={NOTA_MAXIMA}
                onChange={(evento) => setNota(evento.target.value)}
              />
            </FormField>
          ) : null}

          {para && motivo && notaValida && !bloqueado ? (
            <Checkbox
              id="ciclo-confirmacao"
              checked={confirmado}
              onChange={(evento) => setConfirmado(evento.target.checked)}
              label="Confirmo esta mudança de estado e o impacto descrito acima."
            />
          ) : null}

          {erro ? <FormMessage variant="error">{erro}</FormMessage> : null}
          {feito ? <FormMessage variant="success">Estado do profissional atualizado.</FormMessage> : null}

          <Button type="button" onClick={enviar} disabled={!podeConfirmar} isLoading={pendente}>
            Aplicar mudança
          </Button>
        </>
      )}
    </div>
  );
}
