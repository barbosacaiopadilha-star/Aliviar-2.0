import { BaseSequencer, type TestSpecification } from "vitest/node";

/**
 * O sentinela roda por último — sempre.
 *
 * O Vitest ordena os arquivos por tamanho, não por nome, então `zz-` no
 * arquivo não bastaria. Este sequenciador mantém a ordenação padrão e apenas
 * empurra o sentinela para o fim: ele precisa observar o banco depois que
 * todos os outros arquivos já limparam o que criaram.
 */
export default class SentinelaPorUltimo extends BaseSequencer {
  async sort(arquivos: TestSpecification[]): Promise<TestSpecification[]> {
    const ordenados = await super.sort(arquivos);
    const ehSentinela = (arquivo: TestSpecification) => arquivo.moduleId.includes("zz-sentinela");
    return [...ordenados.filter((a) => !ehSentinela(a)), ...ordenados.filter(ehSentinela)];
  }
}
