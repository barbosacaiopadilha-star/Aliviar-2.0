import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getDoctorById } from "@/alicia/catalog";
import { AliciaShell } from "@/components/alicia/AliciaShell";
import { DoctorProfileView } from "@/components/alicia/DoctorProfileView";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const doctor = getDoctorById(id);

  if (!doctor) {
    return { title: "Médico não encontrado — AliCIA" };
  }

  return {
    title: `${doctor.name} — AliCIA`,
    description: doctor.whoTheyAre,
  };
}

export default async function DoctorProfilePage({ params }: PageProps) {
  const { id } = await params;
  const doctor = getDoctorById(id);

  if (!doctor) {
    notFound();
  }

  return (
    <AliciaShell compact>
      <div className="mb-8">
        <Link
          href="/alicia/mapa"
          className="text-sm font-medium text-ink-soft transition hover:text-ink"
        >
          ← Voltar ao mapa
        </Link>
      </div>
      <DoctorProfileView doctor={doctor} />
    </AliciaShell>
  );
}
