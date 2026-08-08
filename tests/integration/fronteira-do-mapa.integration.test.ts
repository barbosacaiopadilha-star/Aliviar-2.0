import { execFileSync } from "node:child_process";

import { afterAll, describe, expect, it } from "vitest";

/**
 * =============================================================================
 * ITEM 2.C — A FRONTEIRA ABERTA NO RECORTE EXATO, PROVADA NO BANCO
 * =============================================================================
 *
 * CONTRATO_2_C (PA-17). O que se prova:
 *
 *   · o PACOTE DE ABERTURA é exatamente o do §8: um único EXECUTE novo (a
 *     decisora, para authenticated); anon/PUBLIC revogados; tabelas sem
 *     grant; policies zero; C-01d fechada em CINCO nomes no catálogo;
 *   · o EMISSOR PROFISSIONAL é vazio-honesto: todas as recusas nominais
 *     alcançáveis, ZERO propostas até a primeira regra lavrada (CD-1);
 *   · a DECISORA estendida: gate por alvo (administrador; Curador e paciente
 *     NÃO confirmam o Mapa do Profissional — G-2.C-11, com o §13.2
 *     executável), confirmação ATÔMICA de `status` + `evidence_id` (1.8-R1),
 *     recusa = lacuna, desfechos PA-12 integrais, condição 6 por evidência
 *     corrente, A2d (não-atos não decidem);
 *   · o LADO CASE permanece vazio por construção (R-1/CD-1).
 *
 * Propostas profissionais de teste nascem por INSERT de owner (o emissor não
 * emite sem regra — e é exatamente essa a prova do vazio-honesto). Transações
 * revertidas; resíduo zero.
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

const ADMIN = "00000000-0000-4000-8000-0000002c0a01";
const OUTRO_ADMIN = "00000000-0000-4000-8000-0000002c0a02";
const CURADOR = "00000000-0000-4000-8000-0000002c0b01";
const PACIENTE = "00000000-0000-4000-8000-0000002c0c01";
const PERFIL = "00000000-0000-4000-8000-0000002c0d01";
const CASE_ID = "00000000-0000-4000-8000-0000002c1001";
const EV_FORMACAO = "00000000-0000-4000-8000-0000002c2001";
const PROPOSTA = "00000000-0000-4000-8000-0000002c3001";

const FIXTURE = `
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('${ADMIN}',      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '2c-admin@local', 'x', now(), now()),
  ('${OUTRO_ADMIN}','00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '2c-outro-admin@local', 'x', now(), now()),
  ('${CURADOR}',    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '2c-curador@local', 'x', now(), now()),
  ('${PACIENTE}',   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '2c-paciente@local', 'x', now(), now());

insert into curadoria.user_roles (profile_id, role_id)
select v.profile_id, r.id
from (values
  ('${ADMIN}'::uuid,       'administrador'),
  ('${OUTRO_ADMIN}'::uuid, 'administrador'),
  ('${CURADOR}'::uuid,     'curador_medico'),
  ('${PACIENTE}'::uuid,    'paciente')
) as v(profile_id, slug)
join curadoria.roles r on r.slug = v.slug;

insert into curadoria.patient_stories (id, profile_id, created_by, status) values
  ('00000000-0000-4000-8000-0000002c4001', '${PACIENTE}', '${PACIENTE}', 'enviada');
insert into curadoria.cases (id, patient_profile_id, source_story_id, assigned_curator_id, created_by) values
  ('${CASE_ID}', '${PACIENTE}', '00000000-0000-4000-8000-0000002c4001', '${CURADOR}', '${PACIENTE}');

insert into curadoria.professional_profiles (id, profile_id, display_name, professional_identifier, created_by) values
  ('${PERFIL}', null, 'Profissional da Fronteira', 'CRM-2C-0001', '${ADMIN}');

insert into curadoria.practice_evidence
  (id, professional_profile_id, subcriterion_code, version, options, source_tier, source, collected_at, collected_by, status)
values
  ('${EV_FORMACAO}', '${PERFIL}', 'MODELO_COMUNICACAO', 1, '{ADAPTA_A_LINGUAGEM_AO_INTERLOCUTOR}', 'INSTITUCIONAL', 'entrevista', now(), '${ADMIN}', 'nao_verificado');
`;

/** A proposta profissional sintética — o que o emissor produzirá quando houver regra. */
const PROPOSTA_PROFISSIONAL = `
insert into curadoria.derivation_rules (rule_id, version, state, proposed_by, rationale, evidence)
values ('regra-2c-teste', 1, 'PROPOSTA', '${ADMIN}', 'fixture do 2.C', 'nenhuma operacao real');
insert into curadoria.derivation_rule_transitions (rule_id, rule_version, seq, from_state, to_state, actor_id, authority, reason)
values ('regra-2c-teste', 1, 1, null, 'PROPOSTA', '${ADMIN}', 'PAPEL_INTERNO', 'fixture');
insert into curadoria.derivation_proposals
  (id, case_id, professional_profile_id, subcriterion_code, target_field, suggested_value,
   origin_record, origin_version, origin_declared_at, origin_author,
   rule_id, rule_version, catalog_version, consequence_degree, state)
values
  ('${PROPOSTA}', null, '${PERFIL}', 'MODELO_COMUNICACAO', 'status', 'CONFIRMADO',
   'practice_evidence:${EV_FORMACAO}', '1', now(), '${ADMIN}',
   'regra-2c-teste', 1, '1.1.0', 'ESTRUTURAL', 'PROPOSTA');
`;

function COMO(quem: string | null): string {
  return quem
    ? `select set_config('request.jwt.claim.sub', '${quem}', true);`
    : `select set_config('request.jwt.claim.sub', '', true);`;
}

function DECIDIR(natureza: string, motivo: string | null = null, marcador = "D"): string {
  return `select '${marcador}=' || curadoria.decidir_proposta('${PROPOSTA}'::uuid, '${natureza}', ${motivo === null ? "null" : `'${motivo}'`});`;
}

const RAIO_X = `
select 'RAIO=' || (select state from curadoria.derivation_proposals where id = '${PROPOSTA}')
  || '/atos:' || (select count(*) from curadoria.derivation_proposal_acts where proposal_id = '${PROPOSTA}')
  || '/mapa:' || coalesce((
       select m.status::text || '+' || coalesce(m.evidence_id::text, '<sem-vinculo>')
       from curadoria.professional_subcriterion_map m
       join curadoria.method_subcriteria s on s.id = m.subcriterion_id
       where m.professional_profile_id = '${PERFIL}' and s.code = 'MODELO_COMUNICACAO'
     ), '<lacuna>');`;

afterAll(() => {
  const residuo = psql(`
select (select count(*) from auth.users where email like '2c-%@local')
  || '|' || (select count(*) from curadoria.derivation_proposals where professional_profile_id is not null)
  || '|' || (select count(*) from curadoria.derivation_proposal_acts a
             join curadoria.derivation_proposals p on p.id = a.proposal_id
             where p.professional_profile_id is not null);`);
  expect(residuo, "fixture do 2.C vazou").toBe("0|0|0");
});

// ---------------------------------------------------------------------------
// §8 · O pacote de abertura — auditável pelo catálogo
// ---------------------------------------------------------------------------

describe("§8 · a abertura é EXATAMENTE o pacote — nada além (G-2.C-2)", () => {
  it("o único EXECUTE novo: a decisora para authenticated; anon e PUBLIC revogados", () => {
    const saida = psql(`
select has_function_privilege('authenticated', 'curadoria.decidir_proposta(uuid,text,text)', 'execute')::text
  || '|' || has_function_privilege('anon', 'curadoria.decidir_proposta(uuid,text,text)', 'execute')::text
  || '|' || has_function_privilege('public', 'curadoria.decidir_proposta(uuid,text,text)', 'execute')::text;`);
    expect(saida).toBe("true|false|false");
  });

  it("o emissor profissional NÃO tem grant nenhum — invocação é da operação, nunca de papel", () => {
    const saida = psql(`
select has_function_privilege('authenticated', 'curadoria.emitir_proposta_de_estado(uuid,text,uuid)', 'execute')::text
  || '|' || has_function_privilege('anon', 'curadoria.emitir_proposta_de_estado(uuid,text,uuid)', 'execute')::text;`);
    expect(saida).toBe("false|false");
  });

  it("o Mapa do Profissional mantém EXATAMENTE o regime ADR-040 que já tinha — o 2.C não o tocou", () => {
    // Precisão que o audit final exige: as tabelas da CAMADA (derivação e
    // juízo) estão em zero grant; o MAPA sempre teve grants de aplicação
    // desde `20260728020000`, gated pelas duas policies da ADR-040/§14.2 —
    // e o 2.C não mudou uma linha disso. A confirmação escreve pelo DEFINER,
    // passando pelas mesmas cercas do caminho manual.
    const saida = psql(`
select (select string_agg(privilege_type, ',' order by privilege_type)
        from information_schema.role_table_grants
        where table_schema = 'curadoria' and table_name = 'professional_subcriterion_map'
          and grantee = 'authenticated')
  || '|' || (select count(*) from information_schema.role_table_grants
             where table_schema = 'curadoria' and table_name = 'professional_subcriterion_map'
               and grantee = 'anon')
  || '|' || (select string_agg(policyname, ',' order by policyname) from pg_policies
             where schemaname = 'curadoria' and tablename = 'professional_subcriterion_map');`);
    expect(saida).toBe(
      "DELETE,INSERT,SELECT,UPDATE|0|professional_subcriterion_map_read_interno,professional_subcriterion_map_write_admin",
    );
  });

  it("as tabelas da CAMADA (derivação e juízo) seguem sem grant de aplicação e sem policy", () => {
    const saida = psql(`
select (select count(*) from information_schema.role_table_grants
        where table_schema = 'curadoria'
          and table_name in ('derivation_proposals', 'derivation_proposal_acts', 'derivation_rules', 'derivation_rule_degree_map')
          and grantee in ('anon', 'authenticated'))
  || '|' || (select count(*) from pg_policies
             where schemaname = 'curadoria'
               and tablename in ('derivation_proposals', 'derivation_proposal_acts', 'derivation_rules', 'derivation_rule_degree_map'));`);
    expect(saida).toBe("0|0");
  });

  it("RS-2.C-1 · C-01d no catálogo: as CINCO funções nominais existem — e o índice do alvo profissional também", () => {
    const saida = psql(`
select (select string_agg(p.proname, ',' order by p.proname)
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'curadoria'
          and p.proname in ('emitir_proposta_de_importancia', 'emitir_proposta_de_estado',
                            'ler_proposta_para_proveniencia', 'contar_propostas_por_desfecho',
                            'decidir_proposta'))
  || '|' || (select count(*) from pg_indexes
             where schemaname = 'curadoria' and indexname = 'derivation_proposals_uma_por_alvo_profissional');`);
    expect(saida).toBe(
      "contar_propostas_por_desfecho,decidir_proposta,emitir_proposta_de_estado,emitir_proposta_de_importancia,ler_proposta_para_proveniencia|1",
    );
  });
});

// ---------------------------------------------------------------------------
// §7 · O emissor profissional — vazio-honesto de verdade
// ---------------------------------------------------------------------------

describe("§7 · emitir_proposta_de_estado — todas as recusas nominais, zero emissão (CD-1)", () => {
  function EMITIR(code: string, perfil = PERFIL): string {
    return `select 'E=' || curadoria.emitir_proposta_de_estado('${perfil}'::uuid, '${code}', '${ADMIN}'::uuid);`;
  }

  it("entrada nula → ENTRADA_INVALIDA; conceito inexistente → CONCEITO_INEXISTENTE", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        `select 'E1=' || curadoria.emitir_proposta_de_estado(null, 'FORMACAO_GRADUACAO', '${ADMIN}'::uuid);` +
        `select 'E2=' || curadoria.emitir_proposta_de_estado('${PERFIL}'::uuid, 'NAO_EXISTE', '${ADMIN}'::uuid);`,
    );
    expect(saida).toContain("E1=ENTRADA_INVALIDA");
    expect(saida).toContain("E2=CONCEITO_INEXISTENTE");
  });

  it("conceito humano e conceito NUNCA → CONCEITO_SEM_PONTE (o validador do Catálogo)", () => {
    const saida = emTransacaoRevertida(
      FIXTURE + EMITIR("FORMACAO_GRADUACAO") + `select 'SEP';` + EMITIR("MODELO_PREFERENCIAS_E_RESTRICOES"),
    );
    // FORMACAO_GRADUACAO é humano (cruzamento) — fora da derivação (1.A).
    expect(saida.match(/E=CONCEITO_SEM_PONTE/g)).toHaveLength(2);
  });

  it("automático sem evidência → SEM_EVIDENCIA; com evidência → SEM_REGRA_VIGENTE — o vazio-honesto", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        EMITIR("CONTINUIDADE_CANAIS") +
        `
insert into curadoria.practice_evidence
  (professional_profile_id, subcriterion_code, version, options, source_tier, source, collected_at, collected_by, status)
values ('${PERFIL}', 'CONTINUIDADE_CANAIS', 1, (select array[o.value] from curadoria.method_subcriterion_options o where o.subcriterion_code='CONTINUIDADE_CANAIS' and o.side='profissional' and o.field='principal' and o.active order by o.display_order limit 1), 'INSTITUCIONAL', 'entrevista', now(), '${ADMIN}', 'nao_verificado');` +
        EMITIR("CONTINUIDADE_CANAIS") +
        `select 'PROPOSTAS=' || count(*) from curadoria.derivation_proposals where professional_profile_id is not null;`,
    );
    expect(saida).toContain("E=SEM_EVIDENCIA");
    expect(saida).toContain("E=SEM_REGRA_VIGENTE");
    // ZERO propostas: nenhuma regra material existe, nenhuma foi semeada.
    expect(saida).toContain("PROPOSTAS=0");
  });

  it("declaração manual no Mapa PREVALECE → DECLARACAO_MANUAL_VIGENTE", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        `
insert into curadoria.professional_subcriterion_map (professional_profile_id, subcriterion_id, status)
select '${PERFIL}', s.id, 'CONFIRMADO' from curadoria.method_subcriteria s where s.code = 'MODELO_COMUNICACAO';` +
        EMITIR("MODELO_COMUNICACAO"),
    );
    expect(saida).toContain("E=DECLARACAO_MANUAL_VIGENTE");
  });
});

// ---------------------------------------------------------------------------
// A decisora estendida — gate, efeito atômico, desfechos PA-12
// ---------------------------------------------------------------------------

describe("§8/§11 · a decisora no alvo profissional — o gate certo e o efeito atômico", () => {
  it("sem sessão, paciente e CURADOR → SEM_AUTORIDADE (G-2.C-11: Curador não confirma o Mapa do Profissional)", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        PROPOSTA_PROFISSIONAL +
        COMO(null) +
        DECIDIR("CONFIRMACAO", null, "D1") +
        COMO(PACIENTE) +
        DECIDIR("CONFIRMACAO", null, "D2") +
        COMO(CURADOR) +
        DECIDIR("CONFIRMACAO", null, "D3") +
        RAIO_X,
    );
    expect(saida).toContain("D1=SEM_AUTORIDADE");
    expect(saida).toContain("D2=SEM_AUTORIDADE");
    expect(saida).toContain("D3=SEM_AUTORIDADE");
    expect(saida).toContain("RAIO=PROPOSTA/atos:0/mapa:<lacuna>");
  });

  it("ADMIN confirma → ATO_REGISTRADO: ato + CONFIRMADA + Mapa com status E evidence_id, ATOMICAMENTE", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        PROPOSTA_PROFISSIONAL +
        COMO(ADMIN) +
        DECIDIR("CONFIRMACAO") +
        RAIO_X +
        `
select 'AUTORIA=' || (select (m.declared_by = '${ADMIN}')::text
  from curadoria.professional_subcriterion_map m
  join curadoria.method_subcriteria s on s.id = m.subcriterion_id
  where m.professional_profile_id = '${PERFIL}' and s.code = 'MODELO_COMUNICACAO');`,
    );
    expect(saida).toContain("D=ATO_REGISTRADO");
    // O par atômico do 1.8-R1 §7.2: status + o vínculo da evidência EXATA.
    expect(saida).toContain(`RAIO=CONFIRMADA/atos:1/mapa:CONFIRMADO+${EV_FORMACAO}`);
    expect(saida).toContain("AUTORIA=true");
  });

  it("ADMIN recusa → lacuna no Mapa, nunca valor — e o painel 1.11 conta o desfecho", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        PROPOSTA_PROFISSIONAL +
        COMO(ADMIN) +
        DECIDIR("RECUSA", "evidencia fraca") +
        RAIO_X +
        `select 'PAINEL=' || coalesce((select contagem::text from curadoria.contar_propostas_por_desfecho() where state = 'RECUSADA' and subcriterion_code = 'MODELO_COMUNICACAO'), '0');`,
    );
    expect(saida).toContain("D=ATO_REGISTRADO");
    expect(saida).toContain("RAIO=RECUSADA/atos:1/mapa:<lacuna>");
    expect(saida).toContain("PAINEL=1");
  });

  it("PA-12 integral: retry idempotente do MESMO ator/intenção; consumado para o resto", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        PROPOSTA_PROFISSIONAL +
        COMO(ADMIN) +
        DECIDIR("CONFIRMACAO", null, "D1") +
        DECIDIR("CONFIRMACAO", null, "D2") +
        DECIDIR("RECUSA", null, "D3") +
        COMO(OUTRO_ADMIN) +
        DECIDIR("CONFIRMACAO", null, "D4") +
        RAIO_X,
    );
    expect(saida).toContain("D1=ATO_REGISTRADO");
    expect(saida).toContain("D2=ATO_JA_REGISTRADO");
    expect(saida).toContain("D3=ATO_JA_CONSUMADO");
    expect(saida).toContain("D4=ATO_JA_CONSUMADO");
    expect(saida).toContain("RAIO=CONFIRMADA/atos:1");
  });

  it("condição 6 profissional: evidência NOVA (S1) torna a proposta não-decidível — para os dois atos", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        PROPOSTA_PROFISSIONAL +
        `
insert into curadoria.practice_evidence
  (professional_profile_id, subcriterion_code, version, options, source_tier, source, collected_at, collected_by, status)
values ('${PERFIL}', 'MODELO_COMUNICACAO', 2, '{ADAPTA_A_LINGUAGEM_AO_INTERLOCUTOR}', 'INSTITUCIONAL', 'entrevista nova', now(), '${ADMIN}', 'nao_verificado');` +
        COMO(ADMIN) +
        DECIDIR("CONFIRMACAO", null, "D1") +
        DECIDIR("RECUSA", null, "D2") +
        RAIO_X,
    );
    expect(saida).toContain("D1=PROPOSTA_NAO_DECIDIVEL");
    expect(saida).toContain("D2=PROPOSTA_NAO_DECIDIVEL");
    expect(saida).toContain("RAIO=PROPOSTA/atos:0/mapa:<lacuna>");
  });

  it("declaração manual nascida após a emissão PREVALECE → PROPOSTA_NAO_DECIDIVEL", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        PROPOSTA_PROFISSIONAL +
        `
insert into curadoria.professional_subcriterion_map (professional_profile_id, subcriterion_id, status)
select '${PERFIL}', s.id, 'NAO_CONFIRMADO' from curadoria.method_subcriteria s where s.code = 'MODELO_COMUNICACAO';` +
        COMO(ADMIN) +
        DECIDIR("CONFIRMACAO") +
        `
select 'MAPA=' || m.status::text from curadoria.professional_subcriterion_map m
join curadoria.method_subcriteria s on s.id = m.subcriterion_id
where m.professional_profile_id = '${PERFIL}' and s.code = 'MODELO_COMUNICACAO';`,
    );
    expect(saida).toContain("D=PROPOSTA_NAO_DECIDIVEL");
    expect(saida).toContain("MAPA=NAO_CONFIRMADO");
  });

  it("§13.2 executável (G-2.C-11): o admin que JULGOU este profissional não confirma o estado dele", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        PROPOSTA_PROFISSIONAL +
        `
insert into curadoria.curator_judgments
  (case_id, professional_profile_id, subcriterion_code, natureza, conclusao, fatos_visiveis, catalog_version, versao, versao_anterior_id, actor_id)
values ('${CASE_ID}', '${PERFIL}', 'FORMACAO', 'TECNICO', 'Julguei este profissional.', '[]', '1.1.0', 1, null, '${ADMIN}');` +
        COMO(ADMIN) +
        DECIDIR("CONFIRMACAO", null, "D1") +
        COMO(OUTRO_ADMIN) +
        DECIDIR("CONFIRMACAO", null, "D2") +
        RAIO_X,
    );
    // Quem julga não atesta a própria leitura; outro admin decide normalmente.
    expect(saida).toContain("D1=SEM_AUTORIDADE");
    expect(saida).toContain("D2=ATO_REGISTRADO");
    expect(saida).toContain("RAIO=CONFIRMADA/atos:1");
  });

  it("atomicidade: valor fora do enum derruba TUDO — nem ato, nem projeção, nem Mapa", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        PROPOSTA_PROFISSIONAL.replace("'CONFIRMADO'", "'VALOR_IMPOSSIVEL'") +
        COMO(ADMIN) +
        `
do $tenta$
begin
  perform curadoria.decidir_proposta('${PROPOSTA}'::uuid, 'CONFIRMACAO', null);
  perform set_config('t.out', 'PASSOU', true);
exception when others then
  perform set_config('t.out', 'SQLSTATE:' || sqlstate, true);
end $tenta$;
select 'ATOMICO=' || current_setting('t.out', true);` +
        RAIO_X,
    );
    expect(saida).toContain("ATOMICO=SQLSTATE:22P02");
    expect(saida).toContain("RAIO=PROPOSTA/atos:0/mapa:<lacuna>");
  });

  it("A2d: decurso, navegação e fim de sessão NÃO decidem — o desfecho fica PROPOSTA e o Mapa intacto", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        PROPOSTA_PROFISSIONAL +
        // decurso de tempo: nada roda; navegação: nenhuma chamada acontece;
        // fim de sessão: o claim é limpo. Três não-atos, zero efeito.
        COMO(ADMIN) +
        COMO(null) +
        RAIO_X,
    );
    expect(saida).toContain("RAIO=PROPOSTA/atos:0/mapa:<lacuna>");
  });

  it("concorrência de corrida real: o ato gravado por fora faz a capability responder JA_CONSUMADO", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        PROPOSTA_PROFISSIONAL +
        `
insert into curadoria.derivation_proposal_acts (proposal_id, natureza, actor_id, atestado_origem_vigente)
values ('${PROPOSTA}', 'RECUSA', '${OUTRO_ADMIN}', true);` +
        COMO(ADMIN) +
        DECIDIR("CONFIRMACAO") +
        RAIO_X,
    );
    expect(saida).toContain("D=ATO_JA_CONSUMADO");
    expect(saida).toContain("RAIO=RECUSADA/atos:1/mapa:<lacuna>");
  });
});

// ---------------------------------------------------------------------------
// O lado Case e as higienes
// ---------------------------------------------------------------------------

describe("§8 · o lado Case permanece VAZIO por construção (R-1/CD-1)", () => {
  it("o emissor Case segue sem regra vigente — nenhuma proposta Case-side nasce", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        `
insert into curadoria.case_needs (case_id, subcriterion_code, options, degree, origin, declared_by)
values ('${CASE_ID}', 'MODELO_COMUNICACAO', '{explicacao_simples}', 'ESSENCIAL', 'DIRETO', '${PACIENTE}');
update curadoria.case_needs set catalog_version = '1.1.0' where case_id = '${CASE_ID}';
select 'E=' || curadoria.emitir_proposta_de_importancia('${CASE_ID}'::uuid, 'MODELO_COMUNICACAO', '${CURADOR}'::uuid);
select 'CASE_SIDE=' || count(*) from curadoria.derivation_proposals where case_id is not null;`,
    );
    expect(saida).toContain("E=SEM_REGRA_VIGENTE");
    expect(saida).toContain("CASE_SIDE=0");
  });

  it("G-2.C-9 · zero semeadura material: nenhuma regra, nenhuma correspondência no banco", () => {
    const saida = psql(`
select (select count(*) from curadoria.derivation_rules)
  || '|' || (select count(*) from curadoria.derivation_rule_degree_map);`);
    expect(saida).toBe("0|0");
  });

  it("G-2.C-6 · a decisora LÊ curator_judgments (§13.2) e JAMAIS escreve — prova no fonte vivo", () => {
    const corpo = psql(
      `select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'curadoria' and p.proname = 'decidir_proposta';`,
    );
    expect(corpo).toContain("curator_judgments");
    const trecho = corpo.slice(corpo.indexOf("curator_judgments") - 200, corpo.indexOf("curator_judgments") + 200);
    expect(/insert\s+into\s+curadoria\.curator_judgments|update\s+curadoria\.curator_judgments/i.test(corpo)).toBe(
      false,
    );
    expect(trecho).toContain("exists");
  });
});
