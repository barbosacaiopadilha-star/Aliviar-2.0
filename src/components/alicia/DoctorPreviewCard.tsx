import Link from "next/link";

import { getProfileHook } from "@/alicia/lib/profile-narrative";
import type { Doctor } from "@/alicia/types";

export function DoctorPreviewCard({
  doctor,
  onClose,
}: {
  doctor: Doctor;
  onClose: () => void;
}) {
  return (
    <div className="card absolute bottom-4 left-4 right-4 z-[1000] mx-auto max-w-md p-5 shadow-lg md:left-auto md:right-6">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 rounded px-2 py-1 text-xs text-ink-soft hover:bg-paper"
        aria-label="Fechar resumo"
      >
        ✕
      </button>
      <p className="font-serif text-lg font-semibold text-ink">{doctor.name}</p>
      <p className="mt-1 text-sm text-coral">{doctor.specialty}</p>
      <p className="mt-2 text-sm text-ink-soft">
        {doctor.location.city}, {doctor.location.state}
      </p>
      <p className="mt-1 text-sm text-ink-soft">{doctor.mainInstitution}</p>
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-soft">
        {getProfileHook(doctor)}
      </p>
      <Link href={`/alicia/medicos/${doctor.id}`} className="btn-primary mt-4 w-full">
        Ver perfil
      </Link>
    </div>
  );
}
