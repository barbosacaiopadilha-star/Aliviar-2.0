import Link from "next/link";

import { CasoCuradorRouter } from "@/components/curador/CasoCuradorRouter";
import { CuratorProvider } from "@/components/curador/CuratorProvider";
import { signOutAction } from "@/lib/actions/auth";
import { requireActiveStaffProfile } from "@/lib/auth/staff";

interface CuradorCasoPageProps {
  params: Promise<{ jornadaId: string }>;
}

export default async function CuradorCasoPage({ params }: CuradorCasoPageProps) {
  await requireActiveStaffProfile();
  const { jornadaId } = await params;

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-paper-raised">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="font-serif text-xl font-semibold text-ink">Portal do Curador</p>
            <p className="text-sm text-ink-soft">Caso do paciente</p>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/curador" className="btn-secondary">
              Fila
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="btn-secondary">
                Sair
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <CuratorProvider jornadaId={jornadaId}>
          <CasoCuradorRouter />
        </CuratorProvider>
      </main>
    </div>
  );
}
