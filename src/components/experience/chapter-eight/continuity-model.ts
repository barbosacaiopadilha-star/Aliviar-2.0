import { CURATION_HOST } from "../chapter-four/curation-model";

export type ContinuityLine = {
  text: string;
  emphasis?: boolean;
};

export function buildContinuityLines(): ContinuityLine[] {
  return [
    { text: "Olá," },
    {
      text: "Você leu o relatório. Isso importa — não porque encerra algo, mas porque abre uma nova fase.",
      emphasis: true,
    },
    {
      text: "A maioria das empresas termina aqui. Nós não.",
    },
    {
      text: "A entrega do relatório não fecha sua jornada com a Aliviar. Ela inaugura o que vem depois da decisão.",
    },
    {
      text: "A escolha continua sendo sua — entre os profissionais apresentados, entre conversar mais conosco, ou entre precisar de tempo antes de qualquer passo.",
    },
    {
      text: "Se quiser falar sobre as recomendações, haverá espaço para isso. Uma conversa, no seu ritmo — não um protocolo, não um formulário.",
    },
    {
      text: "Se decidir seguir com um dos profissionais, ajudamos na coordenação da próxima etapa. Você não precisa organizar tudo sozinho.",
    },
    {
      text: "Se ainda restar dúvida, incerteza ou medo de errar, você não precisa enfrentar isso em silêncio.",
      emphasis: true,
    },
    {
      text: "Mesmo depois da sua decisão, você continua acompanhado.",
      emphasis: true,
    },
    {
      text: "Obrigado por confiar sua história a nós.",
      emphasis: true,
    },
    { text: `Com presença,\n${CURATION_HOST}` },
  ];
}

export function buildContinuityRestNote(): string {
  return "Estaremos aqui quando fizer sentido para você.";
}
