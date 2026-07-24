import { RegistrarCasoDeclarado } from "@/application/caso/registrar-caso-declarado";
import { ExecutarAnaliseInicial } from "@/application/analise/executar-analise-inicial";
import { AbrirSessaoDeCuradoria } from "@/application/curadoria/abrir-sessao-de-curadoria";
import { ListarFilaCasosCurador, ObterCasoDeCuradoria } from "@/application/curador/curador-casos";
import {
  AbrirSessaoCuradoriaComWorkspace,
  AprovarEntregaCurador,
  AssumirCasoCurador,
  PublicarEntregaCurador,
  RegistrarComentarioOperacional,
  RegistrarTresOpcoes,
  SalvarConjuntoElegivel,
} from "@/application/curador/curador-comandos";
import {
  AprovarDossie,
  ConcluirDevolutivaCuradoria,
  ConcluirMesaCuradoria,
  CriarVersaoDossie,
  GarantirCasoCuradoria,
  IniciarDossieCuradoria,
  ObterCasoCuradoriaDossie,
  ObterDossiePaciente,
  PublicarDossieCuradoria,
  RegistrarDevolutivaCuradoria,
  RegistrarEscolhaCuradoria,
  SalvarRascunhoDossie,
  ValidarPerfilPrioridades,
} from "@/application/curador/dossie-comandos";
import { ProduzirEntregaAoPaciente } from "@/application/entrega/produzir-entrega-ao-paciente";
import { RegistrarDocumentoPaciente } from "@/application/documentos/registrar-documento-paciente";
import { AvancarOnboardingPaciente } from "@/application/jornada/avancar-onboarding-paciente";
import { AvancarParaEscolhaPaciente } from "@/application/jornada/avancar-para-escolha-paciente";
import { ObterJornadaDoPaciente } from "@/application/jornada/obter-jornada-do-paciente";
import { ObterJornadaDoPacienteAutenticado } from "@/application/jornada/obter-jornada-do-paciente-autenticado";
import { RegistrarEscolhaPaciente } from "@/application/jornada/registrar-escolha-paciente";
import { ListarFilasOperacionais } from "@/application/workflow/listar-filas-operacionais";
import { ObterPainelOperacional } from "@/application/workflow/obter-painel-operacional";
import { ObterWorkflowCaso } from "@/application/workflow/obter-workflow-caso";
import { ExecutarAtribuicaoOperacional } from "@/application/workflow/executar-atribuicao-operacional";
import { SupabaseAuthContextAdapter } from "@/infrastructure/auth/supabase-auth-context-adapter";
import { SupabaseCasoRepository } from "@/infrastructure/caso/supabase-caso-repository";
import { improvedAceAnaliseAdapter } from "@/infrastructure/ace/improved-ace-service";
import { SupabaseCuradoriaRepository } from "@/infrastructure/curadoria/supabase-curadoria-repository";
import { CuradoriaRepository } from "@/infrastructure/curadoria/curadoria-repository";
import { SupabaseEntregaRepository } from "@/infrastructure/entrega/supabase-entrega-repository";
import { SupabaseJornadaProjection } from "@/infrastructure/jornada/supabase-jornada-projection";
import { SupabaseJornadaQuery } from "@/infrastructure/jornada/supabase-jornada-query";

const auth = new SupabaseAuthContextAdapter();
const casoRepository = new SupabaseCasoRepository();
const analiseRepository = improvedAceAnaliseAdapter;
const curadoriaRepository = new SupabaseCuradoriaRepository();
const entregaRepository = new SupabaseEntregaRepository();
const jornadaQuery = new SupabaseJornadaQuery();
const jornadaProjection = new SupabaseJornadaProjection();
const registrarEscolhaPaciente = new RegistrarEscolhaPaciente(jornadaProjection);

export const application = {
  registrarCasoDeclarado: new RegistrarCasoDeclarado(auth, casoRepository),
  executarAnaliseInicial: new ExecutarAnaliseInicial(auth, analiseRepository),
  abrirSessaoDeCuradoria: new AbrirSessaoDeCuradoria(auth, curadoriaRepository),
  produzirEntregaAoPaciente: new ProduzirEntregaAoPaciente(auth, entregaRepository),
  obterJornadaDoPaciente: new ObterJornadaDoPaciente(jornadaQuery),
  obterJornadaDoPacienteAutenticado: new ObterJornadaDoPacienteAutenticado(jornadaQuery),
  avancarOnboardingPaciente: new AvancarOnboardingPaciente(jornadaProjection),
  avancarParaEscolhaPaciente: new AvancarParaEscolhaPaciente(jornadaProjection),
  registrarEscolhaPaciente,
  registrarDocumentoPaciente: new RegistrarDocumentoPaciente(),
  listarFilaCasosCurador: new ListarFilaCasosCurador(),
  obterCasoDeCuradoria: new ObterCasoDeCuradoria(),
  garantirCasoCuradoria: new GarantirCasoCuradoria(),
  obterCasoCuradoriaDossie: new ObterCasoCuradoriaDossie(),
  validarPerfilPrioridades: new ValidarPerfilPrioridades(),
  concluirMesaCuradoria: new ConcluirMesaCuradoria(),
  iniciarDossieCuradoria: new IniciarDossieCuradoria(),
  salvarRascunhoDossie: new SalvarRascunhoDossie(),
  criarVersaoDossie: new CriarVersaoDossie(),
  aprovarDossie: new AprovarDossie(),
  publicarDossieCuradoria: new PublicarDossieCuradoria(auth, entregaRepository),
  registrarDevolutivaCuradoria: new RegistrarDevolutivaCuradoria(),
  concluirDevolutivaCuradoria: new ConcluirDevolutivaCuradoria(),
  obterDossiePaciente: new ObterDossiePaciente(),
  registrarEscolhaCuradoria: new RegistrarEscolhaCuradoria(new CuradoriaRepository(), registrarEscolhaPaciente),
  assumirCasoCurador: new AssumirCasoCurador(),
  abrirSessaoCuradoriaComWorkspace: new AbrirSessaoCuradoriaComWorkspace(auth, curadoriaRepository),
  salvarConjuntoElegivel: new SalvarConjuntoElegivel(),
  registrarTresOpcoes: new RegistrarTresOpcoes(),
  registrarComentarioOperacional: new RegistrarComentarioOperacional(),
  aprovarEntregaCurador: new AprovarEntregaCurador(),
  publicarEntregaCurador: new PublicarEntregaCurador(auth, entregaRepository),
  listarFilasOperacionais: new ListarFilasOperacionais(),
  obterPainelOperacional: new ObterPainelOperacional(),
  obterWorkflowCaso: new ObterWorkflowCaso(),
  executarAtribuicaoOperacional: new ExecutarAtribuicaoOperacional(),
  jornadaQuery,
};

export type Application = typeof application;
