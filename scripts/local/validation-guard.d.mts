export declare const VAR_AUTORIZACAO: string;

export declare const AMBIENTES_CONHECIDOS: Record<
  string,
  { nome: string; autorizavel: boolean; motivo: string }
>;

export declare class ValidacaoBloqueadaError extends Error {}

export declare function descreverAmbiente(url: string | undefined): string;

export declare function assertValidacaoAutorizada(
  url: string | undefined,
  comando: string,
  ambiente?: Record<string, string | undefined>,
): string;
