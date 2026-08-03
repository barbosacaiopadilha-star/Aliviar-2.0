/**
 * GERADOR DO CATÁLOGO EXECUTÁVEL — banco → TypeScript, nunca o contrário.
 *
 * SEM SHEBANG, de propósito (NC-24): este arquivo é IMPORTADO pelo gate de
 * paridade (montarCarga/hashDaCarga) — módulo importável não tem shebang;
 * quem executa é `node scripts/gerar-catalogo-ts.mjs` via wrapper.
 *
 * Por que existe (BLOCO E / FRENTE 1): a auditoria encontrou QUATRO fontes da
 * verdade para o Catálogo Canônico 1.0.0 — a tabela `curadoria.
 * method_subcriteria` (o APROVADO pela ADR-046, autoritativo pela ADR-047) e
 * três arrays TypeScript mantidos à mão que já haviam divergido dela em 16
 * pontos (AUDITORIA_01 §3.1 D1–D16; AUDITORIA_03 §9). Este script elimina as
 * listas manuais: lê o catálogo VIVO do banco LOCAL (method_subcriteria +
 * method_subcriterion_options) e emite `src/modules/curadoria/
 * catalogo-gerado.ts`, com marca DO-NOT-EDIT e hash do conteúdo.
 *
 * Os módulos de domínio (mapa-prioridades, evidencias-pratica, protocolos)
 * importam DO GERADO por adapters finos; o teste de paridade
 * (`tests/remediacao/paridade-catalogo.integration.test.ts`) compara o gerado
 * com o banco vivo e falha NOMEANDO conceito/campo/esperado/encontrado.
 *
 * Ordem canônica emitida (única regra que não mora no banco, porque o banco
 * não tem ordem de eixo — AUDITORIA_03 §9 "não existe ordem canônica do eixo
 * no banco"; o UNIQUE é por grupo):
 *   1. eixo, na sequência declarada pela migration 20260802100000 e pelo doc
 *      (ACESSO_AO_CUIDADO → CONTINUIDADE → MODELO → PRÁTICA → VIABILIDADE);
 *   2. dentro do eixo, grupo na ordem FORMACAO → EXPERIENCIA → HISTORICO
 *      (só relevante em PRATICA_E_TRAJETORIA — Parte D do Protocolo);
 *   3. dentro do grupo, `display_order` do banco; empate por código.
 * Inativos (legado 0.9.0) vêm depois, por código — permanecem legíveis, nunca
 * somem (leitura histórica; gravação nova é só do vigente).
 *
 * Uso:
 *   node scripts/with-local-supabase.mjs node scripts/gerar-catalogo-ts.mjs
 */

import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

import { AmbienteBloqueadoError, resolverAlvoLocal } from "./env-guard.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DESTINO = resolve(projectRoot, "src/modules/curadoria/catalogo-gerado.ts");

export const EIXO_ORDEM = [
  "ACESSO_AO_CUIDADO",
  "CONTINUIDADE_DO_CUIDADO",
  "MODELO_DE_ATENDIMENTO",
  "PRATICA_E_TRAJETORIA",
  "VIABILIDADE_DE_ACESSO",
];

export const GRUPO_ORDEM = [
  "FORMACAO",
  "EXPERIENCIA",
  "HISTORICO",
  "ACESSO",
  "CONTINUIDADE_DO_CUIDADO",
  "MODELO_DE_ATENDIMENTO",
  "VIABILIDADE",
];

/** Ordena conceitos pela regra canônica documentada no cabeçalho. */
export function ordenarConceitos(linhas) {
  const ativos = linhas.filter((l) => l.active);
  const inativos = linhas.filter((l) => !l.active);
  ativos.sort((a, b) => {
    const eixo = EIXO_ORDEM.indexOf(a.axis) - EIXO_ORDEM.indexOf(b.axis);
    if (eixo !== 0) return eixo;
    const grupo = GRUPO_ORDEM.indexOf(a.group) - GRUPO_ORDEM.indexOf(b.group);
    if (grupo !== 0) return grupo;
    if (a.display_order !== b.display_order) return a.display_order - b.display_order;
    return a.code < b.code ? -1 : 1;
  });
  inativos.sort((a, b) => (a.code < b.code ? -1 : 1));
  return [...ativos, ...inativos];
}

/** Monta a carga determinística (a mesma que o teste de paridade recomputa). */
export function montarCarga(conceitos, opcoes) {
  const porConceito = new Map();
  for (const linha of ordenarConceitos(conceitos)) {
    porConceito.set(linha.code, {
      code: linha.code,
      group: linha.group,
      axis: linha.axis ?? null,
      name: linha.name,
      description: linha.description,
      displayOrder: linha.display_order,
      active: linha.active,
      catalogVersion: linha.catalog_version,
      professionalQuestion: linha.professional_question ?? null,
      patientQuestion: linha.patient_question ?? null,
      responseType: linha.response_type ?? null,
      cruzamento: linha.cruzamento ?? null,
      required: linha.required ?? false,
      conditionalRules: linha.conditional_rules ?? [],
      evidenceSource: linha.evidence_source ?? null,
      reviewMonths: linha.review_months ?? null,
      profissional: [],
      paciente: [],
    });
  }

  const opcoesOrdenadas = [...opcoes].sort((a, b) => {
    if (a.subcriterion_code !== b.subcriterion_code)
      return a.subcriterion_code < b.subcriterion_code ? -1 : 1;
    if (a.side !== b.side) return a.side < b.side ? -1 : 1;
    if (a.field !== b.field) return a.field < b.field ? -1 : 1;
    if (a.display_order !== b.display_order) return a.display_order - b.display_order;
    return a.value < b.value ? -1 : 1;
  });

  for (const opcao of opcoesOrdenadas) {
    const conceito = porConceito.get(opcao.subcriterion_code);
    if (!conceito) {
      throw new Error(
        `Opção órfã no banco: ${opcao.subcriterion_code}/${opcao.side}/${opcao.field}/${opcao.value} não aponta para conceito nenhum.`,
      );
    }
    const lado = opcao.side === "profissional" ? conceito.profissional : conceito.paciente;
    let campo = lado.find((c) => c.field === opcao.field);
    if (!campo) {
      campo = { field: opcao.field, options: [] };
      lado.push(campo);
    }
    campo.options.push({
      value: opcao.value,
      label: opcao.label,
      requiresDetail: opcao.requires_detail,
      detailKind: opcao.detail_kind ?? null,
      displayOrder: opcao.display_order,
      active: opcao.active,
      catalogVersion: opcao.catalog_version,
      // ADR-065: correspondência da leitura relacional — só no lado da
      // pessoa de conceitos automáticos; null em todo o resto.
      satisfiedBy: opcao.satisfied_by ?? null,
    });
  }

  return [...porConceito.values()];
}

export function hashDaCarga(carga) {
  return createHash("sha256").update(JSON.stringify(carga)).digest("hex");
}

async function main() {
  let alvo;
  try {
    alvo = resolverAlvoLocal("Gerar catálogo TS a partir do banco local", { cwd: projectRoot });
  } catch (erro) {
    if (erro instanceof AmbienteBloqueadoError) {
      console.error(erro.message);
      process.exit(1);
    }
    throw erro;
  }

  const chave = alvo.SUPABASE_SERVICE_ROLE_KEY || alvo.SUPABASE_ANON_KEY;
  if (!chave) {
    throw new Error("Sem chave de acesso ao Supabase local (service role ou anon).");
  }
  const client = createClient(alvo.SUPABASE_URL, chave, {
    db: { schema: "curadoria" },
  });

  const { data: conceitos, error: erroConceitos } = await client
    .from("method_subcriteria")
    .select(
      'code, "group", name, description, display_order, active, axis, catalog_version, professional_question, patient_question, response_type, cruzamento, required, conditional_rules, evidence_source, review_months',
    );
  if (erroConceitos) throw new Error(`method_subcriteria: ${erroConceitos.message}`);

  const { data: opcoes, error: erroOpcoes } = await client
    .from("method_subcriterion_options")
    .select(
      "subcriterion_code, side, field, value, label, requires_detail, detail_kind, display_order, active, catalog_version, satisfied_by",
    );
  if (erroOpcoes) throw new Error(`method_subcriterion_options: ${erroOpcoes.message}`);

  // Provas de fechamento ANTES de emitir — gerar de um banco inconsistente
  // produziria um "canônico" errado com carimbo de autoridade.
  // 29 = os 28 do Catálogo 1.0.0 (ADR-046) + MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS
  // (ADR-065, migration 20260803100000).
  const ativos = conceitos.filter((c) => c.active);
  if (ativos.length !== 29) {
    throw new Error(`Catálogo inconsistente: ${ativos.length} conceitos ativos (esperado 29).`);
  }
  const versoes = new Set(ativos.map((c) => c.catalog_version));
  if (versoes.size !== 1) {
    throw new Error(
      `Conceitos ativos em versões múltiplas: ${[...versoes].join(", ")} — vigência única é pré-condição.`,
    );
  }
  const semEixo = ativos.filter((c) => !c.axis || !EIXO_ORDEM.includes(c.axis));
  if (semEixo.length > 0) {
    throw new Error(`Conceitos ativos sem eixo válido: ${semEixo.map((c) => c.code).join(", ")}.`);
  }

  const carga = montarCarga(conceitos, opcoes);
  const hash = hashDaCarga(carga);
  const versao = [...versoes][0];
  const totalOpcoes = opcoes.length;

  const conteudo = `/**
 * CATÁLOGO CANÔNICO — ARQUIVO GERADO. NÃO EDITE À MÃO (DO-NOT-EDIT).
 *
 * Fonte: curadoria.method_subcriteria + curadoria.method_subcriterion_options
 * do Supabase LOCAL (o estado que as migrations congeladas 20260802100000/
 * 110000 + 20260803100000 produzem — ADR-046 aprova o conteúdo, ADR-047 torna
 * o banco autoritativo, ADR-065 institui a leitura relacional/Catálogo 1.1.0).
 *
 * Para regenerar:
 *   node scripts/with-local-supabase.mjs node scripts/gerar-catalogo-ts.mjs
 *
 * O teste de paridade (tests/remediacao/paridade-catalogo.integration.test.ts)
 * recomputa esta carga do banco vivo e compara com o hash abaixo: qualquer
 * edição manual — aqui ou no banco — falha nomeando conceito e campo.
 */

export type CatalogoConditionalRule = {
  when: { field: string; value?: string; value_not?: string };
  show?: string;
  hide?: string;
  require_detail?: boolean;
};

export type CatalogoOpcao = {
  value: string;
  label: string;
  requiresDetail: boolean;
  detailKind: string | null;
  displayOrder: number;
  active: boolean;
  catalogVersion: string;
  /**
   * ADR-065 (leitura relacional): values do lado profissional que satisfazem
   * esta opção da pessoa, ou ["*"] = qualquer declaração vigente do conceito.
   * null = fora do mecanismo (lado profissional, conceito humano, ou opção
   * fora do cruzamento). Comparação por identidade, nunca por rótulo.
   */
  satisfiedBy: readonly string[] | null;
};

export type CatalogoCampo = {
  field: string;
  options: readonly CatalogoOpcao[];
};

export type CatalogoConceito = {
  code: string;
  group: string;
  axis: string | null;
  name: string;
  description: string;
  displayOrder: number;
  active: boolean;
  catalogVersion: string;
  professionalQuestion: string | null;
  patientQuestion: string | null;
  responseType: string | null;
  cruzamento: string | null;
  required: boolean;
  conditionalRules: readonly CatalogoConditionalRule[];
  evidenceSource: string | null;
  reviewMonths: number | null;
  /** Lado do profissional: campos → opções fechadas, na ordem do banco. */
  profissional: readonly CatalogoCampo[];
  /** Lado da paciente: campos → opções fechadas, na ordem do banco. */
  paciente: readonly CatalogoCampo[];
};

/** Os 5 eixos, na ordem canônica (migration 20260802100000 + doc do Catálogo). */
export const CATALOGO_EIXOS = ${JSON.stringify(EIXO_ORDEM)} as const;

/** Versão vigente única de todos os conceitos ativos. */
export const CATALOGO_VERSAO = ${JSON.stringify(versao)};

/** SHA-256 da carga (conceitos+opções, ordem canônica) — paridade executável. */
export const CATALOGO_GERADO_HASH = ${JSON.stringify(hash)};

/** Total de opções no banco na geração (ativas e inativas). */
export const CATALOGO_TOTAL_OPCOES = ${totalOpcoes};

/**
 * Todos os conceitos: os 29 ativos na ordem canônica, depois o legado 0.9.0
 * inativo (legível para histórico; nunca recebe gravação nova).
 */
export const CATALOGO_GERADO: readonly CatalogoConceito[] = ${JSON.stringify(carga, null, 2)};
`;

  writeFileSync(DESTINO, conteudo, "utf8");
  console.log(
    `catalogo-gerado.ts emitido: ${carga.length} conceitos (${ativos.length} ativos), ${totalOpcoes} opções, versão ${versao}, hash ${hash.slice(0, 12)}…`,
  );
}

// Executável e importável (o teste de paridade importa montarCarga/hashDaCarga
// para recomputar a MESMA carga do banco vivo).
const executadoDiretamente =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (executadoDiretamente) {
  main().catch((erro) => {
    console.error(erro);
    process.exit(1);
  });
}
