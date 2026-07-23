import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h1>Não encontramos esta página</h1>
      <p>
        O endereço que você acessou não existe ou foi movido. Sem problema —
        vamos te levar de volta.
      </p>
      <p>
        <Link href="/">Voltar para o início</Link>
      </p>
    </div>
  );
}
