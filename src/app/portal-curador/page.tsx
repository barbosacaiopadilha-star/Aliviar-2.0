import { AvailableCases } from "@/components/curadoria/available-cases";
import { FilaPorAtoDevido } from "@/components/curadoria/fila-por-ato-devido";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/modules/auth/guard";
import { listAvailableCases, listCaseIds, loadCuradoriaRecord } from "@/modules/curadoria/cos/repository";
import { fatosDoRegistro, montarFila } from "@/modules/curadoria/fila-por-ato-devido";
import { resolveGreetingFirstName } from "@/modules/auth/display-identity";
// A saudação por horário já existia, testada, do lado da paciente. Esta tela
// escrevia "Bom dia" fixo no código — às 3h da manhã a Mesa dizia "Bom dia" e a
// área da paciente dizia "Boa noite", no mesmo minuto. Uma regra só, e é esta.
import { currentHourInBrazil, greetingFor } from "@/modules/paciente/ambiente";

// MÓDULO 1 — PAINEL INICIAL, agora sobre o banco (MISSÃO 209, Fases 3 e 4).
//
// Qual problema do Curador esta tela resolve?
//   "Eu tenho pessoas em andamento. Por onde eu começo agora?"
//
// A ordenação é por quem precisa de você, derivada do Motor de Condução sobre
// a Memória real — não mais de um campo de mock. Nenhuma métrica de
// produtividade aparece aqui, por decisão de método (Experience §3).

export default async function PainelInicialPage() {
  const auth = await requireAnyRole(["curador_medico", "administrador"]);
  const supabase = await createServerSupabaseClient();

  // A fila de disponíveis é lida junto: um Case sem dono não aparecia para
  // ninguém, e ficava esperando sem que nenhum Curador soubesse que existia.
  // `auth.user.id` explícito: desde que a RLS passou a mostrar ao Curador os
  // Cases sem dono, "visível" deixou de significar "meu". Sem este filtro, um
  // Case disponível aparecia nas duas listas ao mesmo tempo.
  const [caseIds, disponiveis] = await Promise.all([
    listCaseIds(supabase, auth.user.id),
    listAvailableCases(supabase),
  ]);
  const records = (
    await Promise.all(caseIds.map((id) => loadCuradoriaRecord(supabase, id)))
  ).filter((record): record is NonNullable<typeof record> => record !== null);

  // BLOCO 12 · os dois fatos que a Fila precisa e que o `CuradoriaRecord` não
  // carrega: o Caso encerrado sai da Fila, e a entrega legada do motor antigo
  // não é Curadoria estruturada. Ambos são leitura — nada é escrito aqui.
  const [statusPorCaso, legadoPorCaso] = await Promise.all([
    supabase
      .from("cases")
      .select("id, status, closed_at")
      .in("id", caseIds)
      .then(({ data, error }) => {
        if (error) throw error;
        return new Map(
          (data ?? []).map((linha) => [
            linha.id as string,
            { status: linha.status as string, closedAt: linha.closed_at as string | null },
          ]),
        );
      }),
    supabase
      .from("final_curadoria_deliveries")
      .select("case_id")
      .in("case_id", caseIds)
      .then(({ data, error }) => {
        // A tabela legada pode não existir em ambientes novos: a ausência dela
        // significa "nenhuma entrega legada", nunca falha da Fila.
        if (error) return new Set<string>();
        return new Set((data ?? []).map((linha) => linha.case_id as string));
      }),
  ]);

  const fatosDaFila = records.map((record) =>
    fatosDoRegistro(record, {
      status: statusPorCaso.get(record.caseId)?.status ?? "NEW",
      closedAt: statusPorCaso.get(record.caseId)?.closedAt ?? null,
      // Legado é entrega antiga SEM Curadoria estruturada: havendo seleção
      // curada, o Caso é do fluxo vigente e entra na Fila normalmente.
      legadoSemCuradoria:
        legadoPorCaso.has(record.caseId) && record.curadoriaTecnica.curatedSelectionId === null,
    }),
  );

  // BLOCO 12 · a frase do cabeçalho DERIVA da mesma montagem que desenha os
  // grupos — nunca de uma segunda contagem. É a lição do C4 aplicada aqui.
  const { grupos: gruposDaFila, total: totalAtivo } = montarFila(fatosDaFila);
  const esperamVoce = gruposDaFila
    .filter((grupo) => grupo.definicao.temAcaoDoCurador)
    .reduce((soma, grupo) => soma + grupo.contagem, 0);
  const firstName = resolveGreetingFirstName(auth);

  return (
    <div className="space-y-10">
      <header className="max-w-reading space-y-2">
        <h1 className="font-serif text-3xl text-ink">
          {greetingFor(currentHourInBrazil())}, {firstName}.
        </h1>
        <p className="text-base leading-relaxed text-ink-muted">
          {totalAtivo === 0
            ? "Nenhuma Curadoria atribuída a você no momento."
            : esperamVoce === 0
              ? "Nenhum Caso espera um passo seu — os que estão aqui aguardam outra pessoa."
              : esperamVoce === 1
                ? "Uma pessoa espera um passo seu."
                : `${esperamVoce} pessoas esperam um passo seu.`}
        </p>
      </header>

      {totalAtivo === 0 ? (
        // Estado vazio real: o Portal acabou de ser ligado ao banco e a rede
        // ainda não foi cadastrada. Diz o que acontece a seguir em vez de
        // deixar uma tela muda.
        <Card padding="lg" className="max-w-reading space-y-3">
          <CardHeader>
            <CardTitle>Ainda não há Curadorias na sua fila</CardTitle>
            <CardDescription>
              Quando o Atendimento encaminhar um Case ao seu nome, ele aparece aqui com o próximo
              passo já indicado.
            </CardDescription>
          </CardHeader>
          <p className="text-sm leading-relaxed text-ink-muted">
            A fila está atualizada — nada foi perdido e nada está carregando. Você não precisa
            fazer nada agora; esta tela se renova a cada visita.
          </p>
        </Card>
      ) : (
        <FilaPorAtoDevido casos={fatosDaFila} />
      )}

      {/* Depois das suas: o que ainda não é de ninguém. Vem por último de
          propósito — quem já está com você tem precedência sobre o que você
          poderia pegar. */}
      <AvailableCases cases={disponiveis} curatorProfileId={auth.user.id} />
    </div>
  );
}
