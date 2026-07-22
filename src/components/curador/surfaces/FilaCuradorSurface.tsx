import Link from "next/link";

import type { FilaCuradorExperienceModel } from "@/curator-layer/resolve-curator-experience";

const ESTADO_CLASS: Record<string, string> = {
  BLOQUEADO: "bg-coral-soft text-coral",
  AGUARDANDO: "bg-paper text-ink-soft",
  EM_ANALISE: "bg-sage-soft text-sage",
  PRONTO_PARA_ENTREGA: "bg-coral-soft/50 text-ink",
  ENTREGUE: "bg-sage-soft/50 text-ink",
  ACOMPANHAMENTO: "bg-paper text-ink",
};

export function FilaCuradorSurface({ model }: { model: FilaCuradorExperienceModel }) {
  return (
    <section data-testid="fila-curador-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-ink-soft">
            <th className="py-3 pr-4">Paciente</th>
            <th className="py-3 pr-4">Jornada</th>
            <th className="py-3 pr-4">Estado</th>
            <th className="py-3 pr-4">Curador</th>
            <th className="py-3">Atualizado</th>
          </tr>
        </thead>
        <tbody>
          {model.itens.map((item) => (
            <tr key={item.jornada_id} className="border-b border-line/60">
              <td className="py-3 pr-4">
                <Link
                  href={`/curador/casos/${item.jornada_id}`}
                  className="font-medium text-coral hover:underline"
                  data-testid={`fila-item-${item.jornada_id}`}
                >
                  {item.paciente_nome}
                </Link>
              </td>
              <td className="py-3 pr-4 text-ink-soft">{item.titulo_jornada}</td>
              <td className="py-3 pr-4">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${ESTADO_CLASS[item.estado_operacional] ?? ""}`}
                >
                  {item.estado_operacional.replaceAll("_", " ")}
                </span>
              </td>
              <td className="py-3 pr-4 text-ink-soft">{item.curador_nome ?? "—"}</td>
              <td className="py-3 text-ink-soft">
                {new Date(item.atualizado_em).toLocaleString("pt-BR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {model.itens.length === 0 ? (
        <p className="py-8 text-center text-ink-soft">Nenhum caso na fila.</p>
      ) : null}
    </section>
  );
}
