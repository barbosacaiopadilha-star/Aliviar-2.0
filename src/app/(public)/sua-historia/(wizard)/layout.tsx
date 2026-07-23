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
      {/* Continuidade com a PortalExperience (ADR-031): calor ambiente
          atrás dos passos e uma entrada suave, para o wizard ser sentido
          como continuação do filme, nunca um formulário à parte. */}
      <div className="relative min-h-screen">
        <div
          aria-hidden="true"
          className="ambient-warmth pointer-events-none absolute inset-0"
        />
        <div className="animate-fade-up relative">{children}</div>
      </div>
    </StoryDraftProvider>
  );
}
