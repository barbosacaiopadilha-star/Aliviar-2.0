import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h1>Página não encontrada</h1>
      <p>Esta página não existe ou foi movida.</p>
      <p>
        <Link href="/">Voltar para o início</Link>
      </p>
    </div>
  );
}
