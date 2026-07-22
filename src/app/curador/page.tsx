import Link from "next/link";

import { CuratorProvider } from "@/components/curador/CuratorProvider";
import { FilaCuradorContent } from "@/components/curador/FilaCuradorContent";
import { signOutAction } from "@/lib/actions/auth";
import { requireActiveStaffProfile } from "@/lib/auth/staff";

export default async function CuradorPage() {
  await requireActiveStaffProfile();

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-paper-raised">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="font-serif text-xl font-semibold text-ink">Portal do Curador</p>
            <p className="text-sm text-ink-soft">Fila de casos</p>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/workspace" className="btn-secondary">
              Workspace
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="btn-secondary">
                Sair
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8" data-testid="curador-portal">
        <CuratorProvider jornadaId={null}>
          <FilaCuradorContent />
        </CuratorProvider>
      </main>
    </div>
  );
}
