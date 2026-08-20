import Link from "next/link";
import { redirect } from "next/navigation";

import { StoryStepLayout } from "@/components/story/story-step-layout";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthState } from "@/modules/auth/session";
import { listStoriesForProfile } from "@/modules/story/repository";

// Esta era a única tela pública sem título próprio: a aba dizia só "Aliviar
// Curadoria Médica", enquanto Landing, Fale com a Aliviar, Privacidade e Termos
// se identificavam. No histórico do navegador ela não se distinguia de nada.
export const metadata = { title: "Sua história" };

export default async function BoasVindasPage() {
  // ETAPA 9: quem já é paciente e já tem história não recomeça — retoma.
  // A recepção é para o primeiro contato; voltar a ela reiniciava a conversa.
  const authState = await getAuthState();
  const ehPaciente = authState?.roles.includes("paciente") ?? false;
  if (ehPaciente) {
    const supabase = await createServerSupabaseClient();
    const stories = await listStoriesForProfile(supabase, authState!.user.id);
    if (stories.length > 0) {
      redirect("/sua-historia/continuar");
    }
  }

  return (
    <StoryStepLayout
      step={1}
      totalSteps={7}
      title="Sua história merece ser contada com calma."
      backHref={ehPaciente ? "/paciente" : "/"}
      nextHref="/sua-historia/continuar"
      nextLabel="Começar"
      nextIsPorta
    >
      <div className="space-y-4 text-base leading-relaxed text-ink-muted">
        <p>Não existem respostas certas — você escreve no seu ritmo, com suas próprias palavras.</p>
        <p>Cada informação que você compartilhar nos ajuda a entender melhor o seu momento.</p>
        <p>
          Nenhuma decisão é tomada automaticamente: uma pessoa, com nome, lê tudo com atenção.
        </p>
      </div>

      {/* OPS-R3A1 · a frase dizia "fale com a Aliviar" e não levava a lugar
          nenhum. Quem ainda não tem conta agora tem caminho, com o mesmo CTA
          canônico das outras superfícies públicas. */}
      <p className="mt-8 text-sm text-ink-muted">
        Para contar sua história você precisa já ter uma conta na Aliviar. Se ainda não tem,{" "}
        <Link
          href="/solicitar-atendimento"
          className="inline-flex min-h-11 items-center font-medium text-brand-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          Solicitar atendimento
        </Link>
        . Se já tem, ao clicar em &ldquo;Começar&rdquo; você entra com seu login e continuamos de
        onde você parou.
      </p>
    </StoryStepLayout>
  );
}
