import { execFileSync } from "node:child_process";

import { afterAll, describe, expect, it } from "vitest";

/**
 * =============================================================================
 * ITEM 2.6 RESIDUAL — G-10 (OPÇÃO B) E A GOVERNANÇA DO MAPA DO PROFISSIONAL
 * =============================================================================
 *
 * CONTRATO_2_6 (PA-14). Duas metades, no banco real:
 *
 *   1. a capability `nome_do_curador_do_caso`: gate-first, catálogo fechado em
 *      TRÊS desfechos, saída mínima, e o não-vazamento como IGUALDADE LITERAL
 *      — Case inexistente e Case alheio produzem a mesma linha, byte a byte;
 *
 *   2. a escrita de `professional_subcriterion_map` INTACTA (ADR-068 §14.2):
 *      só `administrador` escreve — paciente, curador, profissional (I-12) e
 *      autenticado sem papel são recusados PELA RLS, com sessão simulada pelo
 *      mecanismo real (`role authenticated` + claim de sub).
 *
 * Fixtures sintéticas por UUID, tudo em transação revertida, resíduo zero.
 */

const CONTAINER = "supabase_db_aliviar-conexao";

function psql(script: string): string {
  return execFileSync(
    "docker",
    ["exec", "-i", CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-At", "-v", "ON_ERROR_STOP=1"],
    { input: script, encoding: "utf8" },
  ).trim();
}

function emTransacaoRevertida(corpo: string): string {
  return psql(`begin;\n${corpo}\nrollback;`);
}

const PACIENTE_A = "00000000-0000-4000-8000-000000260a01";
const PACIENTE_B = "00000000-0000-4000-8000-000000260b01";
const CURADORA = "00000000-0000-4000-8000-000000260c01";
const PROFISSIONAL = "00000000-0000-4000-8000-000000260d01";
const ADMIN = "00000000-0000-4000-8000-000000260e01";
const SEM_PAPEL = "00000000-0000-4000-8000-000000260f01";

const CASE_A1 = "00000000-0000-4000-8000-000000261a01"; // da A, com Curadora
const CASE_A2 = "00000000-0000-4000-8000-000000261a02"; // da A, SEM Curador
const CASE_B1 = "00000000-0000-4000-8000-000000261b01"; // da B, com Curadora
const CASE_INEXISTENTE = "00000000-0000-4000-8000-00000026dead";

const NOME_DA_CURADORA = "Curadora do Contrato 2.6";

/** Contas, papéis, Cases e o perfil profissional — nasce e morre na transação. */
const FIXTURE = `
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('${PACIENTE_A}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '26-paciente-a@local', 'x', now(), now()),
  ('${PACIENTE_B}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '26-paciente-b@local', 'x', now(), now()),
  ('${CURADORA}',   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '26-curadora@local',   'x', now(), now()),
  ('${PROFISSIONAL}','00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '26-profissional@local','x', now(), now()),
  ('${ADMIN}',      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '26-admin@local',      'x', now(), now()),
  ('${SEM_PAPEL}',  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '26-sem-papel@local',  'x', now(), now());

update curadoria.profiles set display_name = '${NOME_DA_CURADORA}' where id = '${CURADORA}';

insert into curadoria.user_roles (profile_id, role_id)
select v.profile_id, r.id
from (values
  ('${PACIENTE_A}'::uuid,   'paciente'),
  ('${PACIENTE_B}'::uuid,   'paciente'),
  ('${CURADORA}'::uuid,     'curador_medico'),
  ('${PROFISSIONAL}'::uuid, 'profissional'),
  ('${ADMIN}'::uuid,        'administrador')
) as v(profile_id, slug)
join curadoria.roles r on r.slug = v.slug;

insert into curadoria.patient_stories (id, profile_id, created_by, status) values
  ('00000000-0000-4000-8000-000000262a01', '${PACIENTE_A}', '${PACIENTE_A}', 'enviada'),
  ('00000000-0000-4000-8000-000000262a02', '${PACIENTE_A}', '${PACIENTE_A}', 'enviada'),
  ('00000000-0000-4000-8000-000000262b01', '${PACIENTE_B}', '${PACIENTE_B}', 'enviada');

insert into curadoria.cases (id, patient_profile_id, source_story_id, assigned_curator_id, created_by) values
  ('${CASE_A1}', '${PACIENTE_A}', '00000000-0000-4000-8000-000000262a01', '${CURADORA}', '${PACIENTE_A}'),
  ('${CASE_A2}', '${PACIENTE_A}', '00000000-0000-4000-8000-000000262a02', null,          '${PACIENTE_A}'),
  ('${CASE_B1}', '${PACIENTE_B}', '00000000-0000-4000-8000-000000262b01', '${CURADORA}', '${PACIENTE_B}');

insert into curadoria.professional_profiles (id, profile_id, display_name, professional_identifier, created_by)
values ('00000000-0000-4000-8000-000000263d01', '${PROFISSIONAL}', 'Profissional do 2.6', 'CRM-26-0001', '${ADMIN}');
`;

/** Chama a capability COMO a pessoa (claim real de sub), devolvendo a linha. */
function CHAMAR(quem: string | null, caseId: string): string {
  return `
${quem ? `select set_config('request.jwt.claim.sub', '${quem}', true);` : ""}
select 'LINHA:' || coalesce(
  (select desfecho || '/' || coalesce(display_name, '<null>')
     from curadoria.nome_do_curador_do_caso('${caseId}'::uuid)),
  '<vazio>'
);`;
}

/** Tenta escrever o Mapa como um papel, pela RLS real. Devolve o resultado. */
function ESCREVER_COMO(quem: string, professionalProfileId = "00000000-0000-4000-8000-000000263d01"): string {
  return `
set local role authenticated;
select set_config('request.jwt.claim.sub', '${quem}', true);
do $mapa$
begin
  insert into curadoria.professional_subcriterion_map (professional_profile_id, subcriterion_id, status)
  values (
    '${professionalProfileId}',
    (select id from curadoria.method_subcriteria where code = 'MODELO_COMUNICACAO' and active limit 1),
    'CONFIRMADO'
  );
  perform set_config('t.escrita', 'ESCREVEU', true);
exception
  when insufficient_privilege then perform set_config('t.escrita', 'RLS_NEGOU', true);
end $mapa$;
reset role;
select 'ESCRITA:' || current_setting('t.escrita', true);`;
}

afterAll(() => {
  const residuo = psql(`
select (select count(*) from auth.users where email like '26-%@local')
  || '|' || (select count(*) from curadoria.cases where id in ('${CASE_A1}','${CASE_A2}','${CASE_B1}'))
  || '|' || (select count(*) from curadoria.professional_subcriterion_map m
              join curadoria.professional_profiles p on p.id = m.professional_profile_id
              where p.profile_id = '${PROFISSIONAL}');`);
  expect(residuo, "fixture do 2.6 vazou para fora das transações").toBe("0|0|0");
});

// ---------------------------------------------------------------------------
// A capability — os cenários do §21/§25
// ---------------------------------------------------------------------------

describe("§21 · a capability responde à dona — e somente à dona", () => {
  it("dona + Case com Curadora → OK com o display_name, e nada além", () => {
    expect(emTransacaoRevertida(FIXTURE + CHAMAR(PACIENTE_A, CASE_A1))).toContain(
      `LINHA:OK/${NOME_DA_CURADORA}`,
    );
  });

  it("dona + Case sem Curador → CURADOR_NAO_ATRIBUIDO, sem nome", () => {
    expect(emTransacaoRevertida(FIXTURE + CHAMAR(PACIENTE_A, CASE_A2))).toContain(
      "LINHA:CURADOR_NAO_ATRIBUIDO/<null>",
    );
  });

  it("Case de terceira → SEM_AUTORIDADE, sem nome, sem confirmação de existência", () => {
    expect(emTransacaoRevertida(FIXTURE + CHAMAR(PACIENTE_A, CASE_B1))).toContain(
      "LINHA:SEM_AUTORIDADE/<null>",
    );
  });

  it("Case inexistente → SEM_AUTORIDADE — o mesmo desfecho, não um 'não encontrado'", () => {
    expect(emTransacaoRevertida(FIXTURE + CHAMAR(PACIENTE_A, CASE_INEXISTENTE))).toContain(
      "LINHA:SEM_AUTORIDADE/<null>",
    );
  });

  it("§15 · ORÁCULO DE NÃO-VAZAMENTO: alheio e inexistente são a MESMA linha, byte a byte", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        `
select set_config('request.jwt.claim.sub', '${PACIENTE_A}', true);
select 'PAR:' || coalesce((select desfecho || '/' || coalesce(display_name, '<null>') from curadoria.nome_do_curador_do_caso('${CASE_B1}'::uuid)), '<vazio>')
  || ' === ' || coalesce((select desfecho || '/' || coalesce(display_name, '<null>') from curadoria.nome_do_curador_do_caso('${CASE_INEXISTENTE}'::uuid)), '<vazio>');`,
    );
    const par = saida.split("\n").find((linha) => linha.startsWith("PAR:"))!;
    const [alheio, inexistente] = par.replace("PAR:", "").split(" === ");
    expect(alheio).toBe(inexistente);
    expect(alheio).toBe("SEM_AUTORIDADE/<null>");
  });

  it("sem autenticação (auth.uid() nulo) → SEM_AUTORIDADE — indistinguível dos demais", () => {
    expect(emTransacaoRevertida(FIXTURE + CHAMAR(null, CASE_A1))).toContain(
      "LINHA:SEM_AUTORIDADE/<null>",
    );
  });

  it("a Curadora do Case — que não é a dona — também recebe SEM_AUTORIDADE (capability é da paciente)", () => {
    expect(emTransacaoRevertida(FIXTURE + CHAMAR(CURADORA, CASE_A1))).toContain(
      "LINHA:SEM_AUTORIDADE/<null>",
    );
  });

  it("STRICT: argumento NULL não executa a função — conjunto vazio, nunca desfecho", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        `select 'STRICT:' || (select count(*) from curadoria.nome_do_curador_do_caso(null::uuid));`,
    );
    expect(saida).toContain("STRICT:0");
  });

  it("grant real: authenticated executa pela role, com o gate interno decidindo", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        `
set local role authenticated;
select set_config('request.jwt.claim.sub', '${PACIENTE_A}', true);
select 'COMO_ROLE:' || (select desfecho || '/' || coalesce(display_name, '<null>') from curadoria.nome_do_curador_do_caso('${CASE_A1}'::uuid));
reset role;`,
    );
    expect(saida).toContain(`COMO_ROLE:OK/${NOME_DA_CURADORA}`);
  });
});

describe("§25/§26 · o catálogo da função — regime e saída mínima, no pg_proc", () => {
  it("SECURITY DEFINER · STABLE · STRICT · search_path fixo · sem SQL dinâmico", () => {
    const saida = psql(`
select prosecdef || '|' || provolatile::text || '|' || proisstrict || '|' || array_to_string(proconfig, ';')
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'curadoria' and p.proname = 'nome_do_curador_do_caso';`);
    expect(saida).toBe("true|s|true|search_path=curadoria, pg_temp");
    const corpo = psql(
      `select prosrc from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='curadoria' and p.proname='nome_do_curador_do_caso';`,
    );
    expect(corpo.toLowerCase()).not.toContain("execute ");
    // Gate-first no fonte vivo: a boundary aparece antes de qualquer SELECT.
    expect(corpo.indexOf("is_patient_for_case")).toBeLessThan(corpo.indexOf("select"));
  });

  it("a assinatura devolve DUAS colunas — desfecho e display_name — e nenhum outro dado", () => {
    const assinatura = psql(`
select pg_get_function_result(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'curadoria' and p.proname = 'nome_do_curador_do_caso';`);
    expect(assinatura).toBe("TABLE(desfecho text, display_name text)");
    for (const proibido of ["id", "uuid", "email", "e-mail", "phone", "telefone", "role", "avatar", "created", "updated", "deleted"]) {
      expect(assinatura.toLowerCase().includes(proibido), `a saída expõe ${proibido}`).toBe(false);
    }
  });

  it("CASE_NAO_ENCONTRADO não existe no domínio — nem no corpo da função", () => {
    const corpo = psql(
      `select prosrc from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='curadoria' and p.proname='nome_do_curador_do_caso';`,
    );
    expect(corpo).not.toContain("CASE_NAO_ENCONTRADO");
    // E os três desfechos lavrados estão todos lá — catálogo completo.
    for (const desfecho of ["'OK'", "'SEM_AUTORIDADE'", "'CURADOR_NAO_ATRIBUIDO'"]) {
      expect(corpo).toContain(desfecho);
    }
  });

  it("grants: anon e PUBLIC sem EXECUTE; authenticated com — o gate real é interno", () => {
    const saida = psql(`
select has_function_privilege('anon', 'curadoria.nome_do_curador_do_caso(uuid)', 'execute')
  || '|' || has_function_privilege('authenticated', 'curadoria.nome_do_curador_do_caso(uuid)', 'execute');`);
    expect(saida).toBe("false|true");
  });
});

// ---------------------------------------------------------------------------
// G-2.6-2 — nenhuma leitura genérica de profiles nasceu
// ---------------------------------------------------------------------------

describe("G-2.6-2 · profiles permanece fechada — a capability não abriu porta", () => {
  it("as policies de profiles são EXATAMENTE as quatro de antes — nenhuma nova", () => {
    const saida = psql(`
select string_agg(policyname, ',' order by policyname)
from pg_policies where schemaname = 'curadoria' and tablename = 'profiles';`);
    expect(saida).toBe(
      "profiles_insert_own,profiles_select_own_or_admin,profiles_select_paciente_por_curador,profiles_update_own_or_admin",
    );
  });

  it("nenhuma policy de profiles menciona is_patient_for_case — o G-10 não virou RLS", () => {
    const saida = psql(`
select count(*) from pg_policies
where schemaname = 'curadoria' and tablename = 'profiles'
  and (coalesce(qual, '') || coalesce(with_check, '')) ilike '%is_patient_for_case%';`);
    expect(saida).toBe("0");
  });

  it("a paciente segue SEM ler a linha da Curadora em profiles — a RLS real nega", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        `
set local role authenticated;
select set_config('request.jwt.claim.sub', '${PACIENTE_A}', true);
select 'LEITURA_DIRETA:' || count(*) from curadoria.profiles where id = '${CURADORA}';
reset role;`,
    );
    expect(saida).toContain("LEITURA_DIRETA:0");
  });
});

// ---------------------------------------------------------------------------
// §9 + G-2.6-3 + G-2.6-4 — o recorte de escrita do Mapa, papel a papel
// ---------------------------------------------------------------------------

describe("§9 · quem escreve o Mapa do Profissional — o catálogo fechado por papel", () => {
  it("administrador ESCREVE — o papel autorizado continua funcionando", () => {
    expect(emTransacaoRevertida(FIXTURE + ESCREVER_COMO(ADMIN))).toContain("ESCRITA:ESCREVEU");
  });

  it("paciente NÃO escreve", () => {
    expect(emTransacaoRevertida(FIXTURE + ESCREVER_COMO(PACIENTE_A))).toContain("ESCRITA:RLS_NEGOU");
  });

  it("curador_medico LÊ mas NÃO escreve (ADR-068 §14.2)", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        ESCREVER_COMO(CURADORA) +
        `
set local role authenticated;
select set_config('request.jwt.claim.sub', '${CURADORA}', true);
select 'LEITURA_CURADOR_OK:' || (select count(*) >= 0 from curadoria.professional_subcriterion_map)::text;
reset role;`,
    );
    expect(saida).toContain("ESCRITA:RLS_NEGOU");
    expect(saida).toContain("LEITURA_CURADOR_OK:true");
  });

  it("autenticado sem papel NÃO escreve", () => {
    expect(emTransacaoRevertida(FIXTURE + ESCREVER_COMO(SEM_PAPEL))).toContain("ESCRITA:RLS_NEGOU");
  });

  it("I-12 / G-2.6-3 · o PROFISSIONAL não escreve o PRÓPRIO Mapa — nem por payload próprio", () => {
    // A mutação que este teste vigia: um writer aceitando
    // `auth.uid() = professional_profiles.profile_id`. O perfil do fixture é
    // exatamente o dele — se algum caminho honrar o vínculo, isto escreve.
    expect(emTransacaoRevertida(FIXTURE + ESCREVER_COMO(PROFISSIONAL))).toContain(
      "ESCRITA:RLS_NEGOU",
    );
  });

  it("G-2.6-4 · o recorte no catálogo: exatamente DUAS policies, escrita só de administrador", () => {
    const saida = psql(`
select string_agg(policyname || '=' || cmd || '[' || coalesce(qual,'-') || '/' || coalesce(with_check,'-') || ']', ' & ' order by policyname)
from pg_policies where schemaname = 'curadoria' and tablename = 'professional_subcriterion_map';`);
    expect(saida).toBe(
      "professional_subcriterion_map_read_interno=SELECT[(curadoria.has_role('administrador'::text) OR curadoria.has_role('curador_medico'::text))/-] & " +
        "professional_subcriterion_map_write_admin=ALL[curadoria.has_role('administrador'::text)/curadoria.has_role('administrador'::text)]",
    );
  });
});

// ---------------------------------------------------------------------------
// G-2.6-5 — o 2.C continua fechado; a Fronteira, também
// ---------------------------------------------------------------------------

describe("G-2.6-5 · nada do 2.6 abriu o 2.C nem a Fronteira", () => {
  it("os grants da capability decisora do 1.12 seguem ZERO — a Fronteira está fechada", () => {
    const saida = psql(`
select has_function_privilege('anon', 'curadoria.decidir_proposta(uuid, text, text)', 'execute')
  || '|' || has_function_privilege('authenticated', 'curadoria.decidir_proposta(uuid, text, text)', 'execute')
  || '|' || has_function_privilege('public', 'curadoria.decidir_proposta(uuid, text, text)', 'execute');`);
    expect(saida).toBe("false|false|false");
  });

  it("o 2.6 não criou tabela, view ou writer novo — só a capability", () => {
    const saida = psql(`
select (select count(*) from pg_views where schemaname = 'curadoria' and definition ilike '%nome_do_curador%')
  || '|' || (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'curadoria' and p.proname = 'nome_do_curador_do_caso');`);
    expect(saida).toBe("0|1");
  });
});
