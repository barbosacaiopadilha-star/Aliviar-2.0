import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { getOrCreateActiveStory } from "@/modules/story/repository";

// Sem UI própria: só resolve a história ativa do paciente e retoma
// exatamente de onde parou — ponto único de entrada usado pela página
// pública raiz (evita reiniciar sempre em "para-quem").
export default async function ContinuarStoryPage() {
  const authState = await requireRole("paciente");
  const supabase = await createServerSupabaseClient();
  const story = await getOrCreateActiveStory(supabase, authState.user.id);

  redirect(`/sua-historia/${story.currentStep}`);
}
