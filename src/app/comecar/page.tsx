import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Começar",
  description: "Primeiro passo na Aliviar.",
};

export default function ComecarPage() {
  return (
    <div className="min-h-screen bg-paper">
      <main className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="font-serif text-3xl font-semibold text-ink">Primeiro contato</h1>
        <p className="mt-4 text-ink-soft">
          Quando a Aliviar iniciar sua jornada, você receberá um link pessoal para continuar.
        </p>
      </main>
    </div>
  );
}
