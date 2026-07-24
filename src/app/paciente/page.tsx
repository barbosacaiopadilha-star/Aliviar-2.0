import Link from "next/link";
import type { Metadata } from "next";

import { PatientWelcome } from "@/components/paciente/dashboard/patient-primitives";
import { PatientHomeState } from "@/components/paciente/patient-home-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { getPatientCaseOverview } from "@/modules/cases";
import { listStoriesForProfile } from "@/modules/story/repository";
import { derivePatientHomeState } from "@/modules/paciente/home-state";

export const metadata: Metadata = {
  title: "Minha Jornada",
  robots: { index: false, follow: false },
};

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

  const displayName = authState.profile?.displayName ?? "Paciente";

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <div className="space-y-8">
        <PatientWelcome name={displayName} />
        <PatientHomeState state={state} />
      </div>

      <nav aria-label="Acessos rápidos" className="border-t border-[var(--color-border)] pt-8">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-sage)]">
          Acessos rápidos
        </p>
        <ul className="flex flex-wrap gap-x-8 gap-y-3">
          {SECONDARY_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium text-[var(--patient-forest)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
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
