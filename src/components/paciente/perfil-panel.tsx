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
 * A confirmação do Perfil acontece na conversa com o Curador — é ele quem a
 * registra, com ela. Este painel diz isso; não oferece um botão que fingiria
 * substituí-la.
 */
export function PerfilPanel({ perfil }: { perfil: PerfilView }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>O que mais importa para o seu caso</CardTitle>
        <CardDescription>{perfil.headline}</CardDescription>
      </CardHeader>

      {perfil.prioridades.length === 0 ? (
        <p className="max-w-reading text-sm leading-relaxed text-ink-muted">
          Ainda não há nada aqui — o que importa para você é definido na conversa com seu Curador,
          com as suas palavras. É por aí que a Curadoria começa.
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

      {!perfil.validated && perfil.prioridades.length > 0 ? (
        <p className="mt-5 max-w-reading text-sm leading-relaxed text-ink">
          Este retrato representa corretamente o que é importante para você? A confirmação acontece
          na conversa com seu Curador — se algo não estiver com a sua cara, é só dizer a ele que
          gostaria de revisar. A Curadoria só começa depois desse seu sim.
        </p>
      ) : null}
    </Card>
  );
}
