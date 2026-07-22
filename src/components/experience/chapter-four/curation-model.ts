import { JOURNEY_MANAGER } from "../chapter-three/consultation-model";

export const CURATION_HOST = JOURNEY_MANAGER;

export type CurationPresenceLine = {
  text: string;
  emphasis?: boolean;
};

export function buildCurationPresenceLines(): CurationPresenceLine[] {
  return [
    { text: "Olá," },
    {
      text: "A consulta inicial ficou para trás. Você pode seguir com sua rotina — nós seguimos com o seu caso.",
    },
    {
      text: `Sou o ${CURATION_HOST}, da equipe Aliviar. Vou acompanhar sua jornada daqui em diante.`,
    },
    { text: "A curadoria começou.", emphasis: true },
    {
      text: "Neste momento, a equipe estuda seu caso com atenção — o contexto, o que você nos contou, o que ainda está em aberto.",
    },
    {
      text: "Isso leva tempo porque importa. Não é pressa; é cuidado.",
    },
    { text: "Você não precisa fazer nada agora." },
    { text: "Nenhuma tarefa. Nenhum formulário. Nenhuma cobrança." },
    {
      text: "Se surgir alguma dúvida nossa, entraremos em contato. Quando a curadoria estiver pronta, você será a primeira pessoa a saber.",
    },
    { text: "Você não foi esquecido.", emphasis: true },
    {
      text: "Enquanto você vive sua vida, existe uma equipe cuidando do seu caso.",
      emphasis: true,
    },
    { text: "O próximo passo agora é nosso: conduzir a curadoria com rigor. Seguimos trabalhando." },
    { text: `Com presença,\n${CURATION_HOST}` },
  ];
}
