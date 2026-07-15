import Link from "next/link";
import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { getPatientCaseOverview } from "@/modules/cases";
import { listStoriesForProfile } from "@/modules/story/repository";
import { derivePatientHomeState } from "@/modules/paciente/home-state";

import { PatientHomeState } from "@/components/paciente/patient-home-state";

// noindex: área autenticada — nunca deve ser indexada (ver também robots.ts).
export const metadata: Metadata = {
  title: "Paciente",
  robots: { index: false, follow: false },
};

// Acessos reais já existentes na árvore do paciente — link editorial, não
// card administrativo. Mantido aqui (não em nav-items.ts) porque é exclusivo
// desta página, e o PatientShell já cobre a navegação persistente.
const SECONDARY_LINKS = [
  { label: "Minha história", href: "/sua-historia" },
  { label: "Documentos", href: "/paciente/documentos" },
  { label: "Minha Curadoria", href: "/paciente/curadoria" },
  { label: "Perfil", href: "/paciente/perfil" },
];

export default async function PacienteHomePage() {
  const authState = await requireRole("paciente");
  const supabase = await createServerSupabaseClient();

  const [stories, caseOverview] = await Promise.all([
    listStoriesForProfile(supabase, authState.user.id),
    getPatientCaseOverview(supabase, authState.user.id),
  ]);

  const state = derivePatientHomeState({
    storyStatuses: stories.map((story) => story.status),
    caseOverview,
  });

  return (
    <div className="mx-auto max-w-reading space-y-12">
      <div className="space-y-8">
        <h1 className="font-serif text-3xl font-medium leading-tight text-ink lg:text-4xl">
          Olá, {authState.profile?.displayName ?? "Paciente"}.
        </h1>
        <PatientHomeState state={state} />
      </div>

      <nav aria-label="Acessos rápidos" className="border-t border-border pt-8">
        <ul className="flex flex-wrap gap-x-8 gap-y-3">
          {SECONDARY_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="link-underline text-sm font-medium text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
