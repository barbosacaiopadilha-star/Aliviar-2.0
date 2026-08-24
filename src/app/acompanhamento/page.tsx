import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/modules/auth/guard";
import { CASE_STATUS_LABELS, type CaseStatus } from "@/modules/cases/types";

import { PortalShellContainer } from "@/components/curadoria/portal-shell-container";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { responsibilityLabel } from "@/modules/connection/continuity-labels";

export const metadata: Metadata = {
  title: "Acompanhamento",
  robots: { index: false, follow: false },
};

/**
 * Superfície do Concierge — Nível 3.
 *
 * @metodo Correção de Domínio §2 — o Concierge recebe o MESMO Case após a Curadoria
 *
 * Mínima de propósito. O Concierge só passa a existir de verdade quando um
 * Case chega até ele, e nenhum chegou ainda em produção. Esta tela prova a
 * chegada: mostra os Cases sob a responsabilidade dele — e nada além disso.
 *
 * A lista não filtra por responsável no TypeScript. Quem filtra é a RLS
 * (`can_access_case`): se aparecer aqui um Case que não é dele, o problema
 * está na policy, e é lá que precisa ser visto. Filtrar aqui esconderia o
 * defeito em vez de revelá-lo.
 */
export default async function AcompanhamentoPage() {
  const state = await requireAnyRole(["concierge", "administrador"]);
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .schema("curadoria")
    .from("cases")
    .select("id, status, responsible_role, created_at, patient_profile_id")
    .order("created_at", { ascending: false });

  const cases = (data ?? []) as { id: string; status: string; responsible_role: string | null; created_at: string; patient_profile_id: string }[];

  // V3 (auditoria 22/08): o Concierge acompanha PESSOAS — o rótulo é o nome
  // da paciente, nunca o UUID truncado do Case.
  const patientIds = [...new Set(cases.map((c) => c.patient_profile_id).filter(Boolean))];
  const { data: perfis } = patientIds.length
    ? await supabase.schema("curadoria").from("profiles").select("id, display_name").in("id", patientIds)
    : { data: [] as { id: string; display_name: string | null }[] };
  const nomePorPaciente = new Map((perfis ?? []).map((p) => [p.id as string, (p.display_name as string | null) ?? null]));

  // D4 (auditoria 22/08): a RLS dá ao administrador a visão GLOBAL — todos
  // os Cases, em qualquer etapa. A descrição da tela dizia a promessa do
  // Concierge ("já passaram pela Curadoria") em cima de uma lista que não a
  // cumpre. Quem olha como supervisor lê a verdade da visão que tem.
  const supervisor = state.roles.includes("administrador") && !state.roles.includes("concierge");

  return (
    <PortalShellContainer
      homeHref="/acompanhamento"
      subtitle="Acompanhamento"
      nav={[{ href: "/acompanhamento", label: "Meus acompanhamentos" }]}
      variant="concierge"
    >
      <div className="space-y-6">
        {/* MESA ADMINISTRATIVA, NÃO VITRINE (decisão do Fundador, 24/08:
            "no painel do Concierge não tem que ter card, deve ser
            administrativo mesmo"). Esta tela é ferramenta de trabalho — a
            mesma régua que a ADR-087 aplicou ao Administrador ("sem card e
            arte"). Saíram a voz editorial do cabeçalho (serifa de jornada) e
            a caixa por item; entrou a tabela que o resto da operação já usa.

            O que NÃO mudou, de propósito: a ordem é a de chegada — apresentá-la
            como fila de urgência inventaria uma régua que não existe; o rótulo
            continua sendo o NOME da pessoa (auditoria de 22/08); e quem responde
            vem de `cases.responsible_role`, a fonte única. */}
        <header className="space-y-1">
          <h1 className="font-sans text-2xl font-semibold text-ink">
            {supervisor ? "Acompanhamentos" : "Meus acompanhamentos"}
          </h1>
          <p className="max-w-reading text-sm text-ink-muted">
            {supervisor
              ? "Visão de supervisão: todos os Cases, em qualquer etapa — quem responde por cada um está ao lado."
              : "Cases que já passaram pela Curadoria e seguem com você até o encerramento."}
          </p>
        </header>

        {cases.length === 0 ? (
          /* O vazio continua dizendo POR QUE está vazio e O QUE fará algo
             aparecer — isso é doutrina, não enfeite. O que saiu foi a caixa
             tracejada centralizada: numa mesa de trabalho ela é arte. */
          <div className="space-y-1 border-t border-border pt-4">
            <p className="text-sm font-medium text-ink">Nenhum acompanhamento no momento</p>
            <p className="max-w-reading text-sm text-ink-muted">
              Nenhuma Curadoria foi concluída e encaminhada a você ainda. Quando um Curador
              concluir e encaminhar, o Case aparece aqui — o mesmo Case, com você como responsável.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-ink-muted">
              {cases.length} {cases.length === 1 ? "caso" : "casos"}, do mais recente ao mais antigo.
            </p>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Pessoa</TableHeaderCell>
                  <TableHeaderCell>Etapa</TableHeaderCell>
                  <TableHeaderCell>Quem responde</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cases.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <span className="font-medium text-ink">
                        {nomePorPaciente.get(c.patient_profile_id) ?? `Case ${c.id.slice(0, 8)}`}
                      </span>
                    </TableCell>
                    <TableCell>{CASE_STATUS_LABELS[c.status as CaseStatus] ?? c.status}</TableCell>
                    <TableCell>{responsibilityLabel(c.responsible_role)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </PortalShellContainer>
  );
}
