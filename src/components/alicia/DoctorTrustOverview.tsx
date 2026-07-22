import type { TrustOverview } from "@/alicia/lib/profile-narrative";

export function DoctorTrustOverview({ overview }: { overview: TrustOverview }) {
  const items = [
    { question: "Quem é este médico?", answer: overview.who },
    { question: "Como foi formado?", answer: overview.education },
    { question: "Onde se especializou?", answer: overview.specialization },
    { question: "Onde atua hoje?", answer: overview.practice },
  ];

  return (
    <section className="space-y-4 rounded-xl border border-line bg-paper px-5 py-6">
      <div>
        <h2 className="font-serif text-xl font-semibold text-ink">O que sabemos</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Respostas em linguagem simples, com base em fontes públicas.
        </p>
      </div>
      <dl className="space-y-4">
        {items.map((item) => (
          <div key={item.question}>
            <dt className="text-sm font-medium text-ink">{item.question}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-ink-soft">{item.answer}</dd>
          </div>
        ))}
        {overview.pending && (
          <div>
            <dt className="text-sm font-medium text-ink">O que ainda estamos verificando?</dt>
            <dd className="mt-1 text-sm leading-relaxed text-ink-soft">{overview.pending}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
