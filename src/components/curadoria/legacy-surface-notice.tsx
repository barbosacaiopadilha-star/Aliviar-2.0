import Link from "next/link";

/**
 * Aviso de superfície anterior ao Método.
 *
 * @metodo Jornada §5 — existe uma experiência só; o usuário nunca deve sentir que trocou de sistema
 * @metodo Experience §5 — UX2: sempre mostrar contexto; a pessoa nunca precisa adivinhar onde está
 * @metodo Fundamentos §5.2 — o ACE automático deixou de ser o mecanismo de decisão
 *
 * Por que existe: `/curador` e `/paciente` continuam servindo os Casos abertos
 * sob o ACE automático, e precisam continuar — apagá-los tornaria esses Casos
 * inalcançáveis. Mas quem chega neles hoje vê Shortlist gerada por sistema,
 * exatamente o que o Método substituiu. Sem um aviso, a pessoa conclui que há
 * dois produtos, ou pior, que o Método não vale ali.
 *
 * O que nunca faz: bloquear o acesso, ou empurrar a migração. Diz onde a
 * pessoa está, por que aquilo ainda existe, e oferece o caminho — a decisão de
 * ir continua sendo dela.
 */
export function LegacySurfaceNotice({ portalHref }: { portalHref: string }) {
  return (
    <div className="mb-6 rounded-md border border-brand-gold/50 bg-canvas p-4">
      <p className="text-sm font-medium text-ink">Esta é a área anterior ao Método</p>
      <p className="mt-1 max-w-reading text-sm leading-relaxed text-ink-muted">
        Ela segue aqui para os Casos abertos antes da Curadoria Compartilhada, e continua
        funcionando normalmente. As Curadorias novas acontecem no Portal.
      </p>
      <Link
        href={portalHref}
        className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-brand-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      >
        Ir para o Portal →
      </Link>
    </div>
  );
}
