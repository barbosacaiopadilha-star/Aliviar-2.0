/**
 * A MESA MOSTRA O QUE JÁ FOI FEITO — `SIM-49`, `SIM-52`, `SIM-53`, `SIM-54`.
 *
 * @metodo ADR-093 — a Mesa é o documento dela, sendo escrito
 * @metodo ADR-067 §5 — o juízo é ato de uma pessoa, e fica registrado
 *
 * Os quatro achados são o MESMO defeito em quatro lugares: a Mesa não
 * carregava para dentro dos próprios editores o que já existia no banco.
 *
 * O sintoma variava e a consequência não. A célula pedia o juízo que já fora
 * dado (`53`); o painel de composição abria em branco depois de composto
 * (`49`); o editor do Relatório dizia "falta preencher" sobre um documento que
 * a paciente já estava lendo (`52`); e a recusa da segunda gravação aparecia
 * como `CONFLITO_DE_VERSAO`, o enum cru (`54`).
 *
 * Em todos, a Mesa afirmava sobre si mesma algo que o banco desmentia.
 */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ComparacaoPorPreocupacoes } from "@/components/curadoria/mesa-preocupacoes/comparacao-por-preocupacoes";
import { fraseDoDesfecho } from "@/components/curadoria/mesa-preocupacoes/registrar-juizo-na-celula";
import { EscreverORelatorio } from "@/components/curadoria/mesa-preocupacoes/escrever-o-relatorio";
import {
  montarMesaPorPreocupacoes,
  type ProfissionalNaMesa,
} from "@/modules/curadoria/mesa-por-preocupacoes";
import { SUBCRITERIOS_ATIVOS } from "../apoio/subcriterios-ativos";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

afterEach(cleanup);

const TRES: ProfissionalNaMesa[] = [
  { id: "helena", nome: "Dra. Helena", estados: {} },
  { id: "otavio", nome: "Dr. Otávio", estados: {} },
  { id: "cecilia", nome: "Dra. Cecília", estados: {} },
];

const CASO = "f347924a-133f-4370-81d3-70f0beea16f4";

function montarComparacao(juizoVigente?: Record<string, Record<string, string>>) {
  return render(
    <ComparacaoPorPreocupacoes
      caseId={CASO}
      {...montarMesaPorPreocupacoes({
        respostas: [],
        importancias: {},
        profissionais: TRES,
        subcriteriosAtivos: [...SUBCRITERIOS_ATIVOS],
      })}
      profissionais={TRES.map((p) => ({ id: p.id, nome: p.nome }))}
      juizoVigente={juizoVigente}
    />,
  );
}

describe("SIM-53 · a célula sabe que o juízo já existe", () => {
  it("sem juízo, pede — e o próximo passo é seu", () => {
    const { container } = montarComparacao();

    expect(container.querySelectorAll('[data-julgado="sim"]')).toHaveLength(0);
    expect(screen.getAllByRole("button", { name: /Registrar juízo/i })).toHaveLength(18);
    expect(screen.queryByRole("button", { name: /Rever juízo/i })).toBeNull();
  });

  it("com juízo, mostra o que foi dito e deixa de cobrar", () => {
    const { container } = montarComparacao({
      helena: { FORMACAO: "Residência na área e especialização coerente com o quadro." },
    });

    const celula = container.querySelector('[data-julgado="sim"]');
    expect(celula, "a célula julgada não foi marcada").not.toBeNull();

    // Deixa de cobrar: o dono do próximo passo neste ponto é NINGUÉM.
    expect(celula!.getAttribute("data-dono")).toBe("NINGUEM");
    expect(celula!.textContent).toContain("Você já julgou");
    expect(celula!.textContent).toContain("Residência na área");

    // E o ato muda de nome: rever não é registrar.
    expect(screen.getByRole("button", { name: /Rever juízo/i })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Registrar juízo/i })).toHaveLength(17);
  });

  // Os 18 pontos continuam de pé — o juízo dado não some da tela, muda de cara.
  it("nenhum ponto de juízo desaparece por ter sido julgado", () => {
    montarComparacao({ helena: { FORMACAO: "Já julguei isto." } });

    const total =
      screen.getAllByRole("button", { name: /Registrar juízo/i }).length +
      screen.getAllByRole("button", { name: /Rever juízo/i }).length;

    expect(total).toBe(18);
  });
});

// ---------------------------------------------------------------------------

const ESCOLHIDOS = [
  { id: "helena", nome: "Dra. Helena", rationale: "Porque atende ao que ela chamou de essencial." },
  { id: "otavio", nome: "Dr. Otávio", rationale: "Porque cobre o que a primeira não cobre." },
  { id: "cecilia", nome: "Dra. Cecília", rationale: "Porque acompanha depois." },
];

const JA_ESCRITO = ESCOLHIDOS.map((e) => ({
  id: e.id,
  justification: `Está aqui porque ${e.nome} responde ao essencial.`,
  relationToWeights: "Você disse que era essencial sair com o retorno marcado.",
  attentionPoints: ["Atende só à tarde."],
}));

function montarRelatorio(entregue: boolean) {
  return render(
    <EscreverORelatorio
      priorityProfileId="perfil-1"
      linhas={[]}
      profissionais={TRES.map((p) => ({ id: p.id, nome: p.nome }))}
      escolhidos={ESCOLHIDOS}
      composicaoJaEscrita="Estas três, juntas, cobrem o que você pediu."
      jaEscrito={JA_ESCRITO}
      entregue={entregue}
    />,
  );
}

describe("SIM-52 · o Relatório entregue é lido, não cobrado", () => {
  it("abre com o texto que já foi escrito, em vez de campos vazios", () => {
    const { container } = montarRelatorio(false);

    const preenchidas = [...container.querySelectorAll("textarea")].filter(
      (t) => (t as HTMLTextAreaElement).value.trim().length > 0,
    );
    expect(preenchidas.length, "o editor abriu em branco sobre texto existente").toBeGreaterThan(0);
  });

  // A guarda C8, que saiu com a Mesa antiga: congelado ⇒ ação indisponível,
  // COM MOTIVO. O banco já recusava; o Curador só descobria pelo erro.
  it("entregue: não oferece salvar, e diz por quê antes de a pessoa tentar", () => {
    montarRelatorio(true);

    expect(screen.queryByRole("button", { name: /Salvar o relatório/i })).toBeNull();
    expect(screen.queryByText(/Falta preencher/i)).toBeNull();
    expect(screen.getByText(/o texto que ela recebeu/i)).toBeTruthy();
    expect(screen.getByText(/não há o que salvar/i)).toBeTruthy();
  });

  it("não entregue: continua oferecendo salvar", () => {
    montarRelatorio(false);

    expect(screen.getByRole("button", { name: /Salvar o relatório/i })).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------

describe("SIM-54 · o desfecho é dito em português, nunca como enum", () => {
  it("nenhum desfecho conhecido devolve o próprio código", () => {
    for (const desfecho of [
      "VERSAO_JA_GRAVADA",
      "CONFLITO_DE_VERSAO",
      "SEM_AUTORIDADE",
      "JUIZO_RETIRADO",
    ]) {
      const frase = fraseDoDesfecho({ desfecho });
      expect(frase, desfecho).not.toContain(desfecho);
      expect(frase, desfecho).not.toMatch(/[A-Z]{4,}_[A-Z]/);
      expect(frase.length, desfecho).toBeGreaterThan(20);
    }
  });

  // `ERRO_TECNICO` é o único em que o detalhe É a informação: escondê-lo faria
  // a pessoa adivinhar, que é o defeito pelo outro lado.
  it("erro técnico mostra o detalhe sanitizado", () => {
    expect(fraseDoDesfecho({ desfecho: "ERRO_TECNICO", detalhe: "timeout na capability" })).toContain(
      "timeout na capability",
    );
  });

  it("desfecho desconhecido vira frase, não código", () => {
    const frase = fraseDoDesfecho({ desfecho: "ALGO_QUE_NAO_EXISTE" });

    expect(frase).not.toContain("ALGO_QUE_NAO_EXISTE");
    expect(frase).toContain("Nada foi registrado");
  });
});
