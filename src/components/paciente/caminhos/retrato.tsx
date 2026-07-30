import { cn } from "@/components/ui/cn";

/**
 * Retrato tipográfico — presença sem foto que não existe.
 *
 * O cadastro da Aliviar não guarda fotografia de profissional, e inventar uma
 * (avatar genérico, silhueta, foto de banco) seria mostrar à pessoa algo que
 * não é aquele médico. As iniciais em composição própria dão à carta a
 * presença visual que ela precisa sem prometer um rosto.
 *
 * Determinístico: o mesmo nome produz sempre o mesmo tratamento, para que a
 * carta seja reconhecível entre visitas. Cor derivada do nome, dentro da
 * paleta — nunca aleatória.
 */
const TRATAMENTOS = [
  "from-[#1a2e26] to-[#2f4a3c]",
  "from-[#2c4033] to-[#4a6553]",
  "from-[#1f3329] to-[#3d5647]",
] as const;

function iniciais(nome: string): string {
  const partes = nome
    .replace(/^(Dra?\.|Dr\.)\s*/i, "")
    .split(/\s+/)
    .filter(Boolean);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
  return (primeira + ultima).toUpperCase() || "?";
}

function tratamentoDe(nome: string): string {
  let soma = 0;
  for (const char of nome) soma += char.charCodeAt(0);
  return TRATAMENTOS[soma % TRATAMENTOS.length]!;
}

export function Retrato({
  nome,
  tamanho = "grande",
  className,
}: {
  nome: string;
  tamanho?: "grande" | "medio";
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-serif font-medium text-[var(--patient-linen)] shadow-lg shadow-emerald-950/15",
        tratamentoDe(nome),
        tamanho === "grande" ? "size-20 text-2xl lg:size-24 lg:text-3xl" : "size-12 text-base",
        className,
      )}
    >
      {iniciais(nome)}
    </div>
  );
}
