#!/usr/bin/env node
// Bootstrap idempotente de contas de teste tecnico no Supabase local
// (TASK-004A). So roda contra o Supabase local — nunca contra um projeto
// hospedado (nenhuma URL de projeto remoto é usada aqui).
//
// Nunca imprime senha. A service role key é lida em tempo de execução
// (mesma técnica de scripts/generate-local-env.mjs) e nunca persistida em
// nenhum arquivo — vive só na memória deste processo enquanto ele roda.
// As senhas geradas são gravadas apenas em test-users.local.json, coberto
// pelo padrão `*.local.json` do .gitignore.

import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

const TEST_ACCOUNTS = [
  { role: "administrador", email: "admin.teste@aliviar-conexao.local", displayName: "Admin Teste" },
  { role: "profissional", email: "profissional.teste@aliviar-conexao.local", displayName: "Profissional Teste" },
  { role: "paciente", email: "paciente.teste@aliviar-conexao.local", displayName: "Paciente Teste" },
  { role: "curador_medico", email: "curador.teste@aliviar-conexao.local", displayName: "Curador Teste" },
];

function readLocalSupabaseEnv() {
  const result = spawnSync("npx supabase status -o env", {
    cwd: projectRoot,
    encoding: "utf-8",
    shell: true,
  });

  if (result.status !== 0) {
    console.error(
      "Não foi possível ler o status da stack Supabase local. Ela está rodando? (npm run supabase:start)",
    );
    console.error(result.stderr?.trim() || "(sem detalhes adicionais)");
    process.exit(result.status ?? 1);
  }

  const values = {};
  for (const line of result.stdout.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) {
      values[match[1]] = match[2].trim().replace(/^"|"$/g, "");
    }
  }
  return values;
}

function generatePassword() {
  return randomBytes(24).toString("base64url");
}

async function main() {
  const env = readLocalSupabaseEnv();
  const apiUrl = env.API_URL;
  const serviceRoleKey = env.SERVICE_ROLE_KEY;

  if (!apiUrl || !serviceRoleKey) {
    console.error(
      "API_URL/SERVICE_ROLE_KEY não encontrados na saída de `supabase status -o env`.",
    );
    process.exit(1);
  }

  const admin = createClient(apiUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: rolesData, error: rolesError } = await admin.from("roles").select("id, slug");
  if (rolesError) {
    console.error("Falha ao ler o catálogo de papéis:", rolesError.message);
    process.exit(1);
  }
  const roleIdBySlug = Object.fromEntries(rolesData.map((r) => [r.slug, r.id]));

  const { data: listData, error: listError } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (listError) {
    console.error("Falha ao listar usuários existentes:", listError.message);
    process.exit(1);
  }

  const results = [];

  for (const account of TEST_ACCOUNTS) {
    const password = generatePassword();
    const existing = listData.users.find((u) => u.email === account.email);

    let userId;
    if (existing) {
      const { data, error } = await admin.auth.admin.updateUserById(existing.id, { password });
      if (error) {
        console.error(`Falha ao atualizar senha de "${account.role}":`, error.message);
        process.exit(1);
      }
      userId = data.user.id;
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: account.email,
        password,
        email_confirm: true,
        user_metadata: { display_name: account.displayName },
      });
      if (error) {
        console.error(`Falha ao criar usuário "${account.role}":`, error.message);
        process.exit(1);
      }
      userId = data.user.id;
    }

    const roleId = roleIdBySlug[account.role];
    if (!roleId) {
      console.error(`Papel "${account.role}" não encontrado no catálogo public.roles.`);
      process.exit(1);
    }

    const { error: roleError } = await admin
      .from("user_roles")
      .upsert({ profile_id: userId, role_id: roleId }, { onConflict: "profile_id,role_id" });

    if (roleError) {
      console.error(`Falha ao atribuir papel a "${account.role}":`, roleError.message);
      process.exit(1);
    }

    results.push({ role: account.role, email: account.email, password });
  }

  const outputPath = resolve(projectRoot, "test-users.local.json");
  writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");

  console.log(
    `${results.length} conta(s) de teste criada(s)/atualizada(s). Credenciais gravadas em test-users.local.json (não versionado, valores não exibidos aqui).`,
  );
}

main().catch((err) => {
  console.error("Falha inesperada no bootstrap:", err.message);
  process.exit(1);
});
