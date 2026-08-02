import type { ProfessionalProfile } from "./types";

/**
 * As condições da porta de publicação (Release de Reconstrução, ETAPA 6).
 *
 * O banco é a garantia — o trigger `assert_publication_requirements`
 * (20260727071000_politica_de_fontes.sql) recusa a publicação que não cumpra
 * as cinco condições. Este módulo é a CORTESIA: diz ao administrador, antes do
 * clique e em português, exatamente o que falta e como corrigir. As duas
 * listas precisam andar juntas: condição nova no banco = pendência nova aqui.
 */

export type PublicationPendency = {
  code:
    | "PERFIL_DEMO"
    | "CRM_AUSENTE"
    | "CRM_UF_AUSENTE"
    | "REGISTRO_NAO_VERIFICADO"
    | "REGISTRO_IRREGULAR"
    | "AREA_DE_ATUACAO_AUSENTE"
    | "AREA_DE_ATUACAO_NAO_VERIFICADA"
    | "DIVERGENCIA_CRITICA_ABERTA";
  label: string;
  howToFix: string;
};

export type PracticeAreaSummary = {
  rawText: string;
  tags: string[];
  verificationStatus: "nao_verificado" | "em_verificacao" | "verificado" | "divergente";
} | null;

export function listPublicationPendencies(input: {
  professional: Pick<
    ProfessionalProfile,
    "isDemo" | "crm" | "crmUf" | "registrationStatus"
  >;
  practiceArea: PracticeAreaSummary;
  openCriticalDivergences: number;
}): PublicationPendency[] {
  const pendencies: PublicationPendency[] = [];
  const { professional, practiceArea, openCriticalDivergences } = input;

  if (professional.isDemo) {
    pendencies.push({
      code: "PERFIL_DEMO",
      label: "Este é um perfil de demonstração.",
      howToFix: "Perfis de demonstração exercitam o fluxo e nunca são publicados. Crie um perfil real.",
    });
  }

  if (!professional.crm?.trim()) {
    pendencies.push({
      code: "CRM_AUSENTE",
      label: "O CRM não foi informado.",
      howToFix: "Preencha o CRM no cadastro e salve.",
    });
  }

  if (!professional.crmUf?.trim()) {
    pendencies.push({
      code: "CRM_UF_AUSENTE",
      label: "A UF do CRM não foi informada.",
      howToFix: "Selecione a UF do CRM no cadastro e salve.",
    });
  }

  if (professional.registrationStatus === null) {
    pendencies.push({
      code: "REGISTRO_NAO_VERIFICADO",
      label: "O registro no conselho ainda não foi verificado.",
      howToFix:
        "Verifique a situação do registro na fonte oficial (ex.: portal do CFM) e registre o resultado com a fonte, no bloco Verificação do registro.",
    });
  } else if (professional.registrationStatus !== "regular") {
    pendencies.push({
      code: "REGISTRO_IRREGULAR",
      label:
        professional.registrationStatus === "irregular"
          ? "O registro consta como irregular no conselho."
          : "O registro não foi localizado no conselho.",
      howToFix:
        "Publicação exige registro regular. Se a situação mudou, refaça a verificação na fonte oficial e registre o novo resultado.",
    });
  }

  if (!practiceArea) {
    pendencies.push({
      code: "AREA_DE_ATUACAO_AUSENTE",
      label: "A Área de Atuação não foi definida.",
      howToFix: "Descreva a área de atuação do profissional no bloco Área de Atuação e salve.",
    });
  } else if (practiceArea.verificationStatus !== "verificado") {
    pendencies.push({
      code: "AREA_DE_ATUACAO_NAO_VERIFICADA",
      label: "A Área de Atuação ainda não foi verificada.",
      howToFix:
        "Confirme a área contra uma fonte (site institucional, entrevista, documento) e marque como verificada, informando a fonte.",
    });
  }

  if (openCriticalDivergences > 0) {
    pendencies.push({
      code: "DIVERGENCIA_CRITICA_ABERTA",
      label: `Há ${openCriticalDivergences} divergência(s) crítica(s) em aberto neste cadastro.`,
      howToFix: "Resolva as divergências no painel de evidências antes de publicar.",
    });
  }

  return pendencies;
}
