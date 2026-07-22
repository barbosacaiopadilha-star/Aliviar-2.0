import { CURATION_HOST } from "../chapter-four/curation-model";

export type CurationTimePhase =
  | "return_same_day"
  | "early_days"
  | "deepening"
  | "sustained"
  | "report_announced";

export type CurationTimeLine = {
  text: string;
  emphasis?: boolean;
};

export function calendarDaysBetween(start: Date, now: Date): number {
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((nowDay.getTime() - startDay.getTime()) / 86_400_000);
}

export function resolveCurationTimePhase(daysSinceStart: number): CurationTimePhase {
  if (daysSinceStart < 1) return "return_same_day";
  if (daysSinceStart < 3) return "early_days";
  if (daysSinceStart < 7) return "deepening";
  if (daysSinceStart < 10) return "sustained";
  return "report_announced";
}

export function buildCurationTimeGreeting(phase: CurationTimePhase): string {
  switch (phase) {
    case "return_same_day":
      return "Que bom ver você de novo.";
    case "early_days":
      return "Os dias seguem — e o cuidado também.";
    case "deepening":
      return "Ainda aqui, com o seu caso.";
    case "sustained":
      return "O tempo passou, e seguimos com você.";
    case "report_announced":
      return "A curadoria foi concluída.";
  }
}

export function buildCurationTimeLines(phase: CurationTimePhase): CurationTimeLine[] {
  const greeting = buildCurationTimeGreeting(phase);

  switch (phase) {
    case "return_same_day":
      return [
        { text: "Olá," },
        { text: greeting, emphasis: true },
        {
          text: "Não precisava voltar. Se veio, queremos que saiba: seguimos com seu caso.",
        },
        {
          text: "A equipe continua estudando cada detalhe com calma — o que você contou, o que ainda está em aberto.",
        },
        { text: "Nada pede sua atenção agora." },
        {
          text: "Enquanto você vive sua vida, alguém continua cuidando de você.",
          emphasis: true,
        },
        { text: `Com presença,\n${CURATION_HOST}` },
      ];
    case "early_days":
      return [
        { text: "Olá," },
        { text: greeting, emphasis: true },
        {
          text: "Revisitamos o que você nos contou. Cada nuance importa para uma curadoria séria.",
        },
        {
          text: "Enquanto você segue sua rotina, seu caso permanece em nossas mãos — com atenção, não com pressa.",
        },
        {
          text: "Isso não é lentidão. É o tempo que o seu caso merece.",
        },
        { text: "Você não foi esquecido.", emphasis: true },
        { text: `Com presença,\n${CURATION_HOST}` },
      ];
    case "deepening":
      return [
        { text: "Olá," },
        { text: greeting, emphasis: true },
        {
          text: "A curadoria pede profundidade. Cruzamos seu contexto com critérios que não abrimos mão.",
        },
        {
          text: "Trabalhamos com rigor — em silêncio produtivo, não em abandono.",
        },
        {
          text: "Seu caso está em movimento, mesmo quando você não vê movimento.",
        },
        { text: "O próximo passo continua sendo nosso.", emphasis: true },
        {
          text: "Quando houver algo para você, você saberá primeiro.",
        },
        { text: `Com presença,\n${CURATION_HOST}` },
      ];
    case "sustained":
      return [
        { text: "Olá," },
        { text: greeting, emphasis: true },
        {
          text: "Quando a saúde pesa, os dias podem parecer longos. Sabemos.",
        },
        {
          text: "O tempo da curadoria não é vazio — é onde o cuidado se concentra.",
        },
        {
          text: "Continuamos afinando a orientação que você merece, sem pressa que comprometa qualidade.",
        },
        {
          text: "Você não está parado. Está sendo acompanhado.",
          emphasis: true,
        },
        {
          text: "Enquanto você segue sua vida, alguém continua cuidando de você.",
          emphasis: true,
        },
        { text: `Com presença,\n${CURATION_HOST}` },
      ];
    case "report_announced":
      return [
        { text: "Olá," },
        { text: greeting, emphasis: true },
        {
          text: "Seu relatório de curadoria está pronto — um trabalho feito para o seu caso, com o cuidado que este momento pede.",
          emphasis: true,
        },
        {
          text: "Quando estiver pronto para recebê-lo com calma, estamos aqui.",
        },
        { text: `Com presença,\n${CURATION_HOST}` },
      ];
  }
}
