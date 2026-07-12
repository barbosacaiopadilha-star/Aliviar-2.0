"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { JsonViewer } from "@/components/ace/json-viewer";
import { diffJson } from "@/lib/json-diff";
import type { AceArtifact } from "@/modules/concierge/types";

import type { Narrative } from "@/modules/ace/artifacts/narrative";
import type { DecisionCase } from "@/modules/ace/artifacts/decision-case";
import type { CaseAudit } from "@/modules/ace/artifacts/case-audit";
import type { DecisionContext } from "@/modules/ace/artifacts/decision-context";
import type { CompetencyProfile } from "@/modules/ace/artifacts/competency-profile";
import type { EligibleProviderSet } from "@/modules/ace/artifacts/eligible-provider-set";
import type { CompatibilityMatrix } from "@/modules/ace/artifacts/compatibility-matrix";
import type { Shortlist } from "@/modules/ace/artifacts/shortlist";

type AceArtifactsListProps = {
  artifacts: AceArtifact[];
};

function describeArtifact(artifact: AceArtifact): string {
  switch (artifact.artifactType) {
    case "Narrative": {
      const payload = artifact.payload as Narrative;
      const answered = payload.closingQuestionsAnswered;
      return `Narrativa construída a partir da história (história: ${answered.historia ? "respondida" : "não respondida"}, decisão: ${answered.decisao ? "respondida" : "não respondida"}, objetivo: ${answered.objetivo ? "respondido" : "não respondido"}).`;
    }
    case "DecisionCase": {
      const payload = artifact.payload as DecisionCase;
      return `Restrições obrigatórias: ${payload.mandatoryConstraints.length} · Preferências: ${payload.preferences.length} · Informações ausentes: ${payload.missingInformation.length}.`;
    }
    case "CaseAudit": {
      const payload = artifact.payload as CaseAudit;
      return `Status: ${payload.status} · Bloqueios: ${payload.blockingIssues.length} · Avisos: ${payload.warnings.length}.`;
    }
    case "DecisionContext": {
      const payload = artifact.payload as DecisionContext;
      return `Tipo de decisão: ${payload.decisionType} · Domínio: ${payload.clinicalDomain} · Complexidade: ${payload.complexity} · Urgência: ${payload.urgency}.`;
    }
    case "CompetencyProfile": {
      const payload = artifact.payload as CompetencyProfile;
      return `Domínio: ${payload.domain} · Foco: ${payload.focus} · Experiência exigida: ${payload.experienceLevel}.`;
    }
    case "EligibleProviderSet": {
      const payload = artifact.payload as EligibleProviderSet;
      return `${payload.eligibleProviderIds.length} profissional(is) elegível(is) de ${payload.evaluatedCandidates.length} avaliado(s).`;
    }
    case "CompatibilityMatrix": {
      const payload = artifact.payload as CompatibilityMatrix;
      return `${payload.entries.length} profissional(is) avaliado(s) em todas as dimensões de compatibilidade.`;
    }
    case "Shortlist": {
      const payload = artifact.payload as Shortlist;
      return payload.status === "COMPOSED"
        ? "Shortlist composta com 3 profissionais — ver seção dedicada abaixo."
        : `Shortlist bloqueada (${payload.blockedReason}) — ver seção dedicada abaixo.`;
    }
    default:
      return "Artefato registrado.";
  }
}

function VersionCompare({ versions }: { versions: AceArtifact[] }) {
  const sorted = useMemo(() => [...versions].sort((a, b) => a.version - b.version), [versions]);
  const [beforeId, setBeforeId] = useState(sorted[sorted.length - 2]?.id ?? sorted[0].id);
  const [afterId, setAfterId] = useState(sorted[sorted.length - 1].id);

  const before = sorted.find((version) => version.id === beforeId) ?? sorted[0];
  const after = sorted.find((version) => version.id === afterId) ?? sorted[sorted.length - 1];
  const diff = useMemo(() => diffJson(before.payload, after.payload), [before, after]);

  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Comparar versões</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select aria-label="Versão anterior" value={beforeId} onChange={(event) => setBeforeId(event.target.value)}>
          {sorted.map((version) => (
            <option key={version.id} value={version.id}>
              Versão {version.version} — {new Date(version.createdAt).toLocaleString("pt-BR")}
            </option>
          ))}
        </Select>
        <Select aria-label="Versão posterior" value={afterId} onChange={(event) => setAfterId(event.target.value)}>
          {sorted.map((version) => (
            <option key={version.id} value={version.id}>
              Versão {version.version} — {new Date(version.createdAt).toLocaleString("pt-BR")}
            </option>
          ))}
        </Select>
      </div>

      {diff.length === 0 ? (
        <p className="text-sm text-ink-muted">Nenhuma diferença entre as versões selecionadas.</p>
      ) : (
        <ul className="space-y-2 text-xs">
          {diff.map((entry) => (
            <li key={entry.path} className="rounded-md border border-border p-2">
              <p className="font-medium text-ink">{entry.path}</p>
              <p className="text-ink-muted">antes: {JSON.stringify(entry.before) ?? "—"}</p>
              <p className="text-ink-muted">depois: {JSON.stringify(entry.after) ?? "—"}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AceArtifactsList({ artifacts }: AceArtifactsListProps) {
  const [expandedType, setExpandedType] = useState<string | null>(null);

  if (artifacts.length === 0) {
    return (
      <EmptyState
        title="Nenhum artefato do ACE ainda."
        description="Os artefatos de P001 a P008 aparecem aqui conforme a execução avança."
      />
    );
  }

  const versionsByType = new Map<string, AceArtifact[]>();
  for (const artifact of artifacts) {
    const list = versionsByType.get(artifact.artifactType) ?? [];
    list.push(artifact);
    versionsByType.set(artifact.artifactType, list);
  }

  const latestPerType = Array.from(versionsByType.values()).map(
    (versions) => versions.reduce((latest, current) => (current.version > latest.version ? current : latest)),
  );

  return (
    <ul className="divide-y divide-border">
      {latestPerType.map((artifact) => {
        const versions = versionsByType.get(artifact.artifactType) ?? [];
        const isExpanded = expandedType === artifact.artifactType;

        return (
          <li key={artifact.id} className="py-3">
            <button
              type="button"
              onClick={() => setExpandedType(isExpanded ? null : artifact.artifactType)}
              className="flex w-full flex-wrap items-center gap-2 text-left"
              aria-expanded={isExpanded}
            >
              <Badge variant="gold">{artifact.protocolId}</Badge>
              <span className="text-sm font-medium text-ink">{artifact.artifactType}</span>
              <Badge variant={artifact.validationStatus === "blocked" ? "default" : "sage"}>
                {artifact.validationStatus === "blocked" ? "Bloqueado" : "Válido"}
              </Badge>
              {versions.length > 1 ? (
                <span className="text-xs text-ink-muted">{versions.length} versões</span>
              ) : null}
              <span className="text-xs text-ink-muted">{new Date(artifact.createdAt).toLocaleString("pt-BR")}</span>
              <span className="ml-auto text-xs text-brand-primary">{isExpanded ? "Recolher" : "Ver detalhes"}</span>
            </button>
            <p className="mt-1 text-sm text-ink-muted">{describeArtifact(artifact)}</p>

            {isExpanded ? (
              <div className="mt-3 space-y-3">
                <JsonViewer value={artifact.payload} />
                {versions.length > 1 ? <VersionCompare versions={versions} /> : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
