import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { PerfilView } from "@/modules/paciente/experiencia";

/**
 * Seu Perfil — a importância que você declarou, em palavras.
 *
 * Superfície de leitura da experiência do paciente: mostra o que já foi
 * construído junto com o Curador, quanto falta, e se o Perfil já foi
 * reconhecido pela pessoa. Nenhum número de peso atravessa — a projeção em
 * "Muito importante / Importante / Considerado" acontece no domínio
 * (experiencia.ts), e o que chega aqui já é palavra.
 *
 * A confirmação do Perfil acontece na conversa com o Curador — é ele quem a
 * registra, com a pessoa. Este painel diz isso; não oferece um botão que
 * fingiria substituí-la.
 */
export function PerfilPanel({ perfil }: { perfil: PerfilView }) {
  const grupos = [
    { titulo: "Prioridades Técnicas", itens: perfil.tecnicas },
    { titulo: "Prioridades do Modelo de Cuidado", itens: perfil.modeloDeCuidado },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seu Perfil</CardTitle>
        <CardDescription>{perfil.headline}</CardDescription>
      </CardHeader>

      {/* Construção, nunca qualidade: 100% significa "o Perfil é seu e você o
          reconheceu" — nada além. */}
      <div className="mb-4">
        <div
          role="progressbar"
          aria-valuenow={perfil.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Construção do Perfil"
          className="h-2 w-full overflow-hidden rounded-full bg-surface-raised"
        >
          <div className="h-full rounded-full bg-brand-primary" style={{ width: `${perfil.progress}%` }} />
        </div>
        <p className="mt-1 text-xs text-ink-muted">Construção do Perfil: {perfil.progress}%</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {grupos.map((grupo) => (
          <div key={grupo.titulo}>
            <h3 className="text-xs uppercase tracking-wide text-ink-muted">{grupo.titulo}</h3>
            <ul className="mt-2 space-y-1.5">
              {grupo.itens.map((item) => (
                <li key={item.criterion} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="text-ink">{item.label}</span>
                  <span className="text-ink-muted">{item.importance ?? "Ainda em conversa"}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {!perfil.validated && perfil.progress >= 86 ? (
        <p className="mt-4 max-w-reading text-sm leading-relaxed text-ink">
          Este perfil representa corretamente o que é importante para você? A confirmação acontece
          na conversa com seu Curador — se algo não estiver com a sua cara, é só dizer a ele que
          gostaria de revisar. A Curadoria só começa depois desse seu sim.
        </p>
      ) : null}
    </Card>
  );
}
