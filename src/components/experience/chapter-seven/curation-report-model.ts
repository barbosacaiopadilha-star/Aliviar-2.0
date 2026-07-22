import { CURATION_HOST } from "../chapter-four/curation-model";

export type CurationCriterion = {
  title: string;
  description: string;
};

export type RecommendedProfessional = {
  id: string;
  name: string;
  specialty: string;
  registry: string;
  whyInReport: string;
  formationAndTrajectory: string;
  whenGoodChoice: string;
};

export type CurationReport = {
  title: string;
  preparedBy: string;
  patientContext: string[];
  criteriaIntro: string;
  criteria: CurationCriterion[];
  professionalsIntro: string;
  professionals: RecommendedProfessional[];
  closingParagraphs: string[];
};

export const EXEMPLAR_CURATION_REPORT: CurationReport = {
  title: "Relatório de Curadoria",
  preparedBy: CURATION_HOST,
  patientContext: [
    "Você buscou a Aliviar em um momento de incerteza — após anos convivendo com sintomas que ainda não encontraram resposta definitiva, mesmo depois de consultas e exames.",
    "Na consulta inicial, ficou claro que sua necessidade não é apenas um nome de especialista: é clareza para decidir o próximo passo, com alguém que escute com profundidade e conduza a investigação com rigor.",
    "Você valoriza comunicação clara, abordagem humana e disponibilidade para acompanhar a jornada — não apenas um encontro isolado.",
  ],
  criteriaIntro:
    "A análise partiu do seu contexto clínico, do caminho que você já percorreu e das preferências que compartilhou conosco. Estes foram os critérios que orientaram cada comparação:",
  criteria: [
    {
      title: "Compatibilidade com sua necessidade",
      description:
        "Priorizamos profissionais cuja formação e prática clínica dialogam com investigação prolongada de sintomas sem diagnóstico fechado — não apenas com o nome da especialidade.",
    },
    {
      title: "Formação e trajetória verificáveis",
      description:
        "Confirmamos registro profissional, titulação e experiência documentada em contextos semelhantes ao seu — com atenção a referências acadêmicas e atuação clínica consistente.",
    },
    {
      title: "Estilo de cuidado",
      description:
        "Consideramos como cada profissional conduz a relação médico-paciente: tempo de escuta, clareza na explicação e disposição para caminhar etapas com você, não apenas prescrever.",
    },
    {
      title: "Viabilidade prática",
      description:
        "Incluímos disponibilidade de agenda, localização e modalidade de atendimento compatíveis com a sua rotina — sem que isso substitua o critério clínico.",
    },
  ],
  professionalsIntro:
    "Apresentamos três profissionais que emergiram desta análise. A ordem é editorial — uma leitura em sequência, não uma classificação. Cada um aparece aqui por um conjunto de razões específicas para o seu caso.",
  professionals: [
    {
      id: "prof-rafael-mendes",
      name: "Dr. Rafael Mendes",
      specialty: "Clínica Médica · Medicina Interna",
      registry: "CRM-SP 98.412",
      whyInReport:
        "O Dr. Rafael concentra sua prática em investigação diagnóstica de quadros complexos e crônicos — situações em que o paciente já passou por múltiplas avaliações sem resposta definitiva.",
      formationAndTrajectory:
        "Formado pela USP, com residência em Clínica Médica e fellowship em medicina interna baseada em evidências. Há doze anos conduz casos que exigem articulação entre especialidades, com histórico de acompanhamento longitudinal — não consultas pontuais.",
      whenGoodChoice:
        "Pode ser uma boa escolha se você busca um médico de referência para organizar a investigação, sintetizar o que já foi feito e conduzir os próximos passos com método — com disposição para permanecer ao longo do processo.",
    },
    {
      id: "prof-camila-torres",
      name: "Dra. Camila Torres",
      specialty: "Reumatologia",
      registry: "CRM-RJ 67.203",
      whyInReport:
        "A Dra. Camila aparece neste relatório porque parte dos seus sintomas — fadiga persistente, dores articulares intermitentes e inflamação de difícil caracterização — merece avaliação reumatológica estruturada.",
      formationAndTrajectory:
        "Graduação pela UFRJ, residência e mestrado em reumatologia. Atua em ambulatório de doenças autoimunes e síndromes de sobreposição, com abordagem que combina exame clínico detalhado e raciocínio diagnóstico cuidadoso.",
      whenGoodChoice:
        "Pode ser uma boa escolha se você quer aprofundar a hipótese inflamatória ou autoimune do seu quadro, com uma profissional acostumada a casos que não se encaixam em rótulos imediatos.",
    },
    {
      id: "prof-fernando-oliveira",
      name: "Dr. Fernando Oliveira",
      specialty: "Neurologia Clínica",
      registry: "CRM-MG 45.891",
      whyInReport:
        "O Dr. Fernando foi incluído porque alguns dos seus relatos — cefaleia crônica, alterações de sono e sensibilidade aumentada a estímulos — sugerem que uma avaliação neurológica criteriosa pode complementar o quadro.",
      formationAndTrajectory:
        "Formação pela UFMG, residência em neurologia e atuação em centro de referência em cefaleias e distúrbios do sistema nervoso autônomo. Conhecido entre pares por laudos detalhados e pela paciência em explicar raciocínio clínico ao paciente.",
      whenGoodChoice:
        "Pode ser uma boa escolha se você deseja esclarecer a contribuição neurológica dos seus sintomas, especialmente antes de encerrar linhas de investigação que ainda estão em aberto.",
    },
  ],
  closingParagraphs: [
    "Estas são orientações fundamentadas — não prescrições. A decisão sobre com quem seguir, quando e como, continua sendo sua.",
    "Você pode escolher um dos profissionais apresentados, conversar conosco antes de decidir ou pedir que aprofundemos alguma das referências.",
    "A equipe Aliviar permanece disponível para ajudá-lo a dar o próximo passo com clareza. Este relatório é um mapa, não um destino.",
  ],
};

export function getExemplarCurationReport(): CurationReport {
  return EXEMPLAR_CURATION_REPORT;
}

export const PROFESSIONAL_SECTION_LABELS = [
  "Uma referência para sua jornada",
  "Outra perspectiva compatível com seu caso",
  "Uma terceira possibilidade analisada",
] as const;

export function professionalSectionLabel(index: number): string {
  return PROFESSIONAL_SECTION_LABELS[index] ?? "Referência analisada";
}
