import type { DiscoveryInsights } from "@/alicia/lib/discovery-summary";

function InsightGroup({
  title,
  items,
}: {
  title: string;
  items: DiscoveryInsights["specialties"];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-line bg-paper px-4 py-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-ink">{item.label}</span>
            <span className="text-ink-soft">{item.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DiscoveryInsightsPanel({ insights }: { insights: DiscoveryInsights }) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-serif text-lg font-semibold text-ink">Resultados desta busca</h2>
        <p className="mt-1 text-xs text-ink-soft">
          Onde os médicos atendem e com quais especialidades — sem ordem de recomendação.
        </p>
      </div>
      <InsightGroup title="Especialidades" items={insights.specialties} />
      <InsightGroup title="Cidades" items={insights.cities} />
      <InsightGroup title="Instituições" items={insights.institutions} />
    </div>
  );
}
