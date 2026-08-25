/**
 * QUEM AVALIA NÃO ATESTA — a ADR-060 na Base de Evidências.
 *
 * @metodo ADR-060 — segregação de funções: quem avalia não atesta
 * @metodo ADR-068 item 6 — quem confirma o Mapa não julga no mesmo Case
 * @metodo GRAMATICA_DAS_PERGUNTAS §6 — estado da informação ≠ correspondência
 *
 * A Base de Evidências entrou na Mesa nova (ADR-093, painel 2) por LIGAÇÃO: o
 * painel é o mesmo da Mesa antiga, e a rota só decide quem pode o quê. É
 * justamente essa decisão que um dia se escreve errado — `can={{verify: true}}`
 * é um caractere de distância, e nada no produto reclamaria.
 *
 * A separação não é burocracia. Assinar que uma informação foi conferida
 * contra fonte é o que dá a ela poder de ELIMINAR alguém de uma Curadoria
 * (ADR-088): só fato verificado elimina. Se o mesmo Curador que vai julgar
 * pudesse assinar a verificação, ele estaria produzindo a prova que a própria
 * conclusão dele usa — e a paciente nunca fica sabendo do caminho suprimido.
 *
 * O que o Curador PODE, e precisa poder: apontar que as fontes discordam e
 * pedir atualização. São atos de quem investiga, não de quem atesta.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import {
  MesaEvidenciasPanel,
  type EvidencePanelCan,
} from "@/components/curadoria/mesa-evidencias-panel";
import type { PracticeEvidenceRecord } from "@/modules/curadoria/evidencias-pratica-repository";

afterEach(cleanup);

const HELENA = { professionalProfileId: "helena", displayName: "Dra. Helena Vasconcelos" };

// Uma evidência DECLARADA e não verificada — é exatamente o estado em que a
// pergunta "quem assina a verificação?" existe.
const DECLARADA: PracticeEvidenceRecord = {
  id: "ev-1",
  professionalProfileId: "helena",
  subcriterionCode: "CONTINUIDADE_RETORNOS",
  catalogVersion: "1.0",
  version: 1,
  options: ["RETORNO_INCLUSO"],
  details: {},
  conditionNote: null,
  observation: null,
  // A fonte é o site da própria profissional: institucional, e por isso mesmo
  // ainda não verificada — é o estado em que a pergunta "quem assina?" existe.
  sourceTier: "INSTITUCIONAL",
  source: "Site da profissional, Protocolo da Prática respondido por ela",
  collectedAt: "2026-08-20T10:00:00.000Z",
  collectedBy: "00000000-0000-0000-0000-000000000001",
  status: "nao_verificado",
  verifiedAt: null,
  verifiedBy: null,
  verificationSource: null,
};

/** O que a Mesa nova entrega a cada papel — a mesma decisão que a rota toma. */
const DO_CURADOR: EvidencePanelCan = {
  verify: false,
  resolveDivergence: false,
  markOutdated: false,
  openDivergence: true,
  requestUpdate: true,
};

const DO_ADMINISTRADOR: EvidencePanelCan = {
  verify: true,
  resolveDivergence: true,
  markOutdated: true,
  openDivergence: true,
  requestUpdate: true,
};

async function abrirODetalhe(can: EvidencePanelCan) {
  const usuario = userEvent.setup();

  render(
    <MesaEvidenciasPanel
      caseId="f347924a-133f-4370-81d3-70f0beea16f4"
      professionals={[HELENA]}
      rows={{ helena: [DECLARADA] }}
      divergences={[]}
      updateRequests={[]}
      can={can}
      nowIso="2026-08-25T12:00:00.000Z"
    />,
  );

  // Abertura progressiva: resumo → conceitos → detalhe. As ações só existem
  // no terceiro nível, e é lá que a segregação precisa valer.
  await usuario.click(screen.getByRole("button", { name: /Ver por conceito/i }));
  await usuario.click(screen.getByRole("button", { name: /Abrir detalhe/i }));
}

/**
 * Cada ato é identificado pela legenda do próprio bloco — é ela que o NOMEIA
 * na tela. Os botões dizem "Confirmar" e "Registrar pendência", que sozinhos
 * não distinguem ato nenhum.
 */
const ATESTAR = [/Verificar esta versão/i, /Marcar como desatualizada/i, /Resolver divergência/i];
const INVESTIGAR = [/Registrar divergência/i, /Solicitar atualização ao profissional/i];

describe("A Base de Evidências na Mesa nova respeita a ADR-060", () => {
  it("o Curador não recebe nenhum ato de atestação", async () => {
    await abrirODetalhe(DO_CURADOR);

    for (const ato of ATESTAR) {
      expect(screen.queryByText(ato), `o Curador recebeu um ato de atestação: ${ato}`).toBeNull();
    }
    expect(screen.queryByRole("button", { name: /Assinar verificação/i })).toBeNull();

    // No MESMO teste, a prova de que a tela renderizou de verdade. Sem isto,
    // um painel quebrado — que não oferece ato nenhum a ninguém — passaria
    // como se a segregação estivesse sendo cumprida.
    for (const ato of INVESTIGAR) {
      expect(screen.getByText(ato), `o detalhe não renderizou: ${ato} sumiu`).toBeTruthy();
    }
  });

  it("o Curador recebe os atos de quem investiga — apontar que discordam, e pedir", async () => {
    await abrirODetalhe(DO_CURADOR);

    expect(screen.getByRole("button", { name: /Abrir divergência/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Registrar pendência/i })).toBeTruthy();
  });

  // O contraste é o que dá sentido aos dois acima: a separação é de PAPEL, e
  // não uma tela que simplesmente não tem a função.
  it("o Administrador recebe a atestação, na mesma tela", async () => {
    await abrirODetalhe(DO_ADMINISTRADOR);

    expect(screen.getByText(/Verificar esta versão/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Assinar verificação/i })).toBeTruthy();
    expect(screen.getByText(/Marcar como desatualizada/i)).toBeTruthy();
  });

  /**
   * A OUTRA METADE, e ela é a que importa.
   *
   * Os três testes acima provam o CONTRATO do painel: dado um `can`, isto é o
   * que aparece. Não provam que a ROTA entrega o `can` certo — e é na rota que
   * o erro moraria, porque é lá que alguém escreve `verify: true` para
   * "destravar" alguma coisa num dia apertado.
   *
   * Esta guarda é de código-fonte porque o risco é de escrita, não de
   * comportamento: um `can` errado se comporta perfeitamente. A rota é um
   * Server Component com autenticação; renderizá-la aqui custaria um arnês
   * maior do que o que ele protegeria.
   */
  it("a rota da Mesa nova amarra a atestação ao papel, nunca a `true`", () => {
    const fonte = readFileSync(
      path.join(process.cwd(), "src/app/portal-curador/casos/[id]/mesa/page.tsx"),
      "utf8",
    );

    const bloco = fonte.match(/can=\{\{[\s\S]*?\}\}/)?.[0];
    expect(bloco, "a Mesa nova deixou de declarar quem pode o quê na Base de Evidências").toBeTruthy();

    const semComentarios = bloco!.replace(/^\s*\/\/.*$/gm, "");

    for (const ato of ["verify", "resolveDivergence", "markOutdated"]) {
      expect(
        semComentarios,
        `${ato} deixou de depender do papel — a ADR-060 exige que quem avalia não atesta`,
      ).toMatch(new RegExp(`${ato}:\\s*ehAdministrador`));
    }
  });
});
