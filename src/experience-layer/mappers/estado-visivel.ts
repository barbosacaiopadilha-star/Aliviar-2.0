import type { EstadoVisivelJornada } from "@/experience-flow/contracts/jornada-view";

export const LABEL_ESTADO_VISIVEL: Record<EstadoVisivelJornada, string> = {
  EXPLORANDO: "Conhecendo a Aliviar",
  ENTENDENDO_METODO: "Entendendo como trabalhamos",
  CONSTRUINDO_CONFIANCA: "Construindo confiança",
  CADASTRANDO: "Finalizando seu cadastro",
  COMPARTILHANDO_HISTORIA: "Contando sua história",
  ACOMPANHADO_PELO_ACE: "Acompanhado pela Aliviar",
  EM_CURADORIA: "Em curadoria",
  AGUARDANDO_DOCUMENTOS: "Aguardando um documento seu",
  ENTREGA_DISPONIVEL: "Sua curadoria está pronta",
  ESCOLHA_PENDENTE: "Hora de escolher com calma",
  EM_ACOMPANHAMENTO: "Acompanhando sua escolha",
  JORNADA_ENCERRADA: "Jornada concluída",
  RELACIONAMENTO_ATIVO: "Sempre que precisar, estamos aqui",
};

export function labelEstadoVisivel(estado: EstadoVisivelJornada): string {
  return LABEL_ESTADO_VISIVEL[estado];
}
