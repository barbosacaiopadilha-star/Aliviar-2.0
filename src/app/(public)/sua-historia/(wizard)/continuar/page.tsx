import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { getLatestStory, getOrCreateActiveStory } from "@/modules/story/repository";

// Sem UI própria: só resolve a história do paciente e retoma exatamente de
// onde ela parou — ponto único de entrada usado pela home e pelo menu.
//
// ETAPA 9: abre a história EXISTENTE, inclusive depois de enviada. Antes,
// buscava apenas rascunho; quem já tinha enviado voltava e ganhava uma
// história nova em branco, enquanto a que contou sumia da vista. Começar uma
// segunda história é decisão dela, nunca efeito de clicar num link.
export default async function ContinuarStoryPage() {
  const authState = await requireRole("paciente");
  const supabase = await createServerSupabaseClient();

  const existente = await getLatestStory(supabase, authState.user.id);
  if (existente) {
    // Enviada: a etapa de revisão é onde ela relê o que contou.
    redirect(`/sua-historia/${existente.status === "enviada" ? "revisao" : existente.currentStep}`);
  }

  const story = await getOrCreateActiveStory(supabase, authState.user.id);
  redirect(`/sua-historia/${story.currentStep}`);
}
