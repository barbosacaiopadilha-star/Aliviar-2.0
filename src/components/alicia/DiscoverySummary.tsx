export function DiscoverySummary({ summary }: { summary: string }) {
  return (
    <div className="rounded-xl border border-line bg-paper px-4 py-3">
      <p className="text-sm leading-relaxed text-ink">{summary}</p>
    </div>
  );
}
