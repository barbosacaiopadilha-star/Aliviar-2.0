/**
 * O que importa para esta pessoa — Área 2 da Mesa de Curadoria (aside).
 *
 * @metodo Fundamentos §10 — o Perfil de Prioridades orienta todas as etapas seguintes
 * @metodo Experience §2.3 — reconhecimento, não nota
 *
 * ADR-039/ADR-042 — a autoridade das prioridades é o Mapa, por níveis.
 *
 * Por que existe: durante a análise, o Curador volta às prioridades o tempo
 * todo — são o critério contra o qual tudo se compara. Precisam estar sempre à
 * vista, em leitura rápida: o que ela declarou como mais importante, e se ela
 * já reconheceu o Perfil como seu.
 *
 * M3 (ADR-042): o painel deixou de exibir a distribuição de 100 pontos
 * (`priority_weights`). A fonte é o Mapa de Prioridades, agrupado pelos cinco
 * níveis — nomes sob o nível declarado, nenhum número agregado, nenhuma barra
 * que pudesse ser lida como nota.
 */

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  IMPORTANCE_LABELS,
  IMPORTANCE_LEVELS,
  type ImportanceLevel,
  type PriorityMapGroup,
} from "@/modules/curadoria/mapa-prioridades";

export function MesaPriorityPanel({
  patientFirstName,
  validatedAt,
  groups,
}: {
  patientFirstName: string;
  /** Quando a paciente reconheceu o Perfil — `null` enquanto o ato é dela. */
  validatedAt: string | null;
  groups: PriorityMapGroup[];
}) {
  // O Mapa reorganizado por nível: o aside responde "o que mais importa",
  // não "em qual grupo do Método cada item mora" — isso é o painel principal.
  const porNivel = new Map<ImportanceLevel, string[]>();
  let pendentes = 0;

  for (const group of groups) {
    for (const entry of group.entries) {
      if (entry.importance === null) {
        pendentes += 1;
        continue;
      }
      const nomes = porNivel.get(entry.importance) ?? [];
      nomes.push(entry.subcriterion.name);
      porNivel.set(entry.importance, nomes);
    }
  }

  return (
    <Card className="space-y-5 border-brand-gold/40">
      <CardHeader>
        <CardTitle>O que importa para {patientFirstName}</CardTitle>
        <CardDescription>
          {validatedAt
            ? `Perfil reconhecido por ${patientFirstName} em ${new Date(validatedAt).toLocaleDateString("pt-BR")}.`
            : `${patientFirstName} ainda não reconheceu este Perfil como seu.`}
        </CardDescription>
      </CardHeader>

      {IMPORTANCE_LEVELS.map((nivel) => {
        const nomes = porNivel.get(nivel);
        if (!nomes || nomes.length === 0) return null;
        return (
          <div key={nivel}>
            <h3 className="text-xs uppercase tracking-wide text-ink-muted">
              {IMPORTANCE_LABELS[nivel]}
            </h3>
            <ul className="mt-1.5 space-y-1 text-sm leading-relaxed text-ink">
              {nomes.map((nome) => (
                <li key={nome}>{nome}</li>
              ))}
            </ul>
          </div>
        );
      })}

      {pendentes > 0 ? (
        <p className="text-xs leading-relaxed text-ink-muted">
          {pendentes} subcritério{pendentes === 1 ? "" : "s"} ainda por classificar no Mapa.
        </p>
      ) : null}
    </Card>
  );
}
