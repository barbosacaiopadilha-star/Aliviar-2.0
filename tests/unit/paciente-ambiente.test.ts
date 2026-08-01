import { existsSync } from "node:fs";
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
