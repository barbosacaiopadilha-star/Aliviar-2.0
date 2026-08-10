import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { resolveAuthenticatedDisplayName, resolvePrimaryRoleLabel } from "@/modules/auth/display-identity";
import { PatientShell } from "@/components/paciente/patient-shell";
import { AuthenticatedUserMenu } from "@/components/auth/authenticated-user-menu";
import { getLatestStory, getOrCreateActiveStory } from "@/modules/story/repository";
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
  // A história já contada tem precedência — inclusive a enviada. Criar só
  // acontece para quem ainda não tem nenhuma (ETAPA 9; ver STORY-GET-WRITE-001).
  const story =
    (await getLatestStory(supabase, authState.user.id)) ??
    (await getOrCreateActiveStory(supabase, authState.user.id));

  return (
    <PatientShell
      userMenu={
        <AuthenticatedUserMenu
          displayName={resolveAuthenticatedDisplayName(authState)}
          roleLabel={resolvePrimaryRoleLabel(authState.roles)}
        />
      }
    >
      <StoryDraftProvider story={story}>
        <StoryConflictBanner />
        {/* A2B · a moldura privada passa a acompanhar a História.
            Estas etapas SEMPRE exigiram sessão de paciente — o `requireRole`
            acima é anterior a esta missão. O que faltava era vestir a moldura:
            a paciente clicava em "Minha história" na navegação privada e a
            Aliviar privada desaparecia da tela, embora ela continuasse
            autenticada o tempo todo. Não houve mudança de rota, de guarda nem
            de href: só a continuidade visual que já deveria existir.

            O calor ambiente do wizard permanece — ele é a atmosfera destes
            passos (ADR-031) e continua sob o conteúdo, agora dentro da casa. */}
        <div className="relative">
          <div
            aria-hidden="true"
            className="ambient-warmth pointer-events-none absolute inset-0"
          />
          <div className="animate-fade-up relative">{children}</div>
        </div>
      </StoryDraftProvider>
    </PatientShell>
  );
}
