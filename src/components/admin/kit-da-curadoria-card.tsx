import { Card, CardHeader } from "@/components/ui/card";

/**
 * O Kit da Curadoria na Visão geral do admin — os PDFs da operação em papel
 * (ADR-075), para imprimir sem sair do produto. Decisão do Fundador (22/08):
 * quatro peças — a Folha da Mesa fica de fora por decisão dele (instrumento
 * de trabalho do Curador, impressa direto do repositório), e a documentação
 * da paciente é o "Levar em PDF" da própria Curadoria dela, nunca o
 * formulário cru.
 *
 * A lista é exportada para o teste que garante: todo link aponta para um
 * arquivo que EXISTE em public/rede — link morto não nasce.
 */
export const KIT_DA_CURADORIA = [
  {
    href: "/rede/Formulario-do-Profissional-Rede-Aliviar.pdf",
    titulo: "Formulário do Profissional",
    descricao: "A declaração assinada do médico — preenchida na entrevista, com o Termo de Veracidade.",
  },
  {
    href: "/rede/Ficha-do-Assistido-Curadoria-Aliviar.pdf",
    titulo: "Ficha do Assistido",
    descricao: "A Consulta Inicial no papel — a história nas palavras dela, até o reconhecimento assinado.",
  },
  {
    href: "/rede/Guia-da-Primeira-Rodada-Curadoria-Aliviar.pdf",
    titulo: "Guia da Primeira Rodada",
    descricao: "O roteiro dos nove passos e o Diário de Observação — preenchido durante, nunca de memória.",
  },
  {
    href: "/rede/Roteiro-do-Supervisor-Aliviar.pdf",
    titulo: "Roteiro do Supervisor",
    descricao: "Do primeiro contato à conversa marcada — e ele não sai depois (ADR-100).",
  },
] as const;

/**
 * OS GUIAS DE LEITURA — 28/08, a pedido do Fundador.
 *
 * Até aqui os guias de leitura só existiam como PDF local: `docs/guias/pdf/` é
 * ignorado pelo Git, então quem não rodasse o gerador não tinha como lê-los.
 *
 * **A ordem aqui é a ordem de leitura, e é por isso que ela vive no cartão e
 * não no nome do arquivo.** Cada papel vem em par — o guia trata do sistema, o
 * roteiro trata da conversa —, e os três de contexto fecham a lista.
 */
export const GUIAS_DE_LEITURA = [
  {
    href: "/guias/Guia-do-Supervisor-Aliviar.pdf",
    titulo: "Guia do Supervisor",
    descricao: "O sistema: os quatro gestos, e o que continua sendo dele depois de entregar ao Curador.",
  },
  {
    href: "/guias/Roteiro-do-Supervisor-Conversa-Aliviar.pdf",
    titulo: "Roteiro do Supervisor — a conversa",
    descricao: "A ligação: escutar, explicar, dizer o preço e combinar o começo. Com as oito objeções.",
  },
  {
    href: "/guias/Guia-do-Curador-Aliviar.pdf",
    titulo: "Guia do Curador",
    descricao: "Acolhimento, Mesa, Relatório e entrega — e quem mais pode estar na sala.",
  },
  {
    href: "/guias/Roteiro-do-Curador-Aliviar.pdf",
    titulo: "Roteiro do Curador",
    descricao: "As três conversas, e a pergunta de autorização que abre a Consulta Inicial.",
  },
  {
    href: "/guias/Guia-do-Acompanhamento-Aliviar.pdf",
    titulo: "Guia do Acompanhamento",
    descricao: "A fase de logística depois da escolha — conduzida pelo Supervisor, não por um rosto novo.",
  },
  {
    href: "/guias/Roteiro-do-Acompanhamento-Aliviar.pdf",
    titulo: "Roteiro do Acompanhamento",
    descricao: "O ano depois da escolha: o ritmo, o que dizer quando dá errado, e o que anotar.",
  },
  {
    href: "/guias/Guia-do-Administrador-Aliviar.pdf",
    titulo: "Guia do Administrador",
    descricao: "Papéis, equipe e o que trava a operação quando um nível fica em zero.",
  },
  {
    href: "/guias/Guia-do-Assistido-Aliviar.pdf",
    titulo: "Guia do Assistido",
    descricao: "A jornada pelo lado de dentro — o que ele vê, e em que ordem.",
  },
] as const;

/**
 * **O que se ENTREGA, e não o que se usa para operar.** Estes três foram
 * escritos para a assistida, não para a equipe: um explica a Aliviar a quem
 * está só olhando, outro é o mapa que ela leva depois de começar, e o terceiro
 * a ajuda a ler um currículo médico.
 *
 * **Por que saíram do Kit** (decisão do Fundador, 31/08 — *"no Kit da Curadoria
 * só quero guia operacional"*): o Kit é o que se imprime para trabalhar. Papel
 * que se entrega a ela não é ferramenta de operação, e misturar os dois faz a
 * lista de leitura obrigatória parecer maior do que é.
 *
 * **Ficam aqui, e não em lugar nenhum, por um motivo:** removê-los sem destino
 * os deixaria servidos em `public/` sem nada apontando para eles — órfãos, que
 * é a metade do `SIM-80` que ainda espera uma superfície própria para ela.
 * Enquanto essa superfície não existe, **quem entrega é a equipe**, e é daqui
 * que ela baixa.
 */
export const PARA_ENTREGAR_AO_ASSISTIDO = [
  {
    href: "/guias/Para-Voce-Que-Comecou-Aliviar.pdf",
    titulo: "Para você que começou",
    descricao: "O documento que o assistido recebe. Diz quantas pessoas ele vai conhecer: duas.",
  },
  {
    href: "/guias/O-Que-E-a-Aliviar.pdf",
    titulo: "O que é a Aliviar",
    descricao: "O documento de contexto: para quem chega novo na operação.",
  },
  {
    href: "/guias/Como-Ler-o-Curriculo-de-um-Medico-Aliviar.pdf",
    titulo: "Como ler o currículo de um médico",
    descricao:
      "Para a assistida que procura por formação: o que cada título garante, o que não garante, e as duas perguntas que valem mais. Sem nome, sem nota, sem ranking.",
  },
] as const;

function ListaDePecas({ pecas }: { pecas: ReadonlyArray<{ href: string; titulo: string; descricao: string }> }) {
  return (
    <ul className="divide-y divide-border">
      {pecas.map((peca) => (
        <li key={peca.href} className="flex items-center justify-between gap-3 py-3 text-sm">
          <div className="min-w-0">
            <p className="font-medium text-ink">{peca.titulo}</p>
            <p className="text-ink-muted">{peca.descricao}</p>
          </div>
          <a
            href={peca.href}
            download
            className="inline-flex min-h-11 shrink-0 items-center font-medium text-brand-primary underline-offset-4 hover:underline"
          >
            Baixar PDF
          </a>
        </li>
      ))}
    </ul>
  );
}

export function KitDaCuradoriaCard() {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-sans text-lg font-semibold text-ink">Kit da Curadoria</h2>
        <p className="text-sm text-ink-muted">
          O papel da primeira rodada (ADR-075) — imprima daqui, sempre na versão vigente.
        </p>
      </CardHeader>

      <p className="pt-1 text-xs font-medium uppercase tracking-[0.12em] text-ink-subtle">
        Para preencher na sala
      </p>
      <ListaDePecas pecas={KIT_DA_CURADORIA} />

      <p className="pt-6 text-xs font-medium uppercase tracking-[0.12em] text-ink-subtle">
        Para ler antes — na ordem
      </p>
      <ListaDePecas pecas={GUIAS_DE_LEITURA} />

      <p className="pt-6 text-xs font-medium uppercase tracking-[0.12em] text-ink-subtle">
        Para entregar ao assistido — não é material de operação
      </p>
      <ListaDePecas pecas={PARA_ENTREGAR_AO_ASSISTIDO} />
    </Card>
  );
}
