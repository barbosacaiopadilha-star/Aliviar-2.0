import type { EtapaCodigoView, JornadaDoPacienteView } from "./contracts/jornada-view";
import type {
  EstadoFluxo,
  EstadoFluxoRegra,
  TransicaoEstadoFluxo,
} from "./contracts/state-machine";

const MAPA_ETAPA_PARA_ESTADO: Record<EtapaCodigoView, EstadoFluxo> = {
  PRIMEIRA_DUVIDA: "EXPLORANDO",
  PRIMEIRO_CONTATO: "PRIMEIRO_CONTATO",
  DESCOBERTA: "EXPLORANDO",
  ENTENDIMENTO_METODO: "CADASTRO",
  CONFIANCA: "CADASTRO",
  CADASTRO: "CADASTRO",
  HISTORIA: "HISTORIA",
  ACE: "ACE",
  CURADORIA: "CURADORIA",
  ENTREGA: "ENTREGA",
  ESCOLHA: "ESCOLHA",
  ACOMPANHAMENTO: "RELACIONAMENTO",
  RELACIONAMENTO: "RELACIONAMENTO",
};

export const REGRAS_ESTADO_FLUXO: EstadoFluxoRegra[] = [
  {
    estado: "EXPLORANDO",
    etapas_dominio: ["PRIMEIRA_DUVIDA", "DESCOBERTA"],
    pode_alterar: ["DOMINIO_JORNADA", "APPLICATION_STAFF", "EVENTO_EXTERNO"],
    nunca_altera: ["INTERFACE", "EXPERIENCE_LAYER", "EXPERIENCE_FLOW"],
  },
  {
    estado: "PRIMEIRO_CONTATO",
    etapas_dominio: ["PRIMEIRO_CONTATO"],
    pode_alterar: ["DOMINIO_JORNADA", "APPLICATION_STAFF", "EVENTO_EXTERNO"],
    nunca_altera: ["INTERFACE", "EXPERIENCE_LAYER", "EXPERIENCE_FLOW"],
  },
  {
    estado: "CADASTRO",
    etapas_dominio: ["ENTENDIMENTO_METODO", "CONFIANCA", "CADASTRO"],
    pode_alterar: ["DOMINIO_JORNADA", "APPLICATION_STAFF", "API_CANONICA"],
    nunca_altera: ["INTERFACE", "EXPERIENCE_LAYER", "EXPERIENCE_FLOW"],
  },
  {
    estado: "HISTORIA",
    etapas_dominio: ["HISTORIA"],
    pode_alterar: ["DOMINIO_JORNADA", "APPLICATION_STAFF", "API_CANONICA", "EVENTO_EXTERNO"],
    nunca_altera: ["INTERFACE", "EXPERIENCE_LAYER", "EXPERIENCE_FLOW"],
  },
  {
    estado: "ACE",
    etapas_dominio: ["ACE"],
    pode_alterar: ["DOMINIO_JORNADA", "APPLICATION_STAFF", "EVENTO_EXTERNO"],
    nunca_altera: ["INTERFACE", "EXPERIENCE_LAYER", "EXPERIENCE_FLOW"],
  },
  {
    estado: "CURADORIA",
    etapas_dominio: ["CURADORIA"],
    pode_alterar: ["DOMINIO_JORNADA", "APPLICATION_STAFF", "API_CANONICA", "EVENTO_EXTERNO"],
    nunca_altera: ["INTERFACE", "EXPERIENCE_LAYER", "EXPERIENCE_FLOW"],
  },
  {
    estado: "ENTREGA",
    etapas_dominio: ["ENTREGA"],
    pode_alterar: ["DOMINIO_JORNADA", "APPLICATION_STAFF", "API_CANONICA"],
    nunca_altera: ["INTERFACE", "EXPERIENCE_LAYER", "EXPERIENCE_FLOW"],
  },
  {
    estado: "ESCOLHA",
    etapas_dominio: ["ESCOLHA"],
    pode_alterar: ["DOMINIO_JORNADA", "APPLICATION_STAFF", "EVENTO_EXTERNO"],
    nunca_altera: ["INTERFACE", "EXPERIENCE_LAYER", "EXPERIENCE_FLOW"],
  },
  {
    estado: "RELACIONAMENTO",
    etapas_dominio: ["ACOMPANHAMENTO", "RELACIONAMENTO"],
    pode_alterar: ["DOMINIO_JORNADA", "APPLICATION_STAFF", "EVENTO_EXTERNO"],
    nunca_altera: ["INTERFACE", "EXPERIENCE_LAYER", "EXPERIENCE_FLOW"],
  },
  {
    estado: "ENCERRADO",
    etapas_dominio: ["RELACIONAMENTO"],
    pode_alterar: ["DOMINIO_JORNADA", "APPLICATION_STAFF"],
    nunca_altera: ["INTERFACE", "EXPERIENCE_LAYER", "EXPERIENCE_FLOW"],
  },
];

export const TRANSICOES_ESTADO_FLUXO: TransicaoEstadoFluxo[] = [
  { de: "EXPLORANDO", para: "PRIMEIRO_CONTATO", evento: "EtapaConcluida(PRIMEIRA_DUVIDA)", mutador: "APPLICATION_STAFF" },
  { de: "PRIMEIRO_CONTATO", para: "EXPLORANDO", evento: "EtapaConcluida(PRIMEIRO_CONTATO) → DESCOBERTA", mutador: "APPLICATION_STAFF" },
  { de: "EXPLORANDO", para: "CADASTRO", evento: "EtapaConcluida(DESCOBERTA) → ENTENDIMENTO_METODO", mutador: "APPLICATION_STAFF" },
  { de: "CADASTRO", para: "CADASTRO", evento: "EtapaConcluida(ENTENDIMENTO_METODO) → CONFIANCA", mutador: "APPLICATION_STAFF" },
  { de: "CADASTRO", para: "CADASTRO", evento: "EtapaConcluida(CONFIANCA) → CADASTRO", mutador: "APPLICATION_STAFF" },
  { de: "CADASTRO", para: "HISTORIA", evento: "RegistrarCasoDeclarado + EtapaConcluida(CADASTRO)", mutador: "API_CANONICA" },
  { de: "HISTORIA", para: "ACE", evento: "ExecutarAnaliseInicial + EtapaConcluida(HISTORIA)", mutador: "API_CANONICA" },
  { de: "ACE", para: "CURADORIA", evento: "AbrirSessaoDeCuradoria + EtapaConcluida(ACE)", mutador: "API_CANONICA" },
  { de: "CURADORIA", para: "ENTREGA", evento: "ProduzirEntregaAoPaciente + EtapaConcluida(CURADORIA)", mutador: "API_CANONICA" },
  { de: "ENTREGA", para: "ESCOLHA", evento: "EtapaConcluida(ENTREGA)", mutador: "APPLICATION_STAFF" },
  { de: "ESCOLHA", para: "RELACIONAMENTO", evento: "ESCOLHA_REGISTRADA + EtapaConcluida(ESCOLHA)", mutador: "EVENTO_EXTERNO" },
  { de: "RELACIONAMENTO", para: "RELACIONAMENTO", evento: "ACOMPANHAMENTO_SINALIZADO + EtapaConcluida(ACOMPANHAMENTO)", mutador: "EVENTO_EXTERNO" },
  { de: "RELACIONAMENTO", para: "ENCERRADO", evento: "JornadaConcluida", mutador: "DOMINIO_JORNADA" },
];

export function resolverEstadoFluxo(view: JornadaDoPacienteView): EstadoFluxo {
  if (view.concluida_em) {
    return "ENCERRADO";
  }
  return MAPA_ETAPA_PARA_ESTADO[view.etapa_atual];
}

export function regraDoEstado(estado: EstadoFluxo): EstadoFluxoRegra | undefined {
  return REGRAS_ESTADO_FLUXO.find((regra) => regra.estado === estado);
}
