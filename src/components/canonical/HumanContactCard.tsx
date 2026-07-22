import type { ResponsavelView } from "@/experience-flow/contracts/jornada-view";

interface HumanContactCardProps {
  responsavel: ResponsavelView;
  mensagem?: string;
}

export function HumanContactCard({ responsavel, mensagem }: HumanContactCardProps) {
  if (responsavel.canal !== "HUMANO" && responsavel.tipo !== "GESTOR") {
    return null;
  }

  return (
    <section className="card p-5" data-testid="human-contact-card" aria-label="Contato humano">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
        Pessoa da Aliviar
      </p>
      <h2 className="mt-2 font-medium text-ink">
        {responsavel.nome_exibicao ?? "Equipe Aliviar"}
      </h2>
      {mensagem ? <p className="mt-2 text-sm text-ink-soft">{mensagem}</p> : null}
    </section>
  );
}
