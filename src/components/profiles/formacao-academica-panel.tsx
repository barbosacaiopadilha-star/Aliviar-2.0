"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FORMACAO_KINDS,
  FORMACAO_KIND_LABELS,
  type FormacaoEntrada,
} from "@/modules/profiles/formacao-academica";
import {
  confirmarFormacaoAction,
  criarFormacaoManualAction,
  excluirFormacaoAction,
  lerCurriculoAction,
  salvarFormacaoAction,
} from "@/modules/profiles/formacao-academica-actions";
import type { CamposDeFormacao } from "@/modules/profiles/formacao-academica-repository";

/**
 * FORMAÇÃO ACADÊMICA — a mesa de revisão da equipe.
 *
 * O formulário ABRE PREENCHIDO com o que a leitura do currículo propôs (ou o
 * que já foi salvo): a digitação dá lugar à conferência. Cada formação é
 * revisada, corrigida e confirmada INDIVIDUALMENTE — não existe "confirmar
 * tudo". O que a leitura não encontrou fica vazio, e vazio fica: preencher é
 * decisão humana, nunca palpite de máquina.
 */

type Curriculo = {
  documentId: string;
  fileName: string;
  ultimaLeitura: { status: string; erro: string | null } | null;
};

const STATUS_LABEL: Record<string, { texto: string; variant: "default" | "sage" | "attention" }> = {
  nao_verificado: { texto: "Aguardando revisão", variant: "default" },
  verificado: { texto: "Verificada", variant: "sage" },
  divergente: { texto: "Divergente", variant: "attention" },
};

function paraCampos(e: FormacaoEntrada): CamposDeFormacao {
  return {
    kind: e.kind,
    title: e.title,
    institution: e.institution,
    city: e.city,
    country: e.country,
    periodStart: e.periodStart,
    periodEnd: e.periodEnd,
    notes: e.notes,
  };
}

const CAMPOS_VAZIOS: CamposDeFormacao = {
  kind: "graduacao",
  title: "",
  institution: null,
  city: null,
  country: null,
  periodStart: null,
  periodEnd: null,
  notes: null,
};

export function FormacaoAcademicaPanel({
  professionalProfileId,
  entradas,
  curriculos,
}: {
  professionalProfileId: string;
  entradas: FormacaoEntrada[];
  curriculos: Curriculo[];
}) {
  const [pendente, startTransition] = useTransition();
  const [aviso, setAviso] = useState<string | null>(null);
  const [emEdicao, setEmEdicao] = useState<Record<string, CamposDeFormacao>>({});
  const [justificativas, setJustificativas] = useState<Record<string, string>>({});
  const [novaManual, setNovaManual] = useState(false);
  const [camposManuais, setCamposManuais] = useState<CamposDeFormacao>(CAMPOS_VAZIOS);

  const editar = (id: string, muda: Partial<CamposDeFormacao>, base: FormacaoEntrada) => {
    setEmEdicao((atual) => ({ ...atual, [id]: { ...(atual[id] ?? paraCampos(base)), ...muda } }));
  };

  const rodar = (acao: () => Promise<{ success: boolean; error?: string }>) => {
    setAviso(null);
    startTransition(async () => {
      const r = await acao();
      if (!r.success) setAviso(r.error ?? "Não foi possível concluir.");
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Formação acadêmica</CardTitle>
        <p className="mt-1 text-sm text-ink-muted">
          A leitura do currículo propõe; a equipe revisa e confirma. Só o confirmado chega ao
          paciente.
        </p>
      </CardHeader>

      {aviso ? (
        <p role="alert" className="mb-4 rounded-md border border-border bg-canvas px-3 py-2 text-sm text-ink">
          {aviso}
        </p>
      ) : null}

      <section aria-label="Currículos anexados" className="mb-6">
        <h3 className="text-sm font-medium text-ink">Currículos anexados</h3>
        {curriculos.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">
            Nenhum currículo em PDF anexado. Anexe em Documentos para ler automaticamente.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {curriculos.map((c) => (
              <li key={c.documentId} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                <span className="min-w-0 truncate text-sm text-ink">{c.fileName}</span>
                <span className="flex shrink-0 items-center gap-2">
                  {c.ultimaLeitura?.erro === "requer_pdf_textual" || c.ultimaLeitura?.erro === "pdf_ilegivel" ? (
                    <Badge variant="attention">Requer currículo em PDF textual ou DOCX</Badge>
                  ) : null}
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={pendente}
                    onClick={() =>
                      rodar(() => lerCurriculoAction(professionalProfileId, c.documentId))
                    }
                  >
                    Ler currículo e propor formações
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Formações do profissional">
        {entradas.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Nenhuma formação registrada ainda. Leia um currículo acima para começar.
          </p>
        ) : (
          <ul className="space-y-4">
            {entradas.map((e) => {
              const campos = emEdicao[e.id] ?? paraCampos(e);
              const status = STATUS_LABEL[e.verificationStatus] ?? STATUS_LABEL.nao_verificado;
              const semInstituicao = !campos.institution?.trim();
              return (
                <li key={e.id} className="rounded-md border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant={status.variant}>{status.texto}</Badge>
                    {e.origem ? (
                      <span className="text-xs text-ink-muted">
                        {e.origem.humanEdited ? "Proposta pela leitura · revisada" : "Proposta pela leitura do currículo"}
                      </span>
                    ) : (
                      <span className="text-xs text-ink-muted">Registrada manualmente</span>
                    )}
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="text-sm text-ink">
                      Tipo
                      <select
                        className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                        value={campos.kind}
                        onChange={(ev) => editar(e.id, { kind: ev.target.value }, e)}
                      >
                        {FORMACAO_KINDS.map((k) => (
                          <option key={k} value={k}>
                            {FORMACAO_KIND_LABELS[k]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm text-ink">
                      Título, curso ou área
                      <input
                        className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                        value={campos.title}
                        onChange={(ev) => editar(e.id, { title: ev.target.value }, e)}
                      />
                    </label>
                    <label className="text-sm text-ink sm:col-span-2">
                      Instituição
                      <input
                        className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                        value={campos.institution ?? ""}
                        placeholder="Obrigatória para publicar quando constar do currículo"
                        onChange={(ev) => editar(e.id, { institution: ev.target.value || null }, e)}
                      />
                    </label>
                    <label className="text-sm text-ink">
                      Cidade
                      <input
                        className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                        value={campos.city ?? ""}
                        onChange={(ev) => editar(e.id, { city: ev.target.value || null }, e)}
                      />
                    </label>
                    <label className="text-sm text-ink">
                      País
                      <input
                        className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                        value={campos.country ?? ""}
                        onChange={(ev) => editar(e.id, { country: ev.target.value || null }, e)}
                      />
                    </label>
                    <label className="text-sm text-ink">
                      Ano de início
                      <input
                        type="number"
                        className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                        value={campos.periodStart ?? ""}
                        onChange={(ev) =>
                          editar(e.id, { periodStart: ev.target.value ? Number(ev.target.value) : null }, e)
                        }
                      />
                    </label>
                    <label className="text-sm text-ink">
                      Ano de conclusão
                      <input
                        type="number"
                        className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                        value={campos.periodEnd ?? ""}
                        onChange={(ev) =>
                          editar(e.id, { periodEnd: ev.target.value ? Number(ev.target.value) : null }, e)
                        }
                      />
                    </label>
                  </div>

                  {semInstituicao && e.verificationStatus !== "verificado" ? (
                    <label className="mt-3 block text-sm text-ink">
                      Justificativa para confirmar sem instituição
                      <input
                        className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                        value={justificativas[e.id] ?? ""}
                        placeholder="Ex.: o currículo não nomeia a instituição desta formação"
                        onChange={(ev) =>
                          setJustificativas((j) => ({ ...j, [e.id]: ev.target.value }))
                        }
                      />
                    </label>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pendente}
                      onClick={() =>
                        rodar(() => salvarFormacaoAction(professionalProfileId, e.id, campos))
                      }
                    >
                      Salvar revisão
                    </Button>
                    {e.verificationStatus !== "verificado" ? (
                      <Button
                        type="button"
                        disabled={pendente}
                        onClick={() =>
                          rodar(() =>
                            confirmarFormacaoAction(
                              professionalProfileId,
                              e.id,
                              justificativas[e.id]?.trim() || undefined,
                            ),
                          )
                        }
                      >
                        Confirmar esta formação
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={pendente}
                      onClick={() => rodar(() => excluirFormacaoAction(professionalProfileId, e.id))}
                    >
                      Excluir
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-label="Registro manual" className="mt-6 border-t border-border pt-4">
        {novaManual ? (
          <div className="rounded-md border border-border p-4">
            <p className="text-sm text-ink-muted">
              Registro manual — contingência para currículo visual ou formação fora do documento.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-ink">
                Tipo
                <select
                  className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                  value={camposManuais.kind}
                  onChange={(ev) => setCamposManuais((c) => ({ ...c, kind: ev.target.value }))}
                >
                  {FORMACAO_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {FORMACAO_KIND_LABELS[k]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-ink">
                Título, curso ou área
                <input
                  className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                  value={camposManuais.title}
                  onChange={(ev) => setCamposManuais((c) => ({ ...c, title: ev.target.value }))}
                />
              </label>
              <label className="text-sm text-ink sm:col-span-2">
                Instituição
                <input
                  className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                  value={camposManuais.institution ?? ""}
                  onChange={(ev) =>
                    setCamposManuais((c) => ({ ...c, institution: ev.target.value || null }))
                  }
                />
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                disabled={pendente || !camposManuais.title.trim()}
                onClick={() =>
                  rodar(async () => {
                    const r = await criarFormacaoManualAction(professionalProfileId, camposManuais);
                    if (r.success) {
                      setCamposManuais(CAMPOS_VAZIOS);
                      setNovaManual(false);
                    }
                    return r;
                  })
                }
              >
                Registrar
              </Button>
              <Button type="button" variant="ghost" onClick={() => setNovaManual(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="ghost" onClick={() => setNovaManual(true)}>
            Registrar formação manualmente
          </Button>
        )}
      </section>
    </Card>
  );
}
