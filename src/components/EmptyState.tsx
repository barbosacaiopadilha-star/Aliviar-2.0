export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-start gap-3 p-8 text-left">
      <h2 className="font-serif text-xl font-semibold text-ink">{title}</h2>
      {description && <p className="text-sm text-ink-soft">{description}</p>}
      {action}
    </div>
  );
}
