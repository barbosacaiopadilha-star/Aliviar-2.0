import type { Metadata } from "next";

import { ChapterOneExperience } from "@/components/experience/chapter-one/ChapterOneExperience";

export const metadata: Metadata = {
  title: "Aliviar — Curadoria Médica",
  description: "Você não precisa navegar a saúde sozinho.",
};

export default function HomePage() {
  return <ChapterOneExperience />;
}
