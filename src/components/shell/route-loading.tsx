import { Spinner } from "@/components/ui/spinner";

export function RouteLoading() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-ink-muted">
      <Spinner size="lg" />
      <p className="text-sm">Carregando...</p>
    </div>
  );
}
