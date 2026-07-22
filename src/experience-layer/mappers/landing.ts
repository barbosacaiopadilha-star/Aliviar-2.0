import type { ProximoPassoView } from "@/experience-flow/contracts/jornada-view";
import type { LandingExperienceModel } from "../contracts/experience-models";

export function mapLandingExperienceModel(): LandingExperienceModel {
  const proximo_passo: ProximoPassoView = {
    titulo: "Entrar em contato",
    descricao: "Fale com a Aliviar quando estiver pronto.",
    dono: "PACIENTE",
    acao_disponivel: true,
  };

  return {
    promessa: "Você não precisa navegar sozinho",
    convite_contato: {
      titulo: "Começar",
      descricao: "Um primeiro passo, no seu ritmo.",
      acao: "Começar",
    },
    conteudos_confianca: [
      {
        titulo: "Coordenação humana",
        descricao: "A Aliviar organiza o caminho — você decide cada passo.",
      },
      {
        titulo: "Sem pressa",
        descricao: "Não há prazo artificial. Você pode pausar quando precisar.",
      },
      {
        titulo: "Clareza para escolher",
        descricao: "Curadoria médica com três opções fundamentadas — nunca ranking.",
      },
    ],
    etapa_dominio: null,
    proximo_passo,
  };
}
