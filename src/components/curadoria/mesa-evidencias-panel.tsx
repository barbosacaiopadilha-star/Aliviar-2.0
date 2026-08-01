"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Radio } from "@/components/ui/radio";
import { Textarea } from "@/components/ui/textarea";
import {
  EVIDENCE_STATUS_LABELS,
  EVIDENCE_VALIDITY_LABELS,
  PRACTICE_CATALOG,
  PRACTICE_CONCEPTS_BY_CODE,
  classifyEvidenceValidity,
  operationalPhrase,
  verbalizePracticeEvidence,
} from "@/modules/curadoria/evidencias-pratica";
import { SOURCE_TIERS, SOURCE_TIER_LABELS } from "@/modules/curadoria/fontes";
import { PROFESSIONAL_PROTOCOL } from "@/modules/curadoria/protocolos";
import type {
  EvidenceDivergenceRecord,
  PracticeEvidenceRecord,
  UpdateRequestRecord,
} from "@/modules/curadoria/evidencias-pratica-repository";
import {
  loadEvidenceHistoryAction,
  markEvidenceOutdatedAction,
  openEvidenceDivergenceAction,
  requestPracticeUpdateAction,
  resolveEvidenceDivergenceAction,
  verifyEvidenceAction,
} from "@/modules/curadoria/evidencias-actions";

/**
 * BASE DE EVIDÊNCIAS NA MESA — o estado da INFORMAÇÃO, nunca a correspondência.
 *
 * @metodo Fundamentos §13 — o Curador decide; o sistema informa a confiança
 * @metodo Ontologia §3.13 — contagem não é colocação: nada aqui ordena
 * @metodo Experience §5 — a tela informa, nunca conclui
 *
 * Governado por docs/curadoria/protocolos/GRAMATICA_DAS_PERGUNTAS.md §6:
 * estado da informação e correspondência não se confundem.
 *
 * Por que existe: é a superfície pela qual a operação transforma uma
 * autodeclaração em informação verificada — consultar, conferir a fonte,
 * assinar verificação de uma VERSÃO específica, abrir divergência, marcar
 * desatualização, solicitar atualização e ler o histórico completo. Abertura
 * progressiva: resumo → lista por conceito → detalhe → histórico, para a
 * Mesa continuar simples.
 *
 * O que este painel NUNCA diz: "atende"/"não atende" — correspondência é
 * declaração humana e vive em outra camada da Mesa. Contagem, não juízo.
 */

export type EvidencePanelCan = {
  verify: boolean;
  openDivergence: boolean;
  requestUpdate: boolean;
  resolveDivergence: boolean;
  markOutdated: boolean;
};

type Props = {
  caseId: string | null;
  professionals: { professionalProfileId: string; displayName: string }[];
  rows: Record<string, PracticeEvidenceRecord[]>;
  divergences: EvidenceDivergenceRecord[];
  updateRequests: UpdateRequestRecord[];
  can: EvidencePanelCan;
  nowIso: string;
};

const QUESTION_BY_CODE = new Map(PROFESSIONAL_PROTOCOL.map((q) => [q.concept.code, q]));

export function MesaEvidenciasPanel({
  caseId,
  professionals,
  rows,
  divergences,
  updateRequests,
  can,
  nowIso,
}: Props) {
  const [openProfessional, setOpenProfessional] = useState<string | null>(null);

  if (professionals.length === 0) {
    return <p className="text-sm text-ink-muted">Sem profissionais na Rede deste Case.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {professionals.map((professional) => {
        const id = professional.professionalProfileId;
        const registros = rows[id] ?? [];
        const abertas = divergences.filter((d) => d.professionalProfileId === id && d.status === "aberta");
        const pendencias = updateRequests.filter((r) => r.professionalProfileId === id);
        const aberto = openProfessional === id;

        return (
          <li key={id} className="rounded border p-2 space-y-2">
            <ResumoNivel1
              displayName={professional.displayName}
              registros={registros}
              abertas={abertas.length}
              pendencias={pendencias.length}
              nowIso={nowIso}
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpenProfessional(aberto ? null : id)}>
              {aberto ? "Fechar conceitos" : "Ver por conceito"}
            </Button>
            {aberto ? (
              <ListaNivel2
                caseId={caseId}
                professionalProfileId={id}
                registros={registros}
                divergences={abertas}
                can={can}
                nowIso={nowIso}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function ResumoNivel1({
  displayName,
  registros,
  abertas,
  pendencias,
  nowIso,
}: {
  displayName: string;
  registros: PracticeEvidenceRecord[];
  abertas: number;
  pendencias: number;
  nowIso: string;
}) {
  const verificadas = registros.filter((r) => r.status === "verificado");
  const vencidas = verificadas.filter(
    (r) => classifyEvidenceValidity(r.subcriterionCode, r.status, r.verifiedAt, nowIso) === "VENCIDO",
  ).length;
  const declaradas = registros.filter((r) => r.status === "nao_verificado").length;
  const faltantes = PRACTICE_CATALOG.length - registros.length;
  const ultima = registros
    .map((r) => r.verifiedAt ?? r.collectedAt)
    .sort()
    .at(-1);

  return (
    <div className="space-y-1">
      <span className="font-medium">{displayName}</span>
      <div className="flex flex-wrap gap-1">
        <Badge variant="default">{`${registros.length} de ${PRACTICE_CATALOG.length} conceitos com informação`}</Badge>
        {verificadas.length > 0 ? <Badge variant="sage">{`${verificadas.length} verificadas`}</Badge> : null}
        {declaradas > 0 ? <Badge variant="default">{`${declaradas} apenas declaradas`}</Badge> : null}
        {vencidas > 0 ? <Badge variant="default">{`${vencidas} com verificação vencida`}</Badge> : null}
        {abertas > 0 ? <Badge variant="default">{`${abertas} divergências em análise`}</Badge> : null}
        {faltantes > 0 ? <Badge variant="default">{`${faltantes} sem informação`}</Badge> : null}
        {pendencias > 0 ? <Badge variant="default">{`${pendencias} atualizações solicitadas`}</Badge> : null}
      </div>
      {ultima ? (
        <p className="text-xs text-ink-muted">Última atualização em {ultima.slice(0, 10)}.</p>
      ) : (
        <p className="text-xs text-ink-muted">Nenhuma evidência de prática registrada ainda.</p>
      )}
    </div>
  );
}

function ListaNivel2({
  caseId,
  professionalProfileId,
  registros,
  divergences,
  can,
  nowIso,
}: {
  caseId: string | null;
  professionalProfileId: string;
  registros: PracticeEvidenceRecord[];
  divergences: EvidenceDivergenceRecord[];
  can: EvidencePanelCan;
  nowIso: string;
}) {
  const [openConcept, setOpenConcept] = useState<string | null>(null);
  const porCodigo = new Map(registros.map((r) => [r.subcriterionCode, r]));

  return (
    <ul className="space-y-1 border-l pl-2">
      {PRACTICE_CATALOG.map((concept) => {
        const registro = porCodigo.get(concept.code) ?? null;
        const divergencia = divergences.find((d) => d.subject === concept.code) ?? null;
        const aberto = openConcept === concept.code;

        return (
          <li key={concept.code} className="rounded border p-2 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="font-medium">{concept.name}</span>
              <span className="flex flex-wrap gap-1">
                {registro ? (
                  <>
                    <Badge variant={registro.status === "verificado" ? "sage" : "default"}>
                      {EVIDENCE_STATUS_LABELS[registro.status] ?? registro.status}
                    </Badge>
                    <Badge variant="default">
                      {
                        EVIDENCE_VALIDITY_LABELS[
                          classifyEvidenceValidity(concept.code, registro.status, registro.verifiedAt, nowIso)
                        ]
                      }
                    </Badge>
                  </>
                ) : (
                  <Badge variant="default">Sem informação — lacuna</Badge>
                )}
                {divergencia ? <Badge variant="default">Divergência em análise</Badge> : null}
              </span>
            </div>

            {registro ? (
              <p className="text-xs text-ink-muted">
                v{registro.version} · fonte da declaração: {registro.source} · coletada em{" "}
                {registro.collectedAt.slice(0, 10)}
              </p>
            ) : null}

            {registro ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpenConcept(aberto ? null : concept.code)}>
                {aberto ? "Fechar detalhe" : "Abrir detalhe"}
              </Button>
            ) : null}

            {aberto && registro ? (
              <DetalheNivel3
                caseId={caseId}
                professionalProfileId={professionalProfileId}
                registro={registro}
                divergencia={divergencia}
                can={can}
                nowIso={nowIso}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function DetalheNivel3({
  caseId,
  professionalProfileId,
  registro,
  divergencia,
  can,
  nowIso,
}: {
  caseId: string | null;
  professionalProfileId: string;
  registro: PracticeEvidenceRecord;
  divergencia: EvidenceDivergenceRecord | null;
  can: EvidencePanelCan;
  nowIso: string;
}) {
  const [history, setHistory] = useState<PracticeEvidenceRecord[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const pergunta = QUESTION_BY_CODE.get(registro.subcriterionCode);
  const frase = verbalizePracticeEvidence({
    subcriterionCode: registro.subcriterionCode,
    options: registro.options,
    details: registro.details,
    conditionNote: registro.conditionNote,
    status: registro.status,
    verifiedAt: registro.verifiedAt,
  });

  function verHistorico() {
    startTransition(async () => {
      const result = await loadEvidenceHistoryAction({
        professionalProfileId,
        subcriterionCode: registro.subcriterionCode,
      });
      if (result.success) setHistory(result.history);
      else setMessage(result.error);
    });
  }

  return (
    <div className="space-y-3 rounded border border-dashed p-2">
      {pergunta ? <p className="text-xs italic">{pergunta.id} · {pergunta.question}</p> : null}
      {frase ? <p>{frase.text}</p> : null}
      <p className="text-xs text-ink-muted">{operationalPhrase(registro, nowIso)}</p>

      <dl className="text-xs text-ink-muted space-y-0.5">
        <div>Declarada por {registro.collectedBy.slice(0, 8)}… em {registro.collectedAt.slice(0, 10)}</div>
        {registro.conditionNote ? <div>Condição: {registro.conditionNote}</div> : null}
        {registro.observation ? <div>Observação: {registro.observation}</div> : null}
        {registro.verifiedAt ? (
          <div>
            Verificada por {registro.verifiedBy?.slice(0, 8)}… em {registro.verifiedAt.slice(0, 10)} · fonte:{" "}
            {registro.verificationSource}
          </div>
        ) : null}
        {divergencia ? (
          <div>
            Divergência: declarado «{divergencia.declaredVersion}» · encontrado «{divergencia.foundVersion}»
          </div>
        ) : null}
      </dl>

      {message ? <p className="text-xs text-error" role="alert">{message}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={verHistorico} disabled={pending}>
          Ver histórico
        </Button>
      </div>

      {history ? (
        <ol className="space-y-1 text-xs" aria-label="Histórico de versões">
          {history.map((versao) => (
            <li key={versao.version} className="rounded border p-1">
              v{versao.version} · {EVIDENCE_STATUS_LABELS[versao.status] ?? versao.status} ·{" "}
              {versao.options.length > 0 ? versao.options.join(", ") : "registro estruturado"} · por{" "}
              {versao.collectedBy.slice(0, 8)}…
              {versao.verifiedAt ? ` · verificada em ${versao.verifiedAt.slice(0, 10)}` : ""}
            </li>
          ))}
        </ol>
      ) : null}

      {can.verify && registro.status === "nao_verificado" ? (
        <VerifyForm
          caseId={caseId}
          professionalProfileId={professionalProfileId}
          registro={registro}
          onMessage={setMessage}
        />
      ) : null}

      {can.openDivergence && !divergencia ? (
        <DivergenceForm caseId={caseId} professionalProfileId={professionalProfileId} registro={registro} onMessage={setMessage} />
      ) : null}

      {can.resolveDivergence && divergencia ? (
        <ResolveDivergenceForm
          caseId={caseId}
          professionalProfileId={professionalProfileId}
          registro={registro}
          divergencia={divergencia}
          onMessage={setMessage}
        />
      ) : null}

      {can.markOutdated && registro.status !== "desatualizado" ? (
        <OutdatedForm caseId={caseId} professionalProfileId={professionalProfileId} registro={registro} onMessage={setMessage} />
      ) : null}

      {can.requestUpdate ? (
        <RequestUpdateForm caseId={caseId} professionalProfileId={professionalProfileId} registro={registro} onMessage={setMessage} />
      ) : null}
    </div>
  );
}

function VerifyForm({
  caseId,
  professionalProfileId,
  registro,
  onMessage,
}: {
  caseId: string | null;
  professionalProfileId: string;
  registro: PracticeEvidenceRecord;
  onMessage: (message: string) => void;
}) {
  const [source, setSource] = useState("");
  const [tier, setTier] = useState<(typeof SOURCE_TIERS)[number]>("INSTITUCIONAL");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await verifyEvidenceAction({
        professionalProfileId,
        subcriterionCode: registro.subcriterionCode,
        expectedVersion: registro.version,
        verificationSource: source,
        verificationTier: tier,
        caseId,
      });
      onMessage(result.success ? "Verificação registrada." : result.error);
    });
  }

  return (
    <fieldset className="space-y-2 rounded border p-2">
      <legend className="text-xs font-medium">Verificar esta versão (v{registro.version})</legend>
      <p className="text-xs text-ink-muted">
        Você está verificando esta versão específica da informação. Uma atualização futura do
        conteúdo exigirá nova verificação.
      </p>
      <Input
        id={`verify-src-${registro.subcriterionCode}`}
        label="Fonte da verificação (referência ou localização)"
        value={source}
        onChange={(event) => setSource(event.target.value)}
        maxLength={500}
      />
      <div className="space-y-1">
        {SOURCE_TIERS.filter((t) => t !== "INADEQUADA").map((value) => (
          <Radio
            key={value}
            id={`verify-tier-${registro.subcriterionCode}-${value}`}
            name={`verify-tier-${registro.subcriterionCode}`}
            checked={tier === value}
            onChange={() => setTier(value)}
            label={SOURCE_TIER_LABELS[value]}
          />
        ))}
      </div>
      <Button type="button" size="sm" onClick={submit} disabled={pending || source.trim().length < 3}>
        Assinar verificação
      </Button>
    </fieldset>
  );
}

function DivergenceForm({
  caseId,
  professionalProfileId,
  registro,
  onMessage,
}: {
  caseId: string | null;
  professionalProfileId: string;
  registro: PracticeEvidenceRecord;
  onMessage: (message: string) => void;
}) {
  const [found, setFound] = useState("");
  const [severity, setSeverity] = useState<"critica" | "observacao">("observacao");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await openEvidenceDivergenceAction({
        professionalProfileId,
        subcriterionCode: registro.subcriterionCode,
        declaredVersion: registro.options.join(", ") || "registro estruturado",
        foundVersion: found,
        severity,
        caseId,
      });
      onMessage(result.success ? "Divergência registrada — análise pendente." : result.error);
    });
  }

  return (
    <fieldset className="space-y-2 rounded border p-2">
      <legend className="text-xs font-medium">Registrar divergência</legend>
      <Textarea
        aria-label="O que a fonte consultada diz"
        value={found}
        onChange={(event) => setFound(event.target.value)}
        placeholder="O que a fonte consultada diz, nas palavras dela."
      />
      <div className="space-y-1">
        <Radio
          id={`div-obs-${registro.subcriterionCode}`}
          name={`div-sev-${registro.subcriterionCode}`}
          checked={severity === "observacao"}
          onChange={() => setSeverity("observacao")}
          label="Observação — registra e não bloqueia"
        />
        <Radio
          id={`div-cri-${registro.subcriterionCode}`}
          name={`div-sev-${registro.subcriterionCode}`}
          checked={severity === "critica"}
          onChange={() => setSeverity("critica")}
          label="Crítica — impede publicação até resolver"
        />
      </div>
      <Button type="button" size="sm" onClick={submit} disabled={pending || found.trim().length < 3}>
        Abrir divergência
      </Button>
    </fieldset>
  );
}

function ResolveDivergenceForm({
  caseId,
  professionalProfileId,
  registro,
  divergencia,
  onMessage,
}: {
  caseId: string | null;
  professionalProfileId: string;
  registro: PracticeEvidenceRecord;
  divergencia: EvidenceDivergenceRecord;
  onMessage: (message: string) => void;
}) {
  const [resolution, setResolution] = useState("");
  const [confirmaDeclaracao, setConfirmaDeclaracao] = useState(true);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await resolveEvidenceDivergenceAction({
        divergenceId: divergencia.id,
        resolution,
        resolvedVersion: confirmaDeclaracao ? divergencia.declaredVersion : divergencia.foundVersion,
        markOutdated: !confirmaDeclaracao,
        professionalProfileId,
        subcriterionCode: registro.subcriterionCode,
        caseId,
      });
      onMessage(result.success ? "Divergência resolvida — o histórico guarda as duas versões." : result.error);
    });
  }

  return (
    <fieldset className="space-y-2 rounded border p-2">
      <legend className="text-xs font-medium">Resolver divergência</legend>
      <div className="space-y-1">
        <Radio
          id={`res-dec-${registro.subcriterionCode}`}
          name={`res-${registro.subcriterionCode}`}
          checked={confirmaDeclaracao}
          onChange={() => setConfirmaDeclaracao(true)}
          label="A declaração se confirma"
        />
        <Radio
          id={`res-enc-${registro.subcriterionCode}`}
          name={`res-${registro.subcriterionCode}`}
          checked={!confirmaDeclaracao}
          onChange={() => setConfirmaDeclaracao(false)}
          label="A informação encontrada prevalece — a evidência fica desatualizada e aguarda resposta nova"
        />
      </div>
      <Textarea
        aria-label="O que se concluiu"
        value={resolution}
        onChange={(event) => setResolution(event.target.value)}
        placeholder="O que se concluiu, com base em quê."
      />
      <Button type="button" size="sm" onClick={submit} disabled={pending || resolution.trim().length < 3}>
        Registrar resolução
      </Button>
    </fieldset>
  );
}

function OutdatedForm({
  caseId,
  professionalProfileId,
  registro,
  onMessage,
}: {
  caseId: string | null;
  professionalProfileId: string;
  registro: PracticeEvidenceRecord;
  onMessage: (message: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await markEvidenceOutdatedAction({
        professionalProfileId,
        subcriterionCode: registro.subcriterionCode,
        reason,
        caseId,
      });
      onMessage(result.success ? "Marcada como desatualizada." : result.error);
    });
  }

  return (
    <fieldset className="space-y-2 rounded border p-2">
      <legend className="text-xs font-medium">Marcar como desatualizada</legend>
      <Input
        id={`out-${registro.subcriterionCode}`}
        label="Motivo (curto)"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        maxLength={280}
      />
      <Button type="button" size="sm" onClick={submit} disabled={pending || reason.trim().length < 3}>
        Confirmar
      </Button>
    </fieldset>
  );
}

function RequestUpdateForm({
  caseId,
  professionalProfileId,
  registro,
  onMessage,
}: {
  caseId: string | null;
  professionalProfileId: string;
  registro: PracticeEvidenceRecord;
  onMessage: (message: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await requestPracticeUpdateAction({
        professionalProfileId,
        subcriterionCodes: [registro.subcriterionCode],
        reason,
        dueHint: null,
        caseId,
      });
      onMessage(result.success ? "Atualização solicitada — pendência registrada." : result.error);
    });
  }

  return (
    <fieldset className="space-y-2 rounded border p-2">
      <legend className="text-xs font-medium">Solicitar atualização ao profissional</legend>
      <Input
        id={`req-${registro.subcriterionCode}`}
        label="Motivo da solicitação"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        maxLength={500}
      />
      <Button type="button" size="sm" onClick={submit} disabled={pending || reason.trim().length < 3}>
        Registrar pendência
      </Button>
    </fieldset>
  );
}
