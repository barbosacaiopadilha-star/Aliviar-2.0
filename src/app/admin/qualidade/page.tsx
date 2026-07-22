import Link from "next/link";

import { AdminQualidadeContent } from "@/components/admin/AdminQualidadeContent";
import { signOutAction } from "@/lib/actions/auth";
import { requireGovernancePermission } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";

export default async function AdminQualidadePage() {
  const access = await requireGovernancePermission("admin.quality.read");
  if (!access.ok) {
    redirect("/login?redirect=/admin/qualidade");
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-paper-raised">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="font-serif text-xl font-semibold text-ink">Qualidade Operacional</p>
            <p className="text-sm text-ink-soft">Feedback e incidentes</p>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/admin" className="btn-secondary">
              Admin
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
        <AdminQualidadeContent />
      </main>
    </div>
  );
}
