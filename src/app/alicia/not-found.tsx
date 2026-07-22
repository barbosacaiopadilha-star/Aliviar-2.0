import Link from "next/link";

import { AliciaShell } from "@/components/alicia/AliciaShell";

export default function AliciaNotFound() {
  return (
    <AliciaShell compact>
      <div className="card p-8 text-center">
        <h1 className="font-serif text-2xl font-semibold text-ink">Página não encontrada</h1>
        <p className="mt-2 text-sm text-ink-soft">
          O conteúdo que você procura não existe ou foi movido.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/alicia/mapa" className="btn-primary">
            Ir para o mapa
          </Link>
          <Link href="/alicia" className="btn-secondary">
            Voltar ao início
          </Link>
        </div>
      </div>
    </AliciaShell>
  );
}
