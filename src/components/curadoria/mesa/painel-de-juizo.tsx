"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  registrarJulgamentoAction,
  retirarJulgamentoAction,
  type DesfechoDoJulgamento,
} from "@/modules/curadoria/julgamento-actions";
import type { JulgamentoLido, LacunaDeJuizo } from "@/modules/curadoria/julgamentos";
import {
  TITULO_DA_SITUACAO,
  modelosDoConceito,
} from "@/modules/curadoria/modelos-de-redacao";
import {
  MARCA_DO_AGUARDO,
  MARCA_DO_DESFECHO,
  classeDoPapel,
} from "./gramatica-de-estados";

/**
 * O PAINEL DE JUÍZO da etapa AVALIAÇÃO (Item 2.3 §13/§16) — a menor
 * superfície necessária.
 *
 * O que ele mostra: as evidências (por referência), o aguardo NOMEADO, o
 * vigente com sua atualidade, o histórico. O que ele recebe: a decisão
 * EXPLÍCITA do Curador — conclusão digitada num campo que NASCE VAZIO,
 * sempre, inclusive na revisão pós-JS3 (G-2.3-5: zero minuta automática,
 * zero pré-preenchimento, zero carry-forward; copiar a conclusão anterior é
 * decisão humana de digitar de novo). Texto em edição morre no cliente — não
 * é julgamento, não persiste, não é segunda origem (ADR-067 §13b).
 *
 * A biblioteca de modelos de redação (CONTRATO_BIBLIOTECA_DE_REDACAO) não
 * abre exceção nenhuma a isso: os textos vivem FORA do campo, abrir a lista
 * não o toca, e nada entra sem o ato do Curador — que é exatamente o recorte
 * da G-2.3-5 emendada em 2026-08-09. São constantes do build: nenhuma rede,
 * nenhum fornecedor, nenhum dado sai da Aliviar.
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

/**
 * O desfecho de um ato, com cor e sinal (E-2). A TRADUÇÃO é a de sempre —
 * `DESFECHO_LEGIVEL` abaixo não muda uma vírgula; o que se acrescenta é a
 * camada visual que faltava, vinda da gramática central.
 *
 * Dois cuidados que a auditoria nomeou e este componente respeita:
 * `VERSAO_JA_GRAVADA` é **sucesso idempotente** e não pode parecer falha; e
 * o aguardo por evidência nova é **atualidade**, nunca erro.
 */
function MarcaDoDesfecho({ desfecho }: { desfecho: DesfechoDoJulgamento["desfecho"] }) {
  const marca = MARCA_DO_DESFECHO[desfecho];
  return (
    <span className="inline-flex items-baseline gap-1 text-xs text-ink-muted">
      <span aria-hidden="true" className={classeDoPapel(marca.papel)}>
        {marca.sinal}
      </span>
      {DESFECHO_LEGIVEL[desfecho]}
    </span>
  );
}

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
  // resquício local quando a cadeia avança. Os modelos de redação NÃO
  // mudam isso: abrir a lista não toca no campo, e nenhum texto entra sem
  // um clique explícito do Curador em "Usar este".
  const [conclusao, setConclusao] = useState("");
  const [motivo, setMotivo] = useState("");
  const [selecionadas, setSelecionadas] = useState<Record<string, boolean>>({});
  const [resultado, setResultado] = useState<DesfechoDoJulgamento["desfecho"] | null>(null);
  // Abrir/fechar a lista é estado puramente local. Não há geração, não há
  // espera, não há falha: os textos são constantes do build.
  const [modelosAbertos, setModelosAbertos] = useState(false);

  // A biblioteca do cartão — escolhida SÓ pelo conceito. Nenhum Case,
  // profissional, evidência ou paciente participa desta decisão.
  const modelos = modelosDoConceito(conceito.code);

  // O texto vai para o campo SÓ por este caminho, e a partir daí é texto
  // comum: totalmente editável, sem trecho travado, sem vínculo com o
  // modelo. Se já houver trabalho do Curador no campo, ele confirma antes —
  // o que ele escreveu nunca some por clique acidental.
  const usarModelo = (texto: string) => {
    if (conclusao.trim().length > 0) {
      const segue = window.confirm(
        "Substituir o que você já escreveu por este modelo?",
      );
      if (!segue) return;
    }
    setConclusao(texto);
  };

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
      setResultado(desfecho.desfecho);
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

      {/* Escrever do zero é o PADRÃO, não a opção secundária: o botão fica
          ABAIXO do campo, nunca acima, e o campo funciona sem ele. Abrir a
          lista é instantâneo — os textos são constantes do build. */}
      {modelos.length > 0 ? (
        <div className="space-y-2" data-testid={`modelos-${conceito.code}`}>
          <button
            type="button"
            className="rounded-md border border-edge px-2 py-1 text-xs"
            aria-expanded={modelosAbertos}
            onClick={() => setModelosAbertos((aberto) => !aberto)}
          >
            Modelos de redação
          </button>

          {modelosAbertos ? (
            <div className="space-y-2 rounded-md border border-edge/60 p-2">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[11px] text-ink-muted">
                  Modelos de redação — nenhum é uma conclusão. Escolha, edite ou ignore.
                </p>
                <button
                  type="button"
                  aria-label="Fechar modelos de redação"
                  className="text-xs text-ink-muted"
                  onClick={() => setModelosAbertos(false)}
                >
                  ✕
                </button>
              </div>
              {modelos.map((modelo) => (
                <div key={modelo.id} className="space-y-1">
                  <p className="text-[11px] font-medium text-ink-muted">
                    {TITULO_DA_SITUACAO[modelo.situacao]}
                  </p>
                  <p className="text-xs">{modelo.texto}</p>
                  <button
                    type="button"
                    className="rounded-md border border-edge px-2 py-0.5 text-[11px]"
                    onClick={() => usarModelo(modelo.texto)}
                  >
                    Usar este texto
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

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
        {resultado ? <MarcaDoDesfecho desfecho={resultado} /> : null}
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
  const [resultado, setResultado] = useState<DesfechoDoJulgamento["desfecho"] | null>(null);

  const retirar = (versaoVigenteId: string) => {
    startTransition(async () => {
      const desfecho = await retirarJulgamentoAction({ versaoVigenteId, motivo: null });
      setResultado(desfecho.desfecho);
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
            {resultado ? <MarcaDoDesfecho desfecho={resultado} /> : null}
          </div>
        </div>
      ) : (
        <>
          {conceito.lacuna ? (
            <p
              className="flex items-baseline gap-1 text-xs font-medium text-ink-muted"
              data-testid={`aguardo-${conceito.code}`}
            >
              {/* Âmbar: falta ato humano. Nunca vermelho — nem o juízo
                  retirado nem a supersessão por evidência nova são falha. */}
              <span aria-hidden="true" className={classeDoPapel(MARCA_DO_AGUARDO[conceito.lacuna].papel)}>
                {MARCA_DO_AGUARDO[conceito.lacuna].sinal}
              </span>
              <span>{MOTIVO_DO_AGUARDO[conceito.lacuna]}</span>
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
          O Motor lê e sinaliza; a conclusão é sua — registrada, versionada e auditável. Nada é
          pré-preenchido ou copiado. Se quiser, comece de um modelo de redação e edite livremente.
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
