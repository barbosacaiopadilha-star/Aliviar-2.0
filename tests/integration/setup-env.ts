import path from "node:path";

import { assertSupabaseLocal, lerArquivoEnv } from "../../scripts/env-guard.mjs";

/**
 * O ALVO DA SUÍTE DE INTEGRAÇÃO — local, sempre, provado antes do primeiro
 * teste.
 *
 * Este arquivo lia `.env.local`. Como `.env.local` deste repositório aponta
 * deliberadamente para um projeto hospedado, a suíte inteira — que cria e
 * apaga contas, Cases e profissionais — passou a autenticar contra ele. Não
 * escreveu nada lá (as credenciais locais não existem no projeto remoto, e
 * todos os 162 logins falharam), mas isso foi sorte, não proteção.
 *
 * Ordem de precedência agora:
 *   1. variáveis já injetadas no processo (`npm run test:integration:local`);
 *   2. `.env.test.local`, se existir — arquivo dedicado, opcional;
 *   3. `.env.development.local`, que a própria stack local gera;
 *   4. nada mais. `.env.local` não é lido aqui.
 *
 * E, no fim, a guarda: se o alvo não for local, a suíte falha antes da
 * primeira chamada de rede.
 */
const raiz = path.resolve(__dirname, "../..");

for (const arquivo of [".env.test.local", ".env.development.local"]) {
  for (const [chave, valor] of Object.entries(lerArquivoEnv(path.join(raiz, arquivo)))) {
    if (!process.env[chave]) process.env[chave] = valor;
  }
}

assertSupabaseLocal(process.env.NEXT_PUBLIC_SUPABASE_URL, "Suíte de integração");
