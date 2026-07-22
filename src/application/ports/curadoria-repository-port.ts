import type { SessaoCuradoria } from "@/domain/curadoria/sessao-curadoria";

export interface AbrirSessaoDeCuradoriaInput {
  jornadaId: string;
}

export interface CuradoriaRepositoryPort {
  abrirSessao(
    input: AbrirSessaoDeCuradoriaInput,
    curadorId: string,
  ): Promise<SessaoCuradoria>;
}
