import { StoryStepLayout } from "@/components/story/story-step-layout";

export default function BoasVindasPage() {
  return (
    <StoryStepLayout
      step={1}
      totalSteps={7}
      title="Sua história merece ser contada com calma."
      backHref="/"
      nextHref="/sua-historia/continuar"
      nextLabel="Começar"
    >
      <div className="space-y-4 text-base leading-relaxed text-ink-muted">
        <p>Não existem respostas certas — você escreve no seu ritmo, com suas próprias palavras.</p>
        <p>Cada informação que você compartilhar nos ajuda a entender melhor o seu momento.</p>
        <p>
          Nenhuma decisão é tomada automaticamente: uma pessoa, com nome, lê tudo com atenção.
        </p>
      </div>

      <p className="mt-8 text-sm text-ink-muted">
        Para contar sua história você precisa já ter uma conta na Aliviar — se ainda não tem,
        fale com a Aliviar. Se já tem, ao clicar em &ldquo;Começar&rdquo; você entra com seu
        login e continuamos de onde você parou.
      </p>
    </StoryStepLayout>
  );
}
