import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PedidosDoTitular } from "@/components/admin/pedidos-do-titular";
import {
  assumirPedidoAction,
  executarEliminacaoAction,
  registrarDesfechoAction,
} from "@/modules/governanca/pedidos-actions";
import type { PedidoParaOperacao } from "@/modules/governanca/pedidos-repository";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
vi.mock("@/modules/governanca/pedidos-actions", () => ({
  assumirPedidoAction: vi.fn(),
  executarEliminacaoAction: vi.fn(),
  registrarDesfechoAction: vi.fn(),
}));

/**
 * A TELA DE PEDIDOS DO TITULAR — as promessas dela, na tela.
 *
 * O que estes testes protegem não é aparência: é a diferença entre o que a
 * plataforma EXECUTA e o que ela apenas REGISTRA, e a cerca do ato
 * irreversível.
 */

const NOME = "Mariana Sintética";
const base: PedidoParaOperacao = {
  id: "11111111-1111-4111-8111-111111111111",
  profileId: "22222222-2222-4222-8222-222222222222",
  nomeDoTitular: NOME,
  tipo: "exclusao",
  status: "recebido",
  criadoEm: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  prazoEm: null,
  concluidoEm: null,
  desfecho: null,
  itens: [],
};

const acesso: PedidoParaOperacao = {
  ...base,
  id: "33333333-3333-4333-8333-333333333333",
  tipo: "acesso",
};

describe("PedidosDoTitular", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(executarEliminacaoAction).mockResolvedValue({ success: true });
    vi.mocked(registrarDesfechoAction).mockResolvedValue({ success: true });
    vi.mocked(assumirPedidoAction).mockResolvedValue({ success: true });
  });

  it("sem pedidos, diz isso — e não some da tela", () => {
    render(<PedidosDoTitular emAberto={[]} respondidos={[]} eliminacoes={[]} />);
    expect(screen.getByText("Nenhum pedido esperando.")).toBeInTheDocument();
  });

  it("só a ELIMINAÇÃO oferece execução; os outros tipos oferecem registro", () => {
    render(<PedidosDoTitular emAberto={[base, acesso]} respondidos={[]} eliminacoes={[]} />);
    const cartoes = screen.getAllByRole("listitem");
    const eliminacao = cartoes.find((c) => within(c).queryByText(/Eliminação dos dados/))!;
    const pedidoDeAcesso = cartoes.find((c) => within(c).queryByText(/Acesso aos dados/))!;

    expect(within(eliminacao).getByRole("button", { name: "Executar a eliminação" })).toBeInTheDocument();
    // A tela não finge executar o que a plataforma não executa.
    expect(within(pedidoDeAcesso).queryByRole("button", { name: /Executar/ })).toBeNull();
    expect(
      within(pedidoDeAcesso).getByRole("button", { name: "Registrar que foi atendido" }),
    ).toBeInTheDocument();
  });

  it("quando o prazo não é fixado, a tela chama a referência de referência", () => {
    render(<PedidosDoTitular emAberto={[base]} respondidos={[]} eliminacoes={[]} />);
    // Sem a flag `s`: o alvo de compilação do projeto é anterior ao ES2018.
    // `[\s\S]` faz o mesmo trabalho e compila em qualquer alvo.
    expect(screen.getByText(/A referência acima são/)).toHaveTextContent(
      /15 dias corridos[\s\S]*pendente de confirmação jurídica/,
    );
  });

  it("com prazo fixado no pedido, a ressalva de referência desaparece", () => {
    const comPrazo = { ...base, prazoEm: new Date(Date.now() + 3 * 86400000).toISOString() };
    render(<PedidosDoTitular emAberto={[comPrazo]} respondidos={[]} eliminacoes={[]} />);
    expect(screen.queryByText(/A referência acima são/)).toBeNull();
  });

  it("a eliminação exige motivo E o nome digitado — o botão nasce inerte", async () => {
    const user = userEvent.setup();
    render(<PedidosDoTitular emAberto={[base]} respondidos={[]} eliminacoes={[]} />);
    await user.click(screen.getByRole("button", { name: "Executar a eliminação" }));

    const confirmar = screen.getByRole("button", { name: "Eliminar definitivamente" });
    expect(confirmar).toBeDisabled();

    await user.type(screen.getByLabelText(/Motivo/), "pedido recebido por escrito hoje");
    expect(confirmar, "motivo sozinho não libera o ato irreversível").toBeDisabled();

    await user.type(screen.getByLabelText(/Digite exatamente/), "Mariana Errada");
    expect(confirmar).toBeDisabled();
    expect(screen.getByText("O nome não corresponde.")).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/Digite exatamente/));
    await user.type(screen.getByLabelText(/Digite exatamente/), NOME);
    expect(confirmar).toBeEnabled();

    await user.click(confirmar);
    await waitFor(() =>
      expect(executarEliminacaoAction).toHaveBeenCalledWith({
        requestId: base.id,
        profileId: base.profileId,
        motivo: "pedido recebido por escrito hoje",
        confirmacao: NOME,
      }),
    );
  });

  it("o diálogo da eliminação diz o que sai, e que julgamento barra o ato", async () => {
    const user = userEvent.setup();
    render(<PedidosDoTitular emAberto={[base]} respondidos={[]} eliminacoes={[]} />);
    await user.click(screen.getByRole("button", { name: "Executar a eliminação" }));
    expect(screen.getByText("Isto não tem volta.")).toBeInTheDocument();
    expect(screen.getByText(/julgamento não se apaga/)).toBeInTheDocument();
  });

  it("o aviso de arquivo que não saiu do storage é mostrado — sucesso pela metade não é sucesso", async () => {
    const user = userEvent.setup();
    vi.mocked(executarEliminacaoAction).mockResolvedValue({
      success: true,
      aviso: "A pessoa foi eliminada do banco, mas 1 arquivo(s) não saíram do armazenamento.",
    });
    render(<PedidosDoTitular emAberto={[base]} respondidos={[]} eliminacoes={[]} />);
    await user.click(screen.getByRole("button", { name: "Executar a eliminação" }));
    await user.type(screen.getByLabelText(/Motivo/), "pedido recebido por escrito hoje");
    await user.type(screen.getByLabelText(/Digite exatamente/), NOME);
    await user.click(screen.getByRole("button", { name: "Eliminar definitivamente" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/não saíram do armazenamento/));
  });

  it("a recusa exige fundamentação e vai como 'recusado'", async () => {
    const user = userEvent.setup();
    render(<PedidosDoTitular emAberto={[acesso]} respondidos={[]} eliminacoes={[]} />);
    await user.click(screen.getByRole("button", { name: "Recusar com fundamentação" }));
    const confirmar = screen.getByRole("button", { name: "Registrar a recusa" });
    expect(confirmar).toBeDisabled();
    await user.type(screen.getByLabelText(/Fundamentação/), "retenção por obrigação legal");
    await user.click(confirmar);
    await waitFor(() =>
      expect(registrarDesfechoAction).toHaveBeenCalledWith({
        requestId: acesso.id,
        status: "recusado",
        desfecho: "retenção por obrigação legal",
      }),
    );
  });

  it("o erro da ação aparece e o diálogo NÃO fecha — a escolha dela é preservada", async () => {
    const user = userEvent.setup();
    vi.mocked(registrarDesfechoAction).mockResolvedValue({ success: false, error: "Não autorizado." });
    render(<PedidosDoTitular emAberto={[acesso]} respondidos={[]} eliminacoes={[]} />);
    await user.click(screen.getByRole("button", { name: "Registrar que foi atendido" }));
    await user.type(screen.getByLabelText(/O que foi feito/), "cópia enviada por e-mail");
    await user.click(screen.getByRole("button", { name: "Registrar o atendimento" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Não autorizado."));
    expect(screen.getByRole("button", { name: "Registrar o atendimento" })).toBeInTheDocument();
  });

  it("'Assumir' só existe enquanto o pedido está recebido", () => {
    render(
      <PedidosDoTitular
        emAberto={[{ ...acesso, status: "em_execucao" }]}
        respondidos={[]}
        eliminacoes={[]}
      />,
    );
    expect(screen.queryByRole("button", { name: "Assumir" })).toBeNull();
    expect(screen.getByText("Em execução")).toBeInTheDocument();
  });

  it("o histórico de eliminações explica por que não há nome nele", () => {
    render(
      <PedidosDoTitular
        emAberto={[]}
        respondidos={[]}
        eliminacoes={[
          {
            id: 1,
            profileIdEliminado: "44444444-4444-4444-8444-444444444444",
            motivo: "pedido da titular",
            casesDescartados: 1,
            documentos: 2,
            orfaosDeStorage: 0,
            executadoEm: new Date().toISOString(),
          },
        ]}
      />,
    );
    expect(screen.getByText(/desaparece junto com a pessoa/)).toBeInTheDocument();
    expect(screen.getByText(/1 Case\(s\), 2 documento\(s\)/)).toBeInTheDocument();
  });

  it("pedido de quem já não existe não oferece eliminação", () => {
    render(
      <PedidosDoTitular
        emAberto={[{ ...base, nomeDoTitular: null }]}
        respondidos={[]}
        eliminacoes={[]}
      />,
    );
    expect(screen.getByText("Pessoa já não cadastrada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Executar a eliminação" })).toBeDisabled();
  });
});
