import type { Metadata } from "next";

import { FirstConversationExperience } from "@/components/experience/chapter-two/FirstConversationExperience";

export const metadata: Metadata = {
  title: "Primeira conversa — Aliviar",
  description: "A Aliviar começa ouvindo você — com calma, uma pergunta de cada vez.",
};

export default function ConversaPage() {
  return <FirstConversationExperience />;
}
