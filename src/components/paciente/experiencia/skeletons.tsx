import { cn } from "@/components/ui/cn";

/**
 * Skeletons da experiência do paciente.
 *
 * Cada um tem a forma exata do conteúdo que vai chegar — quando ele chega,
 * nada salta de lugar. Um spinner genérico diria "espere"; isto diz "é isto
 * que está vindo", que é uma informação a mais para quem está ansioso.
 *
 * Todos `aria-hidden` com `aria-busy` no contêiner: leitor de tela anuncia
 * "carregando" uma vez, em vez de ler uma dúzia de caixas vazias.
 */
function Bloco({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("p-skeleton", className)} />;
}

export function HeroSkeleton() {
  return (
    <section aria-busy="true" aria-label="Carregando sua jornada" className="patient-hero">
      <div className="patient-hero__veil" aria-hidden="true" />
      <div className="patient-hero__content space-y-3">
        <Bloco className="h-3 w-32" />
        <Bloco className="h-9 w-56" />
        <Bloco className="h-4 w-full max-w-md" />
      </div>
    </section>
  );
}

export function WalkSkeleton() {
  return (
    <section aria-busy="true" aria-label="Carregando as etapas">
      <Bloco className="h-3 w-24" />
      <div className="mt-5 flex gap-1">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className="flex flex-1 flex-col gap-2">
            <Bloco className="h-1 w-full" />
            <Bloco className="h-3 w-full" />
          </div>
        ))}
      </div>
      <Bloco className="mt-5 h-4 w-full max-w-sm" />
    </section>
  );
}

export function ProfileSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando seu Perfil" className="patient-card p-6 lg:p-8">
      <Bloco className="h-3 w-24" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <Bloco className="h-3.5 w-40" />
            <Bloco className="h-3.5 w-24" />
          </div>
        ))}
      </div>
      <Bloco className="mt-6 h-11 w-48 rounded-full" />
    </div>
  );
}

export function CartasSkeleton({ quantidade = 3 }: { quantidade?: number }) {
  return (
    <div aria-busy="true" aria-label="Carregando seus caminhos" className="patient-cartas">
      {Array.from({ length: quantidade }, (_, index) => (
        <div key={index} className="patient-carta">
          <div className="flex items-start gap-4">
            <Bloco className="size-20 rounded-2xl lg:size-24" />
            <div className="flex-1 space-y-2.5">
              <Bloco className="h-5 w-3/4" />
              <Bloco className="h-3.5 w-full" />
              <Bloco className="h-3.5 w-5/6" />
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <Bloco className="h-11 w-48 rounded-full" />
            <Bloco className="h-11 w-28 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ComparacaoSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando a comparação" className="patient-card p-6 lg:p-8">
      <Bloco className="h-3 w-32" />
      <div className="mt-5 flex flex-wrap gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <Bloco key={index} className="h-11 w-28 rounded-full" />
        ))}
      </div>
      <div className="mt-6 space-y-4">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="space-y-2">
            <Bloco className="h-3.5 w-44" />
            <Bloco className="h-2.5 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
