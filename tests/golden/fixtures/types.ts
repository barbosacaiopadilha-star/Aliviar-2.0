// Tipo comum a toda fixture golden — ver docs/ace/05-knowledge/golden-set-testing.md.
//
// `assert` verifica REGRA (o que a especificação exige dado aquele caso),
// nunca igualdade textual exata com a saída do modelo — o Kernel (seção 4)
// aceita variação de estilo, nunca variação de regra.

export type GoldenFixture<TArtifact> = {
  name: string;
  /** T-números de tests.md que esta fixture cobre, só para rastreabilidade. */
  covers: string[];
  assert(artifact: TArtifact): void;
};
