"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  registrarJulgamentoAction,
  retirarJulgamentoAction,
  type DesfechoDoJulgamento,
} from "@/modules/curadoria/julgamento-actions";
import type { JulgamentoLido, LacunaDeJuizo } from "@/modules/curadoria/julgamentos";

/**
 * O PAINEL DE JUÍZO da etapa AVALIAÇÃO (Item 2.3 §13/§16) — a menor
 * superfície necessária.
 *
 * O que ele mostra: as evidências (por referência), o aguardo NOMEADO, o
 * vigente com sua atualidade, o histórico. O que ele recebe: a decisão
 * EXPLÍCITA do Curador — conclusão digitada num campo que NASCE VAZIO,
 * sempre, inclusive na revisão pós-JS3 (G-2.3-5: zero minuta, zero sugestão,
 * zero carry-forward; copiar a conclusão anterior é decisão humana de
 * digitar de novo). Texto em edição morre no cliente — não é julgamento,
 * não persiste, não é segunda origem (ADR-067 §13b).
 */

export type EvidenciaCorrente = {
  id: string;
  version: number;
  subcriterionCode: string;
  status: string;
  resumo: string;
};

export type ConceitoDeJuizo = {
  code: string;
  label: string;
  natureza: "TECNICO" | "RELACIONAL";
  /** null = há vigente; senão, o motivo nomeado do aguardo. */
  lacuna: LacunaDeJuizo["motivo"] | null;
  vigente: JulgamentoLido | null;
  historico: JulgamentoLido[];
  evidenciasCorrentes: EvidenciaCorrente[];
  /** A versão-base do próximo ato: a ponta da cadeia, se existir. */
  versaoBaseId: string | null;
};

const MOTIVO_DO_AGUARDO: Record<NonNullable<ConceitoDeJuizo["lacuna"]>, string> = {
  SEM_JUIZO: "Aguarda o juízo do Curador — nenhum julgamento registrado.",
  JUIZO_RETIRADO: "O julgamento foi retirado sem substituto — o conceito voltou a ausência de juízo.",
  JUIZO_SUPERADO_POR_EVIDENCIA:
    "Evidência nova superou o juízo anterior — julgue de novo sobre os fatos vigentes.",
};

const DESFECHO_LEGIVEL: Record<DesfechoDoJulgamento["desfecho"], string> = {
  JUIZO_REGISTRADO: "Juízo registrado.",
  VERSAO_JA_GRAVADA: "Este juízo já estava gravado — nada foi duplicado.",
  CONFLITO_DE_VERSAO: "O julgamento mudou desde a sua leitura. Releia o vigente e aja de novo.",
  SEM_AUTORIDADE: "Você não tem autoridade para este ato.",
  JUIZO_RETIRADO: "Julgamento retirado — o conceito voltou a aguardar juízo.",
  ERRO_TECNICO: "Não foi possível concluir o ato agora.",
};

function FormularioDeJuizo({
  caseId,
  professionalProfileId,
  conceito,
}: {
  caseId: string;
  professionalProfileId: string;
  conceito: ConceitoDeJuizo;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // O campo nasce vazio SEMPRE — o estado inicial não olha para nenhuma
  // conclusão anterior (G-2.3-5). A key por versão-base derruba qualquer
  // resquício local quando a cadeia avança.
  const [conclusao, setConclusao] = useState("");
  const [motivo, setMotivo] = useState("");
  const [selecionadas, setSelecionadas] = useState<Record<string, boolean>>({});
  const [resultado, setResultado] = useState<string | null>(null);

  const registrar = () => {
    startTransition(async () => {
      const evidencias = conceito.evidenciasCorrentes
        .filter((evidencia) => selecionadas[evidencia.id])
        .map((evidencia) => ({ id: evidencia.id, version: evidencia.version }));
      const desfecho = await registrarJulgamentoAction({
        caseId,
        professionalProfileId,
        subcriterionCode: conceito.code,
        natureza: conceito.natureza,
        conclusao,
        fatosVisiveis: evidencias.map((evidencia) => ({
          registro: `practice_evidence:${evidencia.id}`,
          versao: String(evidencia.version),
        })),
        evidencias,
        motivo: motivo || null,
        versaoBaseId: conceito.versaoBaseId,
      });
      setResultado(DESFECHO_LEGIVEL[desfecho.desfecho]);
      if (desfecho.desfecho === "JUIZO_REGISTRADO") {
        setConclusao("");
        setMotivo("");
        setSelecionadas({});
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-2" data-testid={`form-juizo-${conceito.code}`}>
      {conceito.evidenciasCorrentes.length > 0 ? (
        <fieldset className="space-y-1">
          <legend className="text-xs font-medium text-ink-muted">
            Evidências referenciadas (a conclusão aponta, nunca copia)
          </legend>
          {conceito.evidenciasCorrentes.map((evidencia) => (
            <label key={evidencia.id} className="flex items-start gap-2 text-xs">
              <input
                type="checkbox"
                checked={Boolean(selecionadas[evidencia.id])}
                onChange={(evento) =>
                  setSelecionadas((atual) => ({ ...atual, [evidencia.id]: evento.target.checked }))
                }
              />
              <span>
                {evidencia.resumo} · v{evidencia.version} · {evidencia.status}
              </span>
            </label>
          ))}
        </fieldset>
      ) : (
        <p className="text-xs text-ink-muted">
          Sem evidência corrente deste conceito — julgar com a incompletude visível é legítimo.
        </p>
      )}

      <textarea
        aria-label={`Conclusão sobre ${conceito.label}`}
        className="w-full rounded-md border border-edge bg-transparent p-2 text-sm"
        rows={3}
        maxLength={280}
        placeholder="A sua conclusão — expressa, curta, sua."
        value={conclusao}
        onChange={(evento) => setConclusao(evento.target.value)}
      />
      <input
        aria-label="Motivo (opcional)"
        className="w-full rounded-md border border-edge bg-transparent p-2 text-xs"
        maxLength={280}
        placeholder="Motivo (opcional — nunca exigido)"
        value={motivo}
        onChange={(evento) => setMotivo(evento.target.value)}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-md border border-edge px-3 py-1.5 text-sm font-medium disabled:opacity-50"
          disabled={pending || conclusao.trim().length === 0}
          onClick={registrar}
        >
          Registrar juízo
        </button>
        {resultado ? <span className="text-xs text-ink-muted">{resultado}</span> : null}
      </div>
    </div>
  );
}

function BlocoDoConceito({
  caseId,
  professionalProfileId,
  conceito,
}: {
  caseId: string;
  professionalProfileId: string;
  conceito: ConceitoDeJuizo;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<string | null>(null);

  const retirar = (versaoVigenteId: string) => {
    startTransition(async () => {
      const desfecho = await retirarJulgamentoAction({ versaoVigenteId, motivo: null });
      setResultado(DESFECHO_LEGIVEL[desfecho.desfecho]);
      if (desfecho.desfecho === "JUIZO_RETIRADO") router.refresh();
    });
  };

  return (
    <section className="rounded-lg border border-edge p-3 space-y-2" data-testid={`juizo-${conceito.code}`}>
      <header className="flex items-baseline justify-between gap-2">
        <h4 className="text-sm font-semibold">{conceito.label}</h4>
        <span className="text-[11px] uppercase tracking-wide text-ink-muted">{conceito.natureza}</span>
      </header>

      {conceito.vigente ? (
        <div className="space-y-1">
          <p className="text-sm">{conceito.vigente.conclusao}</p>
          <p className="text-xs text-ink-muted">
            Vigente · v{conceito.vigente.versao}
            {conceito.vigente.evidencias.length > 0
              ? ` · ${conceito.vigente.evidencias.length} evidência${conceito.vigente.evidencias.length === 1 ? "" : "s"} referenciada${conceito.vigente.evidencias.length === 1 ? "" : "s"}`
              : " · sem evidência referenciada"}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md border border-edge px-2 py-1 text-xs disabled:opacity-50"
              disabled={pending}
              onClick={() => retirar(conceito.vigente!.id)}
            >
              Retirar (só o autor)
            </button>
            {resultado ? <span className="text-xs text-ink-muted">{resultado}</span> : null}
          </div>
        </div>
      ) : (
        <>
          {conceito.lacuna ? (
            <p className="text-xs font-medium text-ink-muted" data-testid={`aguardo-${conceito.code}`}>
              {MOTIVO_DO_AGUARDO[conceito.lacuna]}
            </p>
          ) : null}
          <FormularioDeJuizo
            key={conceito.versaoBaseId ?? "primeiro-juizo"}
            caseId={caseId}
            professionalProfileId={professionalProfileId}
            conceito={conceito}
          />
        </>
      )}

      {conceito.historico.length > 0 ? (
        <details className="text-xs text-ink-muted">
          <summary>Histórico ({conceito.historico.length})</summary>
          <ul className="mt-1 space-y-1">
            {conceito.historico.map((versao) => (
              <li key={versao.id}>
                v{versao.versao} · {versao.state} · {versao.conclusao}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

export function PainelDeJuizo({
  caseId,
  profissionais,
}: {
  caseId: string;
  profissionais: {
    professionalProfileId: string;
    nome: string;
    conceitos: ConceitoDeJuizo[];
  }[];
}) {
  if (profissionais.length === 0) return null;

  return (
    <div className="space-y-4">
      <header>
        <h3 className="text-base font-semibold">Juízo do Curador (H8–H11)</h3>
        <p className="text-xs text-ink-muted">
          O Motor lê e sinaliza; a conclusão é sua — registrada, versionada e auditável. Nada aqui
          é sugerido, pré-preenchido ou copiado.
        </p>
      </header>
      {profissionais.map((profissional) => (
        <article key={profissional.professionalProfileId} className="space-y-2">
          <h4 className="text-sm font-semibold">{profissional.nome}</h4>
          <div className="grid gap-3 lg:grid-cols-2">
            {profissional.conceitos.map((conceito) => (
              <BlocoDoConceito
                key={conceito.code}
                caseId={caseId}
                professionalProfileId={profissional.professionalProfileId}
                conceito={conceito}
              />
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
