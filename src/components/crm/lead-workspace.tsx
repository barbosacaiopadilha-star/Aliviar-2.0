"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { LEAD_SOURCE_LABELS, type DuplicateMatch } from "@/modules/crm/lead";
import type { LeadListItem } from "@/modules/crm/lead-repository";
import { transferCaseResponsibilityAction } from "@/modules/cases/responsibility-actions";
import {
  convertLeadToPatientAction,
  openCaseFromLeadAction,
  qualifyLeadAction,
} from "@/modules/crm/conversion-actions";

/**
 * Área de trabalho do Atendente sobre um lead.
 *
 * @metodo Correção de Domínio §2 — o Atendente qualifica, converte, abre o Case e encaminha
 * @metodo Experience §5 — UX3: nunca esconder o próximo passo
 *
 * Cada botão diz exatamente o que faz — "Qualificar lead", "Converter em
 * paciente", "Abrir atendimento", "Encaminhar ao Curador". Nenhum "Continuar":
 * quem clica precisa saber o que vai acontecer antes de acontecer, porque
 * três dessas quatro ações são irreversíveis.
 *
 * Nenhuma regra de autorização vive aqui. Os botões refletem o estado do lead,
 * não a permissão de quem olha — quem autoriza é o banco, e se ele recusar, a
 * mensagem dele aparece na tela como está. Repetir a regra no cliente criaria
 * uma segunda autoridade que pode divergir da primeira.
 */

type Etapa = "qualificar" | "converter" | "abrir" | "encaminhar" | "concluido";

function etapaAtual(lead: LeadListItem, encaminhado: boolean): Etapa {
  if (encaminhado) return "concluido";
  if (lead.caseId) return "encaminhar";
  if (lead.patientProfileId) return "abrir";
  if (lead.qualifiedAt) return "converter";
  return "qualificar";
}

export function LeadWorkspace({
  lead,
  duplicates,
  curators,
  isAdmin,
}: {
  lead: LeadListItem;
  duplicates: DuplicateMatch[];
  curators: { id: string; name: string }[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [credenciais, setCredenciais] = useState<{ email: string; password: string } | null>(null);
  const [encaminhado, setEncaminhado] = useState(false);

  // Campos do formulário
  const [nome, setNome] = useState(lead.fullName);
  const [email, setEmail] = useState(lead.email ?? "");
  const [historia, setHistoria] = useState(lead.initialReason ?? "");
  const [motivo, setMotivo] = useState("");
  const [excecao, setExcecao] = useState(false);
  const [duplicatasConfirmadas, setDuplicatasConfirmadas] = useState(false);
  const [curadorId, setCuradorId] = useState(curators[0]?.id ?? "");

  const etapa = etapaAtual(lead, encaminhado);
  const bloqueado = pending;

  // A prevenção de duplo clique é o `pending` do transition: enquanto a ação
  // não volta, todo botão fica desabilitado. As operações também são
  // idempotentes no banco — as duas coisas, porque a rede pode reenviar.
  function executar(fn: () => Promise<{ success: boolean; error?: string }>, mensagem: string) {
    if (pending) return;
    setErro(null);
    setSucesso(null);
    startTransition(async () => {
      const resultado = await fn();
      if (resultado.success) {
        setSucesso(mensagem);
        router.refresh();
      } else {
        setErro(resultado.error ?? "Não foi possível concluir a ação.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {erro ? (
        <p role="alert" className="rounded-md border border-error bg-error-surface px-3 py-2 text-sm text-ink">
          {erro}
        </p>
      ) : null}

      {sucesso ? (
        <p role="status" className="rounded-md border border-success bg-success-surface px-3 py-2 text-sm text-ink">
          {sucesso}
        </p>
      ) : null}

      {credenciais ? (
        <div className="rounded-md border border-brand-gold bg-canvas px-3 py-3 text-sm">
          <p className="font-medium text-ink">Acesso do paciente — anote agora</p>
          <p className="mt-1 text-ink-muted">
            Esta senha aparece uma única vez e não pode ser recuperada depois.
          </p>
          <p className="mt-2 break-all font-mono text-sm text-ink">{credenciais.email}</p>
          <p className="break-all font-mono text-sm text-ink">{credenciais.password}</p>
        </div>
      ) : null}

      <section className="rounded-md border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-ink">Contato</h2>
        <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <Campo rotulo="Nome" valor={lead.fullName} />
          <Campo rotulo="Origem" valor={LEAD_SOURCE_LABELS[lead.source]} />
          <Campo rotulo="Telefone" valor={lead.phone} />
          <Campo rotulo="E-mail" valor={lead.email} />
          <Campo rotulo="Cidade" valor={[lead.city, lead.state].filter(Boolean).join(" / ") || null} />
          <Campo rotulo="Prioridade" valor={lead.priority} />
        </dl>
        {lead.initialReason ? (
          <p className="mt-3 max-w-reading text-sm leading-relaxed text-ink">
            <span className="block text-xs text-ink-muted">O que a pessoa contou</span>
            {lead.initialReason}
          </p>
        ) : null}
      </section>

      {/* Duplicidade: mostrada sempre que existir, antes de qualquer conversão.
          Nunca bloqueia — quem decide se é a mesma pessoa é gente. */}
      {duplicates.length > 0 && !lead.patientProfileId ? (
        <section className="rounded-md border border-warning bg-warning-surface p-4">
          <h2 className="text-sm font-semibold text-ink">Pode ser alguém que já está cadastrado</h2>
          <ul className="mt-2 space-y-1 text-sm text-ink">
            {duplicates.map((d) => (
              <li key={d.leadId}>
                {d.confidence === "strong" ? (
                  <>
                    Outro contato com o mesmo <strong>{d.matchedOn.join(" e ")}</strong>.
                  </>
                ) : (
                  <>Outro contato com o mesmo nome — pista fraca, homônimo é comum.</>
                )}{" "}
                <a href={`/atendimento/${d.leadId}`} className="text-brand-primary underline-offset-4 hover:underline">
                  Ver contato
                </a>
              </li>
            ))}
          </ul>
          <label className="mt-3 flex items-start gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={duplicatasConfirmadas}
              onChange={(e) => setDuplicatasConfirmadas(e.target.checked)}
              className="mt-1"
            />
            <span>Conferi e não é a mesma pessoa. Pode criar um paciente novo.</span>
          </label>
        </section>
      ) : null}

      <section className="rounded-md border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-ink">Próximo passo</h2>

        {etapa === "qualificar" ? (
          <>
            <p className="mt-1 text-sm text-ink-muted">
              Qualificar registra que você acolheu o contato e que ele faz sentido para a Aliviar. Sem isso, o contato
              não vira paciente.
            </p>
            <button
              type="button"
              disabled={bloqueado}
              onClick={() => executar(() => qualifyLeadAction({ leadId: lead.id }), "Acolhimento registrado.")}
              className={botao}
            >
              {pending ? "Registrando…" : "Registrar o acolhimento"}
            </button>
          </>
        ) : null}

        {etapa === "converter" ? (
          <>
            <p className="mt-1 text-sm text-ink-muted">
              Converter cria o acesso do paciente. O contato original continua existindo e passa a apontar para ele — a
              origem nunca se perde.
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="block text-ink-muted">Nome do paciente</span>
                <input value={nome} onChange={(e) => setNome(e.target.value)} className={campo} />
              </label>
              <label className="text-sm">
                <span className="block text-ink-muted">E-mail de acesso</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={campo}
                  placeholder="nome@exemplo.com"
                />
              </label>
            </div>

            {isAdmin && lead.qualifiedAt === null ? (
              <label className="mt-3 flex items-start gap-2 text-sm text-ink">
                <input type="checkbox" checked={excecao} onChange={(e) => setExcecao(e.target.checked)} className="mt-1" />
                <span>Converter sem qualificação — exceção administrativa</span>
              </label>
            ) : null}

            {excecao ? (
              <label className="mt-2 block text-sm">
                <span className="block text-ink-muted">Motivo da exceção</span>
                <input value={motivo} onChange={(e) => setMotivo(e.target.value)} className={campo} />
              </label>
            ) : null}

            <button
              type="button"
              disabled={bloqueado || nome.trim() === "" || email.trim() === "" || (duplicates.length > 0 && !duplicatasConfirmadas)}
              onClick={() =>
                executar(
                  () =>
                    convertLeadToPatientAction({
                      leadId: lead.id,
                      displayName: nome.trim(),
                      email: email.trim(),
                      administrativeException: excecao || undefined,
                      reason: motivo.trim() || undefined,
                    }).then((r) => {
                      if (r.success && r.credentials) setCredenciais(r.credentials);
                      return r;
                    }),
                  "Paciente criado a partir deste contato.",
                )
              }
              className={botao}
            >
              {pending ? "Criando…" : "Criar o acesso"}
            </button>

            {duplicates.length > 0 && !duplicatasConfirmadas ? (
              <p className="mt-2 text-xs text-ink-muted">
                Confirme acima que não é a mesma pessoa antes de criar um paciente novo.
              </p>
            ) : null}
          </>
        ) : null}

        {etapa === "abrir" ? (
          <>
            <p className="mt-1 text-sm text-ink-muted">
              Abrir o atendimento cria o Case. É este mesmo Case que vai percorrer toda a jornada — ele muda de
              responsável, nunca de identidade.
            </p>
            <label className="mt-3 block text-sm">
              <span className="block text-ink-muted">O que a pessoa contou</span>
              <textarea
                value={historia}
                onChange={(e) => setHistoria(e.target.value)}
                rows={4}
                className={`${campo} resize-y`}
              />
            </label>
            <button
              type="button"
              disabled={bloqueado || historia.trim() === ""}
              onClick={() =>
                executar(
                  () => openCaseFromLeadAction({ leadId: lead.id, initialStory: historia.trim() }),
                  "Atendimento aberto.",
                )
              }
              className={botao}
            >
              {pending ? "Abrindo…" : "Abrir atendimento"}
            </button>
          </>
        ) : null}

        {etapa === "encaminhar" ? (
          <>
            <p className="mt-1 text-sm text-ink-muted">
              Encaminhar entrega este mesmo Case ao Curador. A partir daí ele conduz — e você deixa de ser o
              responsável.
            </p>

            {curators.length === 0 ? (
              <p className="mt-3 rounded-md border border-warning bg-warning-surface px-3 py-2 text-sm text-ink">
                Nenhuma pessoa com o papel de Curador está cadastrada. Sem isso não há a quem encaminhar.
              </p>
            ) : (
              <>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">
                    <span className="block text-ink-muted">Curador</span>
                    <select value={curadorId} onChange={(e) => setCuradorId(e.target.value)} className={campo}>
                      {curators.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm">
                    <span className="block text-ink-muted">Motivo do encaminhamento</span>
                    <input
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      className={campo}
                      placeholder="Contato qualificado, pronto para a Curadoria."
                    />
                  </label>
                </div>

                <button
                  type="button"
                  disabled={bloqueado || motivo.trim() === "" || curadorId === ""}
                  onClick={() =>
                    executar(() => {
                      setEncaminhado(true);
                      return transferCaseResponsibilityAction({
                        caseId: lead.caseId!,
                        newResponsibleId: curadorId,
                        newRole: "curador_medico",
                        reason: motivo.trim(),
                      });
                    }, "Case encaminhado ao Curador.")
                  }
                  className={botao}
                >
                  {pending ? "Encaminhando…" : "Encaminhar ao Curador"}
                </button>

                {motivo.trim() === "" ? (
                  <p className="mt-2 text-xs text-ink-muted">
                    O motivo fica registrado na auditoria — é o que permite reconstruir depois por que o Case mudou de
                    mão.
                  </p>
                ) : null}
              </>
            )}
          </>
        ) : null}

        {etapa === "concluido" ? (
          <p className="mt-1 text-sm text-ink-muted">
            Este Case está com o Curador. Você deixa de vê-lo na sua fila — o histórico da passagem fica registrado.
          </p>
        ) : null}
      </section>

      {lead.caseId ? (
        <p className="text-xs text-ink-muted">
          Case <span className="font-mono">{lead.caseId}</span> — o mesmo do início ao fim.
        </p>
      ) : null}
    </div>
  );
}

const botao =
  "mt-3 inline-flex min-h-11 items-center justify-center rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

const campo =
  "mt-1 block w-full min-h-11 rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

function Campo({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{rotulo}</dt>
      <dd className="text-ink">{valor ?? "—"}</dd>
    </div>
  );
}
