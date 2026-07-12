import Link from "next/link";

type ReviewItemProps = {
  label: string;
  value: string;
  editHref?: string;
};

export function ReviewItem({ label, value, editHref }: ReviewItemProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-4 last:border-b-0">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="mt-1 text-sm text-ink-muted">{value || "Não informado"}</p>
      </div>
      {editHref ? (
        <Link
          href={editHref}
          className="shrink-0 rounded-md text-sm font-medium text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Editar
        </Link>
      ) : null}
    </div>
  );
}
