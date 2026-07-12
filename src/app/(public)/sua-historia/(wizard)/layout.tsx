import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { getOrCreateActiveStory } from "@/modules/story/repository";
import { StoryDraftProvider } from "@/modules/story/use-story-draft";

import { StoryConflictBanner } from "@/components/story/story-conflict-banner";

// Route group (sem segmento na URL) — isola as etapas do wizard da raiz
// pública `sua-historia/page.tsx`. Exige sessão + papel "paciente" (ADR-018):
// preenchimento de "sua história" nunca é anônimo, porque a conta do
// paciente já existe antes (criada pela equipe Aliviar, §21 de
// docs/PRODUCT_ARCHITECTURE.md).
export default async function SuaHistoriaWizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authState = await requireRole("paciente");
  const supabase = await createServerSupabaseClient();
  const story = await getOrCreateActiveStory(supabase, authState.user.id);

  return (
    <StoryDraftProvider story={story}>
      <StoryConflictBanner />
      {children}
    </StoryDraftProvider>
  );
}
