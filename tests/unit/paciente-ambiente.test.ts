import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { ambienceFor, heroGreeting, STAGE_AMBIENCES } from "@/modules/paciente/ambiente";
import {
  STAGE_EYEBROWS,
  WALK_LABELS,
  violatesPatientVocabulary,
  walkStatusOf,
} from "@/modules/paciente/experiencia";
import { JORNADA_STAGES } from "@/modules/curadoria/jornada";

describe("Storytelling Ambiental — identidade por etapa", () => {
  it("toda etapa da jornada tem ambiente, e nenhuma ficou de fora", () => {
    for (const stage of JORNADA_STAGES) {
      const ambience = ambienceFor(stage);
      expect(ambience.scene, stage).toBeTruthy();
      expect(ambience.message, stage).toBeTruthy();
      expect(ambience.sceneDescription, stage).toBeTruthy();
    }
    expect(Object.keys(STAGE_AMBIENCES)).toHaveLength(JORNADA_STAGES.length);
  });

  it("as cenas apontam para imagens que existem de fato", () => {
    for (const stage of JORNADA_STAGES) {
      const scene = ambienceFor(stage).scene;
      const file = path.resolve(process.cwd(), "public", scene.replace(/^\//, ""));
      expect(existsSync(file), `cena ausente para ${stage}: ${scene}`).toBe(true);
    }
  });

  it("as mensagens são as do roteiro da experiência, etapa a etapa", () => {
    expect(ambienceFor("CONSULTA_INICIAL").message).toBe("Estamos começando a conhecer sua história.");
    expect(ambienceFor("PERFIL_DE_PRIORIDADES").message).toBe(
      "Estamos entendendo o que é importante para você.",
    );
    expect(ambienceFor("CURADORIA").message).toBe(
      "Seu Curador está analisando cuidadosamente o seu caso.",
    );
    expect(ambienceFor("DOSSIE").message).toBe("Conseguimos organizar tudo para você.");
    expect(ambienceFor("ESCOLHA").message).toBe("Agora vamos conhecer os caminhos encontrados.");
    expect(ambienceFor("ACOMPANHAMENTO").message).toBe(
      "Seguimos ao seu lado durante a próxima etapa da sua jornada.",
    );
  });

  it("a descrição da cena informa a etapa — não é enfeite para leitor de tela", () => {
    // Quem não vê a foto recebe o ambiente em palavras, nunca um nome de arquivo.
    for (const stage of JORNADA_STAGES) {
      const description = ambienceFor(stage).sceneDescription;
      expect(description).not.toMatch(/\.jpg|\.png|scenes\//);
      expect(description.length).toBeGreaterThan(20);
    }
  });

  it("nenhum texto ambiental viola o vocabulário do paciente", () => {
    for (const stage of JORNADA_STAGES) {
      const ambience = ambienceFor(stage);
      expect(violatesPatientVocabulary(ambience.message), stage).toBeNull();
      expect(violatesPatientVocabulary(ambience.sceneDescription), stage).toBeNull();
      expect(violatesPatientVocabulary(STAGE_EYEBROWS[stage]), stage).toBeNull();
    }
  });

  it("a saudação tem uma ideia só: quem chegou e onde a jornada está", () => {
    const greeting = heroGreeting("João", "CURADORIA");
    expect(greeting.title).toBe("Olá, João.");
    expect(greeting.subtitle).toBe("Seu Curador está analisando cuidadosamente o seu caso.");
  });
});

describe("MASTER-0B · nenhum edifício alheio na experiência da paciente", () => {
  /**
   * `grand-finale.jpg` foi classificado materialmente — abrindo o arquivo, não
   * lendo o nome — como NÃO pertencente ao edifício da Aliviar: apartamento
   * vazio genérico, luz fria, armários escuros, piso laminado, radiador,
   * janela europeia. Ele chegou às superfícies da paciente duas vezes: no
   * campo da Home e no hero da etapa DOSSIE.
   *
   * A guarda é por arquivo, não por etapa: uma etapa nova que o adotasse
   * passaria despercebida numa asserção etapa a etapa.
   */
  const ALHEIO = "grand-finale.jpg";

  it("nenhuma etapa da jornada usa o asset de edifício alheio", () => {
    for (const stage of JORNADA_STAGES) {
      expect(ambienceFor(stage).scene, `${stage} voltou a usar o prédio alheio`).not.toContain(
        ALHEIO,
      );
    }
  });

  it("e nenhum arquivo das superfícies da paciente o referencia", () => {
    // Varre o código real. Comentários fora: estes arquivos CITAM o asset para
    // explicar por que ele saiu, e explicação não é uso.
    const alvos = ["src/modules/paciente", "src/components/paciente", "src/app/paciente"];
    const encontrados: string[] = [];

    const varrer = (dir: string) => {
      for (const entrada of readdirSync(dir, { withFileTypes: true })) {
        const caminho = path.join(dir, entrada.name);
        if (entrada.isDirectory()) {
          varrer(caminho);
          continue;
        }
        if (!/\.(ts|tsx|css)$/.test(entrada.name)) continue;
        const codigo = readFileSync(caminho, "utf8")
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/\/\/.*$/gm, "");
        if (codigo.includes(ALHEIO)) encontrados.push(caminho);
      }
    };

    for (const alvo of alvos) varrer(path.resolve(process.cwd(), alvo));
    expect(encontrados, `o prédio alheio voltou a ser usado em: ${encontrados.join(", ")}`).toEqual(
      [],
    );
  });

  it("o fallback aponta para uma imagem que existe e é do conjunto Aliviar", () => {
    const cena = ambienceFor("DOSSIE").scene;
    expect(cena).toBe("/scenes/recepcao.jpg");
    expect(existsSync(path.resolve(process.cwd(), "public", cena.replace(/^\//, "")))).toBe(true);
  });
});

describe("Caminhada — três estados, rótulos curtos", () => {
  it("aguardando você e em andamento são, ambos, a etapa atual do caminho", () => {
    expect(walkStatusOf("CONCLUIDA")).toBe("done");
    expect(walkStatusOf("EM_ANDAMENTO")).toBe("current");
    expect(walkStatusOf("AGUARDANDO_VOCE")).toBe("current");
    expect(walkStatusOf("A_CAMINHO")).toBe("ahead");
  });

  it("toda etapa tem rótulo curto, e ele cabe numa trilha de celular", () => {
    for (const stage of JORNADA_STAGES) {
      const label = WALK_LABELS[stage];
      expect(label, stage).toBeTruthy();
      expect(label.length, `${stage}: "${label}" é longo demais para a trilha`).toBeLessThanOrEqual(15);
    }
  });

  it("toda etapa tem eyebrow dizendo onde a jornada está", () => {
    for (const stage of JORNADA_STAGES) {
      expect(STAGE_EYEBROWS[stage], stage).toBeTruthy();
    }
  });
});
