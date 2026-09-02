import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * TRACK C · T-C-2, T-C-3 e T-C-4 — o contato oficial, medido na fonte.
 *
 * T-C-2 é a guarda que importa: a mensagem pré-preenchida é o único lugar por
 * onde dado da paciente poderia vazar para fora da Aliviar. Ela diz o
 * ASSUNTO, nunca o conteúdo (contrato 30 §7).
 *
 * T-C-10 (alcançabilidade) vive em `track-c-alcancabilidade.test.ts`: ele só
 * pode ficar verde depois das inserções, e cada commit fecha verde.
 */

const RAIZ = path.resolve(__dirname, "../..");
const SRC = path.join(RAIZ, "src");
const FONTE_UNICA = path.join(SRC, "components/curadoria/whatsapp-contact.tsx");
const CONCIERGE = path.join(SRC, "components/paciente/concierge-link.tsx");

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((entrada) => {
    const completo = path.join(dir, entrada);
    if (statSync(completo).isDirectory()) return arquivos(completo);
    return /\.tsx?$/.test(entrada) ? [completo] : [];
  });
}

function relativo(arquivo: string): string {
  return path.relative(RAIZ, arquivo).split(path.sep).join("/");
}

const fonte = readFileSync(FONTE_UNICA, "utf8");

/** Todas as mensagens do mapa, extraídas da fonte — nunca uma amostra. */
function mensagens(): string[] {
  return [...fonte.matchAll(/message:\s*"([^"]*)"/g)].map((m) => m[1]!);
}

/**
 * O conjunto FECHADO de mensagens aprovadas (contrato 30 §6).
 *
 * Esta é a guarda que a varredura por vocabulário não dá: acrescentar
 * "Sou a Maria Silva" a uma mensagem não casa com termo proibido nenhum, e
 * passaria batido — foi exatamente o que a mutação M-C3 mostrou. Nome próprio
 * não tem lista. O que tem é o conjunto: as mensagens são CONSTANTES, e
 * qualquer desvio — palavra a mais, tópico novo sem aprovação, interpolação —
 * muda o conjunto e derruba este teste.
 */
const MENSAGENS_APROVADAS = [
  "Oi! Tenho uma dúvida sobre a minha Curadoria.",
  "Oi! Gostaria de ajuda com a minha jornada na Aliviar.",
  "Oi! Gostaria de conversar sobre a minha Curadoria.",
  "Oi! Quero enviar um documento para a minha Curadoria.",
  "Oi! Gostaria de falar com meu Curador.",
];

describe("T-C-2 · a mensagem diz o assunto, nunca o conteúdo", () => {
  it("o mapa tem mensagens, e o parser não quebrou", () => {
    // Sem esta sanidade, um regex quebrado faria a guarda passar em falso.
    expect(mensagens().length, "nenhuma mensagem encontrada — o parser quebrou").toBeGreaterThanOrEqual(5);
  });

  it("o conjunto de mensagens é EXATAMENTE o aprovado — nada entra sem decisão", () => {
    expect(
      [...mensagens()].sort(),
      "alguma mensagem mudou, nasceu ou ganhou conteúdo. Se for deliberado, " +
        "a lista aprovada muda AQUI, e isso é um ato explícito — nunca um efeito colateral",
    ).toEqual([...MENSAGENS_APROVADAS].sort());
  });

  it("nenhuma mensagem carrega dado clínico, identificador ou nome", () => {
    const proibido = [
      // dado clínico
      "diagnóstic", "diagnostic", "sintoma", "condição", "laudo", "exame",
      "cid", "medicament", "tratamento", "consulta marcada",
      // pessoas e instituições
      "dr.", "dra.", "especialista", "hospital", "clínica", "profissional",
      // identificadores
      "caso", "case", "id ", "uuid", "protocolo", "selec", "perfil",
    ];

    for (const mensagem of mensagens()) {
      const normalizada = mensagem.toLowerCase();
      for (const termo of proibido) {
        expect(
          normalizada,
          `a mensagem "${mensagem}" carrega vocabulário proibido: ${termo}`,
        ).not.toContain(termo);
      }
    }
  });

  it("nenhuma mensagem é template — não há interpolação possível", () => {
    for (const mensagem of mensagens()) {
      expect(mensagem, "mensagem com interpolação vira porta para dado da paciente").not.toContain(
        "${",
      );
    }
    // E o mapa inteiro é declarado com literais: nenhuma crase no CÓDIGO do
    // bloco TOPICS. Comentários citam nomes entre crases e não são código.
    const bloco = fonte
      .slice(fonte.indexOf("const TOPICS"), fonte.indexOf("export function whatsappHref"))
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/[^\n]*/g, "");
    expect(bloco, "TOPICS não pode conter template literal").not.toContain("`");
  });

  it("a mensagem congelada da B3 permanece palavra por palavra", () => {
    expect(
      mensagens(),
      "`duvida` está no ar e em EV-B3-003/004/005 — mudá-la invalida evidência aprovada",
    ).toContain("Oi! Tenho uma dúvida sobre a minha Curadoria.");
  });
});

describe("T-C-3 · não existe caminho para texto livre", () => {
  it("whatsappHref aceita somente WhatsappTopic", () => {
    const assinatura = fonte.match(/export function whatsappHref\(([^)]*)\)/)?.[1] ?? "";
    expect(assinatura.trim()).toBe("topic: WhatsappTopic");
  });

  it("o corpo lê a mensagem do mapa — nunca de um argumento", () => {
    const corpo = fonte.slice(
      fonte.indexOf("export function whatsappHref"),
      fonte.indexOf("export function WhatsappContact"),
    );
    expect(corpo).toContain("TOPICS[topic].message");
    for (const termo of ["message:", "text:", "mensagem"]) {
      expect(corpo, `parâmetro de texto livre em whatsappHref: ${termo}`).not.toContain(termo);
    }
  });

  it("ConciergeLink não expõe prop de mensagem nem de telefone", () => {
    const componente = readFileSync(CONCIERGE, "utf8");
    // Só as declarações: comentários explicam o contrato e citariam os próprios
    // termos proibidos.
    const props = componente
      .slice(componente.indexOf("}: {"), componente.indexOf("}) {"))
      .replace(/\/\*[\s\S]*?\*\//g, "");
    for (const termo of ["message", "mensagem", "texto", "phone", "telefone", "numero", "href"]) {
      expect(props, `prop proibida em ConciergeLink: ${termo}`).not.toContain(termo);
    }
    expect(props, "o tópico precisa ser tipado pelo union oficial").toContain(
      "topic: WhatsappTopic",
    );
  });
});

describe("T-C-4 · o número tem fonte única", () => {
  /**
   * A guarda LÊ o número da constante, em vez de repeti-lo.
   *
   * Até 01/09 ela fixava `"5511979037133"` no próprio teste — o que fazia dela
   * **a segunda fonte** daquilo que ela existe para manter único. Trocar o
   * número (ADR-111) obrigava a editar os dois, e esquecer um quebraria a
   * suíte por um motivo que não era o defeito. Agora o valor vem de
   * `whatsapp-contact.tsx`, e a asserção continua sendo a mesma: **este literal
   * não pode aparecer em mais nenhum arquivo de `src/`.**
   */
  it("o literal aparece uma única vez em src/, e é a constante oficial", () => {
    const declarado = fonte.match(/export const ALIVIAR_WHATSAPP = "(\d+)"/)?.[1];
    expect(declarado, "a constante oficial sumiu ou mudou de forma").toMatch(/^55\d{10,11}$/);

    const comNumero = arquivos(SRC).filter((arquivo) =>
      readFileSync(arquivo, "utf8").includes(declarado!),
    );
    expect(
      comNumero.map(relativo),
      "duplicar o número quebra a fonte única — importe ALIVIAR_WHATSAPP",
    ).toEqual(["src/components/curadoria/whatsapp-contact.tsx"]);

    // E o formato de exibição precisa ser o MESMO número, só vestido.
    const exibido = fonte.match(/export const ALIVIAR_WHATSAPP_DISPLAY = "([^"]+)"/)?.[1];
    expect(
      exibido?.replace(/\D/g, ""),
      "o número exibido não é o mesmo que o do link — alguém trocou um e esqueceu o outro",
    ).toBe(declarado!.slice(2));
  });
});
