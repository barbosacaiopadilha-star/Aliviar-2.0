import { RegistrarCasoDeclarado } from "@/application/caso/registrar-caso-declarado";
import { ExecutarAnaliseInicial } from "@/application/analise/executar-analise-inicial";
import { AbrirSessaoDeCuradoria } from "@/application/curadoria/abrir-sessao-de-curadoria";
import { ProduzirEntregaAoPaciente } from "@/application/entrega/produzir-entrega-ao-paciente";
import { ObterJornadaDoPaciente } from "@/application/jornada/obter-jornada-do-paciente";
import { SupabaseAuthContextAdapter } from "@/infrastructure/auth/supabase-auth-context-adapter";
import { SupabaseCasoRepository } from "@/infrastructure/caso/supabase-caso-repository";
import { SupabaseAnaliseRepository } from "@/infrastructure/analise/supabase-analise-repository";
import { SupabaseCuradoriaRepository } from "@/infrastructure/curadoria/supabase-curadoria-repository";
import { SupabaseEntregaRepository } from "@/infrastructure/entrega/supabase-entrega-repository";
import { SupabaseJornadaQuery } from "@/infrastructure/jornada/supabase-jornada-query";

const auth = new SupabaseAuthContextAdapter();
const casoRepository = new SupabaseCasoRepository();
const analiseRepository = new SupabaseAnaliseRepository();
const curadoriaRepository = new SupabaseCuradoriaRepository();
const entregaRepository = new SupabaseEntregaRepository();
const jornadaQuery = new SupabaseJornadaQuery();

export const application = {
  registrarCasoDeclarado: new RegistrarCasoDeclarado(auth, casoRepository),
  executarAnaliseInicial: new ExecutarAnaliseInicial(auth, analiseRepository),
  abrirSessaoDeCuradoria: new AbrirSessaoDeCuradoria(auth, curadoriaRepository),
  produzirEntregaAoPaciente: new ProduzirEntregaAoPaciente(auth, entregaRepository),
  obterJornadaDoPaciente: new ObterJornadaDoPaciente(jornadaQuery),
};

export type Application = typeof application;
