/**
 * Tipos da guarda de ambiente. O módulo é `.mjs` porque precisa ser
 * importável por scripts Node soltos, sem passo de build — mas o setup da
 * suíte de integração é TypeScript e merece a mesma checagem que o resto.
 */

export declare const HOSTS_LOCAIS: string[];
export declare const PROJETOS_PROIBIDOS: Record<string, string>;

export declare class AmbienteBloqueadoError extends Error {}

export declare function refDoProjeto(url: string | undefined): string | null;
export declare function ehSupabaseLocal(url: string | undefined): boolean;
export declare function assertSupabaseLocal(url: string | undefined, comando: string): string;
export declare function lerArquivoEnv(caminho: string): Record<string, string>;

export type AlvoLocal = {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
};

export declare function lerStackLocal(options?: { cwd?: string }): AlvoLocal;
export declare function resolverAlvoLocal(comando: string, options?: { cwd?: string }): AlvoLocal;
