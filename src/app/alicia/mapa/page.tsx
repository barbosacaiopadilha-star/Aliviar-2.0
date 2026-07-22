import type { Metadata } from "next";

import { AliciaShell } from "@/components/alicia/AliciaShell";
import { MapExperience } from "@/components/alicia/MapExperience";

export const metadata: Metadata = {
  title: "Mapa — AliCIA",
  description:
    "Explore ortopedistas e neurocirurgiões no Espírito Santo e filtre por formação, cidade e instituição.",
};

export default function AliciaMapPage() {
  return (
    <AliciaShell>
      <MapExperience />
    </AliciaShell>
  );
}
