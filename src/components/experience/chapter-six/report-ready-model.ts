import { CURATION_HOST } from "../chapter-four/curation-model";

export type ReportReadyLine = {
  text: string;
  emphasis?: boolean;
};

export function buildReportReadyLines(): ReportReadyLine[] {
  return [
    { text: "Olá," },
    {
      text: "Chegou o momento mais importante desta etapa da sua jornada.",
      emphasis: true,
    },
    {
      text: "A curadoria do seu caso foi concluída. Seu relatório está pronto.",
    },
    {
      text: "Antes de você ler, quero que saiba o que este trabalho representa — porque não se trata de receber um arquivo.",
    },
    {
      text: "Estudamos seu caso com seriedade. Revisitamos o que você contou, o que compartilhou e o que ficou entrelinhas.",
    },
    {
      text: "Comparamos opções com critério — não por conveniência, por compatibilidade com a sua necessidade.",
    },
    {
      text: "Quando o caso pediu, houve discussão técnica entre especialistas da equipe.",
    },
    {
      text: "Cada orientação carrega uma justificativa. Nada foi resposta automática. Nada foi atalho.",
      emphasis: true,
    },
    {
      text: "Este relatório é um trabalho feito especialmente para você — pensado para a sua jornada, no seu contexto.",
      emphasis: true,
    },
    {
      text: "Reserve um momento tranquilo para ler. Não há pressa. O conteúdo estará aqui quando você estiver pronto.",
    },
    {
      text: "O protagonista desta história continua sendo você.",
    },
    { text: `Com presença,\n${CURATION_HOST}` },
  ];
}

export function buildReportReadyClosingNote(): string {
  return "Quando estiver pronto para ler, volte por aqui. Seguimos com você.";
}
