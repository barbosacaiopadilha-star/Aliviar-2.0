import Link from "next/link";

import { AdminPortalContent } from "@/components/admin/AdminPortalContent";
import { signOutAction } from "@/lib/actions/auth";
import { requireGovernancePermission } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const access = await requireGovernancePermission("admin.config.read");
  if (!access.ok) {
    const health = await requireGovernancePermission("admin.health.read");
    if (!health.ok) {
      redirect("/login?redirect=/admin");
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-paper-raised">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="font-serif text-xl font-semibold text-ink">Portal Administrativo</p>
            <p className="text-sm text-ink-soft">Governança operacional</p>
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
      <main className="mx-auto max-w-6xl px-4 py-8">
        <AdminPortalContent />
      </main>
    </div>
  );
}
