import Link from "next/link";

import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { computeIndicators, type Metric } from "@/modules/admin/dashboard-metrics";
import { loadDashboardSource } from "@/modules/admin/dashboard-repository";
import { requireRole } from "@/modules/auth/guard";
import { listProfessionalProfiles } from "@/modules/profiles";

import { KitDaCuradoriaCard } from "@/components/admin/kit-da-curadoria-card";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

// noindex: área autenticada — nunca deve ser indexada (ver também robots.ts).
export const metadata: Metadata = {
  title: "Administrador",
  robots: { index: false, follow: false },
};

/**
 * Painel executivo do Administrador.
 *
 * @metodo Correção do Administrador §1 — acesso global e governança, não responsabilidade operacional
 * @metodo Correção do Administrador §5 — executivo e operacional, nunca só uma lista de registros
 *
 * O Administrador enxerga tudo. Isso não faz dele o dono de nenhum Case — por
 * isso o painel mostra a operação em números e apontamentos, e não uma fila de
 * trabalho dele. Onde há alguém parado ou faltando responsável, o painel diz;
 * quem age é o nível certo.
 */

function formatMetric(value: Metric, suffix = ""): string {
  if (value === null) return "—";
  const rounded = Number.isInteger(value) ? value : Math.round(value * 10) / 10;
  return `${rounded.toLocaleString("pt-BR")}${suffix}`;
}

function StatCard({
  label,
  value,
  suffix,
  href,
  emphasis,
  detail,
}: {
  label: string;
  value: Metric;
  suffix?: string;
  href?: string;
  /** Uma linha de contexto sob o número — o denominador de uma taxa, por exemplo. */
  detail?: string;
  /** Números que pedem ação quando existem — ênfase por peso, nunca por alarme. */
  emphasis?: boolean;
}) {
  const unavailable = value === null;
  const alerta = emphasis && typeof value === "number" && value > 0;
  /**
   * Zero é ausência, e ausência não merece o peso de um número.
   *
   * A Visão geral abria com doze indicadores no mesmo corpo escuro e no mesmo
   * peso — e, numa operação em repouso, isso são doze zeros gigantes. O olho
   * percorria doze vezes o nada antes de encontrar qualquer coisa que
   * exigisse ação: hierarquia exatamente invertida para uma tela cuja função
   * é dizer onde agir agora.
   *
   * O zero continua inteiro e legível — a operação precisa saber que é zero,
   * e esconder ausência é como se fabrica um dado que ninguém confere. Ele só
   * recua de peso, para que o primeiro ponto de atenção volte a ser o que tem
   * algo a dizer.
   */
  const zerado = value === 0;

  const content = (
    <Card padding="lg" className="h-full">
      <p className="text-sm text-ink-muted">{label}</p>
      <p
        className={`mt-1 font-serif ${
          unavailable || zerado
            ? "text-2xl font-normal text-ink-muted"
            : alerta
              ? "text-3xl font-semibold text-brand-gold"
              : "text-3xl font-semibold text-brand-primary-deep"
        }`}
      >
        {formatMetric(value, suffix)}
      </p>
      {/* Dizia "Informação indisponível", que soa a falha de sistema — e não
          é: o indicador é nulo porque ainda não há o que contar no período.
          Numa operação que ainda não curou, era o que o operador via em quatro
          cartões ao abrir a tela. A própria página já sabe falar assim em
          "Nenhuma pendência no momento". */}
      {unavailable ? (
        <p className="mt-0.5 text-xs text-ink-muted">Sem dados neste período</p>
      ) : detail ? (
        <p className="mt-0.5 text-xs text-ink-muted">{detail}</p>
      ) : null}
    </Card>
  );

  return href ? (
    <Link href={href} className="block transition-opacity hover:opacity-80">
      {content}
    </Link>
  ) : (
    content
  );
}

export default async function AdminDashboardPage() {
  const state = await requireRole("administrador");

  const regularClient = await createServerSupabaseClient();
  const now = new Date();

  const [source, professionals] = await Promise.all([
    loadDashboardSource(regularClient),
    listProfessionalProfiles(regularClient),
  ]);

  // CORTE DE 24/08 (auditoria do Fundador) · o seletor de período saiu com
  // a aquisição, os tempos médios e os gráficos: os números que ficaram são
  // fotografias do agora, não séries. "30d" segue como janela interna do
  // cálculo — nada muda no módulo de métricas, que fica inteiro para quando
  // o Observatório tiver volume para desenhar.
  const indicators = computeIndicators(source, "30d", now);

  // Indicador é sobre a Rede real. Demonstração e fixture de certificação
  // existem para exercitar telas e contratos; contá-las aqui faria o
  // Administrador ver trabalho pendente que não existe — e, pior, faria a
  // Rede parecer maior do que é.
  const pendingPublication = professionals.filter(
    (professional) =>
      professional.status === "ativo" &&
      professional.publicationStatus === "nao_publicado" &&
      !professional.isDemo &&
      !professional.isTestFixture,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-sans text-2xl font-semibold text-ink">
            Olá, {state.profile?.displayName ?? "Administrador"}
          </h1>
          <p className="text-sm text-ink-muted">Visão executiva da operação da Aliviar.</p>
        </div>

      </div>

      {/* ONE ALIVIAR, Problema 5: a Home responde "onde preciso agir agora?"
          — os números que doem vêm primeiro; aquisição e estatística, depois. */}
      <section aria-labelledby="pendencias">
        <h2 id="pendencias" className="mb-2 text-sm font-semibold text-ink-muted">
          Onde agir agora
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Primeiro do bloco: quem já contou a própria história e ainda não
              tem Case é a espera mais silenciosa da operação — a pessoa fez a
              parte dela, e nenhum outro indicador desta tela a enxerga. */}
          <StatCard
            label="Histórias aguardando Case"
            value={indicators.historiasAguardandoCase}
            href="/admin/pacientes"
            emphasis
          />
          <StatCard label="Sem responsável" value={indicators.casesSemResponsavel} href="/admin/casos" emphasis />
          <StatCard label="Cases atrasados" value={indicators.casesAtrasados} emphasis />
          <StatCard label="Tarefas vencidas" value={indicators.tarefasVencidas} emphasis />
          <StatCard label="Compromissos em 7 dias" value={indicators.compromissosProximos} />
          <StatCard label="Documentos pendentes" value={indicators.documentosPendentes} emphasis />
        </div>
      </section>

      {/* CORTE DE 24/08 (auditoria do Fundador, "sem card e arte"): a Visão
          geral era um cockpit de frota para uma operação de poucos casos —
          16 números em 4 seções + 5 gráficos + pessoas por papel + log de
          auditoria. Ficou UMA pergunta: "o que precisa de alguém agora?".

          O que saiu, e para onde foi:
           · os 5 gráficos (funil, tendência, 3 barras) — apagados com a
             régua do substituto vivo; o módulo de métricas fica inteiro
             para quando o Observatório tiver volume para desenhar;
           · Aquisição e Tempos médios — média com n=1 é ruído estatístico
             vestido de gestão (contrato 34 §6.5 na prática);
           · Pessoas por papel (+ aviso de acúmulo) e Atividade recente →
             /admin/equipe, que é onde papéis se concedem. */}
      {/* 2ª passada de 24/08 · a seção "Operação" saiu: "Cases abertos" e
          "Pacientes ativos" eram contagens das listas que o menu já abre —
          lista disfarçada de indicador. "Documentos pendentes", que é
          pendência de verdade, subiu para "Onde agir agora". */}

      {/* items-start (02/09, `SIM-89`): sem isto o grid estica as duas colunas
          para a mesma altura, e a esquerda ficava com 1.181px de branco —
          medido: cartão de 1.586px para 405px de conteúdo, porque o Kit ao
          lado tem 1.529px. É a primeira tela que o Administrador vê. Duas
          colunas de alturas diferentes é o desenho honesto: cada cartão ocupa
          o que tem. */}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-sans text-lg font-semibold text-ink">Pendências</h2>
            <p className="text-sm text-ink-muted">Profissionais ativos aguardando decisão de publicação.</p>
          </CardHeader>

          {pendingPublication.length === 0 ? (
            <EmptyState
              title="Nenhuma pendência no momento."
              description="Todos os profissionais ativos já têm uma decisão de publicação registrada."
            />
          ) : (
            <ul className="divide-y divide-border">
              {pendingPublication.map((professional) => (
                <li key={professional.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="font-medium text-ink">{professional.displayName}</span>
                  <Link
                    href={`/admin/profissionais/${professional.id}`}
                    className="font-medium text-brand-primary hover:text-brand-primary-deep"
                  >
                    Revisar
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <KitDaCuradoriaCard />
      </div>
    </div>
  );
}
