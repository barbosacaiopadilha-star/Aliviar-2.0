/**
 * A Faixa do Comum — o Terreno Comum da Mesa (A_MESA §3.1; Sistema Visual
 * §11.1-b; O1).
 *
 * Componente novo com papel já previsto: a árvore da Arquitetura dos
 * Componentes (§9, nota ¹) o nomeia como papel da Mesa ainda sem componente
 * no RC1. Família: Faixa (vocabulário visual F2 §12 — "superfície indivisa,
 * sem colunas; se tem divisão, não é faixa"). Ambiente: exclusivo da Mesa.
 * Nenhum componente existente cumpre o papel: cartão divide, painel enquadra
 * — a faixa é uma superfície única atravessando a largura, lida ANTES de
 * existir qualquer coluna.
 *
 * Só fatos e enquadramento aprovado: mesmo processo, mesma preparação, ordem
 * de apresentação. Nunca selo coletivo ("os três são excelentes" é elogio
 * que reintroduz a régua), nunca inferência de qualidade.
 */
export function FaixaDoComum({ curatorName }: { curatorName?: string | null }) {
  const quem = curatorName ?? "seu Curador";

  return (
    <div className="rounded-md bg-[rgb(90_125_106_/_0.08)] px-6 py-5 lg:px-8">
      {/* Bisturi de 22/08 (decisão do Fundador): uma frase no lugar de duas
          — os três fatos aprovados intactos: mesmo processo, o que muda, e a
          ordem como apresentação. */}
      <p className="max-w-prose font-serif text-base leading-[1.65] text-[var(--patient-ink)]">
        Os três foram preparados para o seu caso por {quem}, pelo mesmo processo — o que muda é
        onde o jeito de cada um encontra o que você disse importar. A ordem é só a da
        apresentação.
      </p>
    </div>
  );
}
