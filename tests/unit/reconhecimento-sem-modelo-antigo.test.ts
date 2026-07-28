import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Guardas de regressão da virada — ADR-042.
 *
 * Testam TEXTO de arquivos de propósito: o que precisa ser garantido aqui não
 * é o retorno de uma função, é que o caminho antigo não volte a existir. Um
 * teste de comportamento passaria feliz enquanto alguém reintroduz a soma de
 * 100 pontos por baixo.
 */
function ler(...caminho: string[]): string {
  return readFileSync(join(process.cwd(), ...caminho), "utf8");
}

/**
 * Comentário que EXPLICA a virada cita o vocabulário antigo de propósito —
 * e é isso que se quer preservar. O que não pode voltar é o código.
 */
function semComentarios(fonte: string): string {
  return fonte
    .split("\n")
    .filter((linha) => {
      const limpa = linha.trimStart();
      return !limpa.startsWith("//") && !limpa.startsWith("*") && !limpa.startsWith("/*");
    })
    .join("\n");
}

describe("A via nova de reconhecimento não depende do modelo antigo", () => {
  const acao = ler("src", "modules", "paciente", "reconhecimento-actions.ts");

  it("não toca em priority_weights, cruzamento_weights nem em soma de pontos", () => {
    const codigo = acao.split("\n").filter((linha) => !linha.trimStart().startsWith("*")).join("\n");
    expect(codigo).not.toMatch(/priority_weights|cruzamento_weights|saveAllWeights|canValidate/);
  });

  it("não compara com a string VALIDATED — a tradução do legado é centralizada", () => {
    expect(semComentarios(acao)).not.toMatch(/VALIDATED/);
  });

  it("é a paciente quem executa o ato, não o Curador", () => {
    expect(acao).toContain('requireRoleForAction("paciente")');
    expect(semComentarios(acao)).not.toMatch(/requireCurator|curador_medico/);
  });
});

describe("O caminho antigo não volta a aparecer", () => {
  it("validateProfileAction foi removida, não apenas desativada", () => {
    // Um stub que só recusa continuaria sendo capacidade morta — e o repositório
    // tem um teste (actions-have-callers) que cobra chamador para toda action.
    const actions = ler("src", "modules", "curadoria", "actions.ts");
    expect(semComentarios(actions)).not.toContain("validateProfileAction");
    expect(semComentarios(actions)).not.toContain("validatePriorityProfile");
  });

  it("o PriorityBuilder deixou de ser autoridade do reconhecimento", () => {
    const builder = ler("src", "components", "curadoria", "priority-builder.tsx");
    expect(builder).not.toContain("validateProfileAction");
  });

  it("a paciente encontra a ação na tela dela", () => {
    const painel = ler("src", "components", "paciente", "perfil-panel.tsx");
    expect(painel).toContain("ReconhecerPerfil");
    // A frase que mandava esperar o Curador registrar por ela saiu.
    expect(painel).not.toContain("A confirmação acontece");
  });
});

describe("O gate do banco passou a ser o Mapa", () => {
  const migration = ler(
    "supabase",
    "migrations",
    "20260728030000_reconhecimento_pelo_mapa.sql",
  );

  it("o trigger de validação não soma mais priority_weights", () => {
    const inicio = migration.indexOf("function curadoria.enforce_priority_profile_validation");
    const corpo = migration.slice(inicio, migration.indexOf("$$;", inicio));
    expect(corpo).toContain("priority_map_pending");
    expect(corpo).not.toContain("priority_weights");
    expect(corpo).not.toContain("100");
  });

  it("a paciente lê o próprio Perfil antes de reconhecê-lo", () => {
    // A policy antiga exigia status = VALIDATED para ela enxergar: confirmar
    // às cegas algo que só apareceria depois de confirmado.
    expect(migration).toContain('drop policy if exists "priority_profiles_select_patient_validated"');
    expect(migration).toContain("curadoria.is_patient_for_case(case_id)");
  });

  it("a irreversibilidade da Invariante 28 permanece intacta", () => {
    expect(migration).not.toContain("drop trigger protect_validated");
    expect(migration).not.toMatch(/drop function.*protect_validated_priority_profile/);
  });

  it("nenhuma escrita nova em priority_weights é introduzida", () => {
    expect(migration).not.toMatch(/insert into curadoria\.priority_weights/i);
    expect(migration).not.toMatch(/update curadoria\.priority_weights/i);
  });
});
