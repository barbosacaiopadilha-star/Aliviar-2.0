/**
 * O limiar entre ambientes — Arquitetura do Lugar §11.3, dentro de uma página.
 *
 * Toda travessia tem um instante de superfície limpa com o nome do que se
 * entra: nomeia, separa e prepara. É o oposto de um loading — não há barra,
 * não há espera, não há porcentagem. Só vazio deliberado e um nome em serifa,
 * peso regular (título de ambiente nunca é bold — Sistema Visual §6.2).
 *
 * Componente novo porque nenhum existente tem este papel: a Travessia §8
 * registrou o limiar como "vazio estrutural, nenhum componente" — este é o
 * vazio estrutural com nome próprio, reutilizável entre os cômodos.
 */
export function Limiar({ nome }: { nome: string }) {
  return (
    <div className="pb-6 pt-16 lg:pt-24">
      <h2 className="font-serif text-lg font-normal tracking-wide text-[var(--color-ink-muted)]">
        {nome}
      </h2>
    </div>
  );
}
