"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PRACTICE_CONCEPTS_BY_CODE } from "@/modules/curadoria/evidencias-pratica";
import { PROFESSIONAL_PROTOCOL } from "@/modules/curadoria/protocolos";
import type {
  OwnDivergenceView,
  OwnEvidenceVersion,
} from "@/modules/curadoria/evidencias-pratica-repository";

/**
 * MINHAS RESPOSTAS — o que o profissional declarou, e em que pé está.
 *
 * @metodo Fundamentos §5 — o profissional é parceiro do Método, não catálogo
 * @metodo Ontologia §8 — nenhuma declaração vira nota, selo ou posição
 * @metodo Experience §5 — a tela informa, nunca cobra
 *
 * Por que existe: até a decisão de 2026-08-01 ele respondia ao Protocolo e
 * nunca sabia o que acontecia depois — se foi verificado, se algo divergiu,
 * o que precisava rever. Recebia pedido de atualização sem saber por quê.
 * Transparência sobre as próprias declarações, nada além disso.
 *
 * O que esta tela NUNCA mostra: parecer da operação, identidade de quem
 * verificou, a fonte consultada, nota interna, hipótese da equipe. A projeção
 * do repositório já não traz esses campos — aqui não haveria como exibi-los.
 *
 * Linguagem: descritiva e nunca acusatória. "A operação identificou uma
 * diferença" — jamais "informação incorreta" ou "você declarou errado".
 */

type Props = {
  versions: OwnEvidenceVersion[];
  divergences: OwnDivergenceView[];
};

const STATUS_TEXTO: Record<string, string> = {
  nao_verificado: "Declarada, ainda não verificada",
  verificado: "Verificada pela operação",
  divergente: "Em revisão pela operação",
  desatualizado: "Marcada como desatualizada",
  nao_localizado: "Não localizada na consulta",
};

const QUESTION_BY_CODE = new Map(PROFESSIONAL_PROTOCOL.map((q) => [q.concept.code, q]));

export function MinhasEvidencias({ versions, divergences }: Props) {
  const [openCode, setOpenCode] = useState<string | null>(null);

  if (versions.length === 0) return null;

  // Agrupa por conceito, preservando a ordem cronológica das versões.
  const porConceito = new Map<string, OwnEvidenceVersion[]>();
  for (const versao of versions) {
    const lista = porConceito.get(versao.subcriterionCode) ?? [];
    lista.push(versao);
    porConceito.set(versao.subcriterionCode, lista);
  }

  const divergentePorCodigo = new Map(divergences.map((d) => [d.subcriterionCode, d]));

  const correntes = [...porConceito.values()].map((lista) => lista[lista.length - 1]!);
  const verificadas = correntes.filter((v) => v.status === "verificado").length;
  const emRevisao = correntes.filter((v) => v.status === "divergente").length;
  const desatualizadas = correntes.filter((v) => v.status === "desatualizado").length;

  return (
    <Card className="space-y-6">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Minhas respostas ao Protocolo</CardTitle>
          <Badge variant="sage">{`${correntes.length} respostas registradas`}</Badge>
        </div>
        <CardDescription>
          O que você declarou, quando declarou e em que estado a informação está hoje. Responder de
          novo cria uma nova versão — a anterior continua guardada aqui.
        </CardDescription>
      </CardHeader>

      <div className="flex flex-wrap gap-1">
        {verificadas > 0 ? <Badge variant="sage">{`${verificadas} verificadas`}</Badge> : null}
        {emRevisao > 0 ? <Badge variant="default">{`${emRevisao} em revisão`}</Badge> : null}
        {desatualizadas > 0 ? (
          <Badge variant="default">{`${desatualizadas} desatualizadas`}</Badge>
        ) : null}
      </div>

      <ul className="space-y-2 text-sm">
        {[...porConceito.entries()].map(([code, historico]) => {
          const corrente = historico[historico.length - 1]!;
          const conceito = PRACTICE_CONCEPTS_BY_CODE.get(code);
          const divergencia = divergentePorCodigo.get(code) ?? null;
          const aberto = openCode === code;

          return (
            <li key={code} className="rounded border p-2 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="font-medium">{conceito?.name ?? code}</span>
                <Badge variant={corrente.status === "verificado" ? "sage" : "default"}>
                  {STATUS_TEXTO[corrente.status] ?? corrente.status}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground">
                Resposta declarada em {corrente.collectedAt.slice(0, 10)}
                {corrente.verifiedAt
                  ? ` · informação verificada em ${corrente.verifiedAt.slice(0, 10)}`
                  : ""}
                {historico.length > 1 ? ` · versão ${corrente.version} de ${historico.length}` : ""}
              </p>

              {divergencia ? (
                <div className="rounded border border-dashed p-2 text-xs" role="note">
                  <p>
                    A operação identificou uma diferença entre sua declaração e uma informação
                    consultada. Revise esta resposta para mantê-la atualizada.
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Analisada nesta resposta: {divergencia.declaredVersion}
                  </p>
                  <p className="text-muted-foreground">
                    A esclarecer: {divergencia.foundVersion}
                  </p>
                </div>
              ) : null}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpenCode(aberto ? null : code)}
              >
                {aberto ? "Fechar" : "Ver esta resposta e o histórico"}
              </Button>

              {aberto ? (
                <Detalhe code={code} historico={historico} />
              ) : null}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function Detalhe({ code, historico }: { code: string; historico: OwnEvidenceVersion[] }) {
  const conceito = PRACTICE_CONCEPTS_BY_CODE.get(code);
  const pergunta = QUESTION_BY_CODE.get(code);
  const corrente = historico[historico.length - 1]!;

  function respostaDe(versao: OwnEvidenceVersion): string {
    if (versao.options.length > 0 && conceito) {
      const rotulos = versao.options.map((o) => conceito.options[o] ?? o);
      return rotulos.join(" · ");
    }
    const pares = Object.entries(versao.details)
      .filter(([, valor]) => typeof valor === "string" || typeof valor === "number")
      .map(([campo, valor]) => `${campo}: ${valor}`);
    return pares.length > 0 ? pares.join("; ") : "sem resposta registrada";
  }

  return (
    <div className="space-y-2 rounded border border-dashed p-2 text-xs">
      {pergunta ? <p className="italic">{pergunta.question}</p> : null}
      <p>
        <span className="font-medium">Sua resposta atual:</span> {respostaDe(corrente)}
        {corrente.conditionNote ? ` — condição: ${corrente.conditionNote}` : ""}
      </p>

      <div>
        <p className="font-medium">Histórico das suas versões</p>
        <ol className="mt-1 space-y-1" aria-label={`Histórico — ${conceito?.name ?? code}`}>
          {historico.map((versao) => (
            <li key={versao.version} className="rounded border p-1">
              Versão {versao.version} · declarada em {versao.collectedAt.slice(0, 10)} ·{" "}
              {STATUS_TEXTO[versao.status] ?? versao.status}
              {versao.verifiedAt ? ` · verificada em ${versao.verifiedAt.slice(0, 10)}` : ""}
              <span className="block text-muted-foreground">{respostaDe(versao)}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
