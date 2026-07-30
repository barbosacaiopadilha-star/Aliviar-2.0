import { CartasSkeleton, ComparacaoSkeleton } from "@/components/paciente/experiencia/skeletons";

/** As cartas chegam na própria forma — sem flash, sem salto de layout. */
export default function Loading() {
  return (
    <div className="space-y-8">
      <CartasSkeleton />
      <ComparacaoSkeleton />
    </div>
  );
}
