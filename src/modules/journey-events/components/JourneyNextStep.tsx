export function JourneyNextStep({ nextStep }: { nextStep: string | null }) {
  return (
    <div className="card border-l-4 border-l-coral p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-coral">Próximo passo</p>
      <p className="mt-2 text-sm leading-relaxed text-ink">
        {nextStep ?? "Nenhum próximo passo foi registrado."}
      </p>
    </div>
  );
}
