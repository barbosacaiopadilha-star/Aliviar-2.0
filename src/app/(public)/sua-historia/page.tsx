import { StoryStepLayout } from "@/components/story/story-step-layout";

export default function BoasVindasPage() {
  return (
    <StoryStepLayout
      step={1}
      totalSteps={7}
      title="Vamos entender como podemos ajudar."
      description="Em poucos minutos, fazemos algumas perguntas simples sobre o seu momento. Você pode voltar e mudar qualquer resposta, e tudo é salvo automaticamente enquanto você preenche — em qualquer dispositivo, sem perder nada."
      backHref="/"
      nextHref="/sua-historia/continuar"
      nextLabel="Começar"
    >
      <p className="text-sm text-ink-muted">
        Para contar sua história você precisa já ter uma conta na Aliviar — se ainda não tem,
        entre em contato com a nossa equipe. Se já tem, ao clicar em &ldquo;Começar&rdquo; você
        entra com seu login e continuamos de onde você parou.
      </p>
      <p className="mt-3 text-sm text-ink-muted">
        No final, nossa equipe de curadoria analisa o que você compartilhar com atenção, antes de
        qualquer indicação — nunca por algoritmo automático.
      </p>
    </StoryStepLayout>
  );
}
