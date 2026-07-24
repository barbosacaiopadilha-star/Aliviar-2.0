/**
 * Patient Summary + Restriction Summary — Área 1 da Mesa de Curadoria.
 *
 * @metodo Experience §3 — copiloto antecipa, não interroga: o contexto está à vista, nunca atrás de navegação
 * @metodo Ontologia §3.1 — Paciente representa a pessoa, nunca a doença
 * @metodo Ontologia §3.7 — Restrição elimina e nunca recebe peso; toda restrição carrega o motivo do paciente
 * @metodo Engine §5.5 — o Curador vê tudo do caso; lacuna de cadastro aparece como lacuna, nunca inventada
 *
 * Por que existe: o Curador precisa compreender o caso em um olhar, sem trocar
 * de tela — nome, resumo, restrições, documentos e o que se sabe. O que o
 * cadastro não tem aparece como "não registrado", nunca preenchido por
 * suposição.
 *
 * O que nunca faz: resumir a história por conta própria, inventar cidade ou
 * convênio que ninguém declarou, ou esconder uma lacuna para o painel parecer
 * completo.
 */

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { CuradoriaRecord } from "@/modules/curadoria/cos/types";

function fact(label: string, value: string | null | undefined) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className={value ? "mt-0.5 text-sm text-ink" : "mt-0.5 text-sm italic text-ink-muted"}>
        {value ?? "Não registrado — nada foi presumido."}
      </dd>
    </div>
  );
}

export function MesaContextPanel({ record }: { record: CuradoriaRecord }) {
  const uf = record.filtros.find((filtro) => filtro.kind === "UF")?.value ?? null;

  return (
    <Card className="space-y-5">
      <CardHeader>
        <CardTitle>{record.patientName}</CardTitle>
        <CardDescription>
          Caso aberto em {new Date(record.openedAt).toLocaleDateString("pt-BR")}
          {record.promisedReturn
            ? ` · retorno combinado para ${new Date(record.promisedReturn).toLocaleDateString("pt-BR")}`
            : ""}
        </CardDescription>
      </CardHeader>

      {record.caso.clinicalContext ? (
        <p className="max-w-reading text-sm leading-relaxed text-ink">{record.caso.clinicalContext}</p>
      ) : null}

      <dl className="grid gap-3 sm:grid-cols-2">
        {fact("Estado (restrição declarada)", uf)}
        {fact("Convênio", null)}
        {fact(
          "Documentos",
          record.caso.exams.length > 0 ? record.caso.exams.join(" · ") : null,
        )}
        {fact(
          "Limitações relatadas",
          record.caso.limitations.length > 0 ? record.caso.limitations.join(" · ") : null,
        )}
      </dl>

      <div>
        <h3 className="text-xs uppercase tracking-wide text-ink-muted">
          Restrições — eliminam, nunca pesam
        </h3>
        {record.filtros.length === 0 ? (
          <p className="mt-1.5 text-sm text-ink-muted">
            Nenhum requisito inegociável — e isso é um resultado válido.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {record.filtros.map((filtro) => (
              <li key={filtro.id}>
                <p className="text-sm font-medium text-ink">
                  {filtro.value === "true" ? filtro.label : `${filtro.label}: ${filtro.value}`}
                </p>
                <p className="mt-0.5 border-l-2 border-border pl-2 text-xs italic leading-relaxed text-ink-muted">
                  {filtro.reason}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
