import { ReconhecerPerfil } from "@/components/paciente/reconhecer-perfil";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { PerfilView } from "@/modules/paciente/experiencia";

/**
 * O que mais importa para o seu caso — ADR-042.
 *
 * Antes este painel mostrava distribuição de pontos por critério. Ponto é
 * mecanismo interno: dizia como a Aliviar pondera, não o que ela escolheu.
 * Agora responde a pergunta dela — quais fatores foram considerados
 * prioritários —, agrupados pelo peso que ela mesma deu.
 *
 * O que nunca atravessa: número, porcentagem, orçamento, cálculo. E nem os
 * níveis que ela declarou como pouco importantes somem: esconder o que ela
 * escolheu deixar de fora seria editar as palavras dela.
 *
 * O reconhecimento é dela e acontece aqui (ADR-042). Antes o botão não existia
 * nesta tela: quem registrava o ato "dela" era o Curador, do outro lado, depois
 * que os 100 pontos fechassem.
 */
export function PerfilPanel({ perfil, caseId }: { perfil: PerfilView; caseId?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>O que mais importa para o seu caso</CardTitle>
        <CardDescription>{perfil.headline}</CardDescription>
      </CardHeader>

      {perfil.prioridades.length === 0 ? (
        // Nunca um card vazio: o estado é dito por nome.
        <p className="max-w-reading text-sm leading-relaxed text-ink-muted">
          Assim que esta etapa for concluída, você verá aqui o que foi considerado mais importante
          para o seu caso. Isso nasce da conversa com seu Curador, com as suas palavras.
        </p>
      ) : (
        <div className="space-y-5">
          {perfil.prioridades.map((nivel) => (
            <div key={nivel.level}>
              <h3 className="text-xs uppercase tracking-wide text-ink-muted">{nivel.label}</h3>
              <ul className="mt-2 space-y-1">
                {nivel.itens.map((item) => (
                  <li key={item} className="text-sm text-ink">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {!perfil.validated && perfil.prioridades.length > 0 && caseId ? (
        <ReconhecerPerfil
          caseId={caseId}
          pendentes={perfil.total - perfil.classificados}
          validated={perfil.validated}
        />
      ) : null}
    </Card>
  );
}
