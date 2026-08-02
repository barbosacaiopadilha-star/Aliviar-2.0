#!/usr/bin/env node
/**
 * VERIFICAÇÃO PÓS-SEED — o seed da Mesa deixa dados vivos, e isto prova.
 *
 * Por que existe: o seed (`SEED_MESA=1`) passou verde durante semanas enquanto
 * o `teardown()` do globalSetup da suíte apagava tudo que ele criou — o
 * processo do Vitest saía com sucesso e `curadoria.cases` terminava com 0
 * linhas. Nenhuma asserção DENTRO do processo do teste enxerga isso: o
 * teardown roda depois de todas elas.
 *
 * Por isso este script roda como um processo SEPARADO, depois que o Vitest
 * (teardown global incluído) já saiu. Se qualquer limpeza voltar a desfazer o
 * seed, `npm run seed:mesa:local` falha aqui, no mesmo comando.
 */

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { AmbienteBloqueadoError, resolverAlvoLocal } from "./env-guard.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

let alvo;
try {
  alvo = resolverAlvoLocal("Verificação pós-seed da Mesa", { cwd: projectRoot });
} catch (erro) {
  if (erro instanceof AmbienteBloqueadoError) {
    console.error(erro.message);
    process.exit(1);
  }
  throw erro;
}

const admin = createClient(alvo.NEXT_PUBLIC_SUPABASE_URL, alvo.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: "curadoria" },
});

const falhas = [];

const { count: casos, error: erroCasos } = await admin
  .from("cases")
  .select("*", { count: "exact", head: true })
  .eq("is_certification", true);
if (erroCasos) falhas.push(`cases: ${erroCasos.message}`);
else if (!casos) falhas.push("nenhum Case de certificação sobreviveu ao fim do processo do seed.");

const { count: fixtures, error: erroFixtures } = await admin
  .from("professional_profiles")
  .select("*", { count: "exact", head: true })
  .eq("is_test_fixture", true)
  .eq("publication_status", "publicado");
if (erroFixtures) falhas.push(`professional_profiles: ${erroFixtures.message}`);
else if ((fixtures ?? 0) < 4)
  falhas.push(`só ${fixtures ?? 0} de 4 fixtures publicadas sobreviveram ao fim do processo do seed.`);

if (falhas.length > 0) {
  console.error(
    [
      "SEED NÃO PERSISTIU — alguma limpeza apagou o que o seed criou:",
      ...falhas.map((f) => `  - ${f}`),
      "Suspeito usual: um teardown que não respeita SEED_MESA (ver tests/integration/limpeza/global.ts)",
      "ou uma execução concorrente da suíte de integração contra o mesmo banco local.",
    ].join("\n"),
  );
  process.exit(1);
}

console.log(
  `Seed persistiu: ${casos} Case(s) de certificação e ${fixtures} fixtures publicadas continuam no banco.`,
);
