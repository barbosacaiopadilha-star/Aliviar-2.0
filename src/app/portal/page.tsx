import type { Metadata } from "next";

import { PrimeiroPortalLoader } from "@/components/portal/PrimeiroPortalLoader";

export const metadata: Metadata = {
  title: "Portal — Aliviar",
  description: "Sua jornada continua.",
};

export default function PortalPage() {
  return <PrimeiroPortalLoader />;
}
