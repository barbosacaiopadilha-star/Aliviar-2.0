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
    href: "/rede/Ficha-da-Paciente-Curadoria-Aliviar.pdf",
    titulo: "Ficha da Paciente",
    descricao: "A Consulta Inicial no papel — a história nas palavras dela, até o reconhecimento assinado.",
  },
  {
    href: "/rede/Guia-da-Primeira-Rodada-Curadoria-Aliviar.pdf",
    titulo: "Guia da Primeira Rodada",
    descricao: "O roteiro dos nove passos e o Diário de Observação — preenchido durante, nunca de memória.",
  },
  {
    href: "/rede/Roteiro-de-Atendimento-Aliviar.pdf",
    titulo: "Roteiro de Atendimento",
    descricao: "Do primeiro contato no WhatsApp à Consulta Inicial marcada.",
  },
] as const;

export function KitDaCuradoriaCard() {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-sans text-lg font-semibold text-ink">Kit da Curadoria</h2>
        <p className="text-sm text-ink-muted">
          O papel da primeira rodada (ADR-075) — imprima daqui, sempre na versão vigente.
        </p>
      </CardHeader>
      <ul className="divide-y divide-border">
        {KIT_DA_CURADORIA.map((peca) => (
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
    </Card>
  );
}
