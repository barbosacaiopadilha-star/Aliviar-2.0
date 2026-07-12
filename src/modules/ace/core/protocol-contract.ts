// Contrato de protocolo — todo protocolo do ACE tem uma única
// responsabilidade, recebe uma entrada definida e produz exatamente um
// artefato (docs/ace/01-framework/framework.md, seção 1).

import type { Artifact } from "./artifact-contract";
import type { ProtocolId } from "./protocol-id";

export interface ProtocolContract<TInput, TOutput extends Artifact> {
  readonly id: ProtocolId;
  readonly name: string;
  execute(input: TInput): Promise<TOutput>;
}
