import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { duracao } from "@/modules/curadoria/medicao-da-curadoria";
import { medirTodosOsCases } from "@/modules/curadoria/medicao-repository";

import { Card, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Medição da Curadoria",
  robots: { index: false, follow: false },
};

/**
 * QUANTO CUSTA UMA CURADORIA — ADR-089.
 *
 * A operação nunca foi medida. Esta tela existe para que a decisão sobre
 * simplificar o Método (cortar o Mapa de 29? as 15 conversas?) seja tomada
 * com número, não com impressão.
 *
 * ADMINISTRADOR, NUNCA O CURADOR. Um cronômetro à vista de quem exerce juízo
 * clínico pressiona esse juízo — e pressa é o que o Método menos quer
 * comprar. Além disso corromperia a medição: ninguém mede bem o que se sabe
 * medido. `requireRole("administrador")` é a porta, e o menu do Curador não
 * tem este item.
 */
export default async function MedicaoPage() {
  await requireRole("administrador");

  const supabase = await createServerSupabaseClient();
  const casos = await medirTodosOsCases(supabase);

  const completos = casos.filter((c) => c.medicao.completa);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h1 className="font-serif text-2xl text-ink">Quanto custa uma Curadoria</h1>
          <p className="text-sm text-ink-muted">
            Medido do que o sistema já registrava — cada ato da Curadoria data a si mesmo desde
            que foi construído. Nada foi instrumentado para esta tela.
          </p>
        </CardHeader>

        <div className="space-y-3 rounded-md border border-border bg-recessed p-4 text-sm text-ink">
          <p className="font-semibold">Como ler estes números — as duas colunas medem coisas diferentes</p>
          <p>
            <strong>Espera</strong> é tempo de relógio entre o fim de uma etapa e o fim da
            seguinte. Inclui noite, fim de semana e o tempo em que se aguardou a paciente. É o
            tempo que <em>ela</em> sente passando — não é esforço de ninguém.
          </p>
          <p>
            <strong>Janela</strong> é do primeiro ao último registro dentro da etapa. É o mais
            perto de &quot;quanto tempo alguém ficou nisso&quot; que este dado permite — e ainda
            assim é um <strong>piso, nunca uma medida de esforço</strong>: quem abre a Mesa e vai
            almoçar infla a janela; quem prepara no papel e registra de uma vez a esvazia. Etapa
            de registro único tem janela &quot;—&quot;, não zero.
          </p>
          <p className="text-ink-muted">
            <strong>Atos</strong> é quantos registros a etapa exigiu. É o número da carga — e é
            o único destes três que não tem ressalva nenhuma.
          </p>
        </div>
      </Card>

      {casos.length === 0 ? (
        <Card>
          <CardHeader>
            <h2 className="font-sans text-lg font-semibold text-ink">
              Nenhuma Curadoria para medir ainda
            </h2>
            <p className="text-sm text-ink-muted">
              A primeira medição nasce da primeira Curadoria real. Esta tela foi construída
              antes dela de propósito: instrumento que chega depois do fato não mede o fato.
            </p>
          </CardHeader>
        </Card>
      ) : null}

      {completos.length === 0 && casos.length > 0 ? (
        <Card>
          <p className="text-sm text-ink">
            Nenhuma Curadoria chegou à decisão ainda. As medições abaixo são <strong>parciais</strong>:
            servem para acompanhar o que está em curso, não para comparar durações.
          </p>
        </Card>
      ) : null}

      {casos.map(({ caseId, abertoEm, medicao }) => (
        <Card key={caseId}>
          <CardHeader>
            <h2 className="font-sans text-lg font-semibold text-ink">
              {abertoEm ? new Date(abertoEm).toLocaleDateString("pt-BR") : "Sem data de abertura"}
              {medicao.completa ? "" : " · em curso"}
            </h2>
            <p className="text-sm text-ink-muted">
              {medicao.registrosTotais} atos de juízo registrados
              {medicao.totalMs !== null ? ` · ${duracao(medicao.totalMs)} do Case aberto à escolha dela` : ""}
              {medicao.janelaTotalMs > 0
                ? ` · ${duracao(medicao.janelaTotalMs)} somando as janelas de registro`
                : ""}
            </p>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="py-2 pr-4 font-medium">Etapa</th>
                  <th className="py-2 pr-4 font-medium">Espera</th>
                  <th className="py-2 pr-4 font-medium">Janela</th>
                  <th className="py-2 font-medium">Atos</th>
                </tr>
              </thead>
              <tbody>
                {medicao.etapas.map((etapa) => (
                  <tr key={etapa.id} className="border-b border-border">
                    <td className="py-2 pr-4 text-ink">{etapa.label}</td>
                    <td className="py-2 pr-4 text-ink-muted">{duracao(etapa.esperaMs)}</td>
                    <td className="py-2 pr-4 text-ink-muted">{duracao(etapa.janelaMs)}</td>
                    <td className="py-2 text-ink-muted">{etapa.registros > 0 ? etapa.registros : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
}
