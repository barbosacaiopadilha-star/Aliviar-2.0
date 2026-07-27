import {
  HeroSkeleton,
  ProfileSkeleton,
  WalkSkeleton,
} from "@/components/paciente/experiencia/skeletons";

/**
 * O carregamento da home tem a forma da home. Quando o conteúdo chega, nada
 * salta de lugar — e quem está ansioso já vê o desenho do que está vindo em
 * vez de um spinner genérico que só diz "espere".
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <HeroSkeleton />
      <WalkSkeleton />
      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileSkeleton />
        <ProfileSkeleton />
      </div>
    </div>
  );
}
