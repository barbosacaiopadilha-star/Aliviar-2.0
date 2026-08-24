import { CartasSkeleton, HeroSkeleton } from "@/components/paciente/experiencia/skeletons";

/**
 * O carregamento da home tem a forma da home. Quando o conteúdo chega, nada
 * salta de lugar — e quem está ansioso já vê o desenho do que está vindo em
 * vez de um spinner genérico que só diz "espere".
 *
 * MERGE DE 23/08 · a Home passou a ser estado + Curadoria; o esqueleto
 * acompanha: o hero e as cartas. A régua e o Perfil saíram da tela — e do
 * desenho dela.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <HeroSkeleton />
      <CartasSkeleton />
    </div>
  );
}
