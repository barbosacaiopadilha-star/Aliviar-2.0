/**
 * A PRÓXIMA AÇÃO DO PACIENTE — o que falta, por que importa, e onde se faz.
 *
 * @metodo Guided Experience §2 — as cinco perguntas, do ponto de vista de quem espera
 * @metodo UX_PRINCIPLES P2 — a próxima ação nunca se esconde, nem quando não existe
 * @metodo UX_PRINCIPLES P12 — a mensagem diz o que falta e como resolver
 *
 * Por que existe: a Home dizia "Aguardando informação" — o rótulo do estado do
 * Case, não a pendência da pessoa. Quem lê isso descobre que falta algo e não
 * descobre O QUE, nem onde resolver. Uma pendência sem endereço transfere para
 * o paciente o trabalho de investigar a própria jornada.
 *
 * A regra desta camada: **toda pendência declarada tem destino, ou declara
 * explicitamente que acontece na conversa.** Nunca um terceiro caso.
 *
 * Onde NÃO há ação em tela — validar o Perfil, decidir entre os três caminhos —
 * a plataforma não inventa um botão. Esses atos acontecem numa conversa com o
 * Curador, por decisão de Método (Fundamentos §10: a validação tem liturgia;
 * Experience §2.5: a entrega é sempre humana). Dizer isso é mais honesto que
 * um botão que abriria uma tela onde o ato não se completa.
 *
 * Puro e determinístico: sem banco, sem rede, sem data do sistema.
 */

import type { LeituraDeEstado } from "@/foundation/contrato-de-estado";
import type { Jornada } from "@/modules/curadoria/jornada";

export type PatientNextAction = {
  /** O que falta — específico, nunca "uma informação adicional". */
  title: string;
  /** Por que isso importa para ela. */
  why: string;
  /** O que acontece depois — reduz a ansiedade de quem não vê o processo. */
  whatHappensNext: string;
  /** Onde se faz. `null` exige `happensInConversation` — ver abaixo. */
  cta: { label: string; href: string } | null;
  /**
   * O ato acontece numa conversa com a equipe, não em tela.
   *
   * Existe como campo, e não como frase escrita na página, porque é a
   * invariante desta camada: **ou há destino, ou está declarado que é
   * conversa.** Um terceiro caso — pendência sem link e sem explicação — é
   * exatamente o bug que esta correção elimina, e um teste o proíbe.
   */
  happensInConversation: boolean;
};

export type PatientPendingState =
  | { kind: "action"; action: PatientNextAction }
  /** Nada depende dela: o silêncio é a mensagem, e ele é dito por extenso. */
  | { kind: "nothing"; message: string; whatHappensNext: string };

/**
 * Deriva a pendência do paciente a partir da jornada já projetada e do estado
 * lido pela Fundação. A ordem é a da jornada: a primeira coisa que depende
 * dela vence.
 *
 * **Esta camada deixou de decidir macroestado.** Ela recebe `leitura` — a
 * projeção do contrato congelado — e traduz em ação, texto e destino. O motor
 * local que existia antes (`derivePatientHomeState`) foi aposentado: dois
 * motores decidindo o mesmo estado foi exatamente o que produziu a Home
 * dizendo "conte sua história" com a Curadoria entregue.
 */
export function derivePatientPending(input: {
  leitura: LeituraDeEstado;
  jornada: Jornada | null;
}): PatientPendingState {
  const { leitura, jornada } = input;

  // 0 — Encerrado ou cancelado: nada depende dela, e nada é prometido. Vem
  // antes de tudo porque é terminal — e porque `closed_at` sozinho não
  // distingue conclusão de cancelamento (é o contrato que já distinguiu).
  if (leitura.estado === "CASO_CANCELADO" || leitura.estado === "CASO_ENCERRADO_SEM_ENTREGA") {
    return {
      kind: "nothing",
      message: leitura.rotuloPaciente,
      whatHappensNext: "Se quiser retomar, fale com a Aliviar.",
    };
  }

  // Fallback seguro: sem fatos suficientes não se pede nada nem se promete nada.
  if (leitura.estado === "INDETERMINADO") {
    return {
      kind: "nothing",
      message: leitura.rotuloPaciente,
      whatHappensNext: "Assim que houver uma etapa para você, ela aparece aqui.",
    };
  }

  // 1 — Antes de existir Case, a jornada é a história. Estes dois estados têm
  // ação real em tela e por isso vêm primeiro.
  if (leitura.estado === "HISTORIA_NAO_INICIADA") {
    return {
      kind: "action",
      action: {
        title: "Precisamos conhecer a sua história",
        why: "Tudo na Aliviar parte do que você viveu — não de um formulário.",
        whatHappensNext:
          "Um Curador lê o que você escreveu e marca uma conversa com você. Você não vai precisar recontar nada.",
        // A3a.1 · `/sua-historia` (raiz) é a página PÚBLICA explicativa — a
        // porta de quem ainda não entrou. Esta pendência só existe para quem
        // já está autenticada na casa, e mandá-la para a fachada a fazia sair
        // da experiência privada para ler o que ela já sabe.
        //
        // `/continuar` é a entrada autenticada do wizard (A2B): exige paciente,
        // veste o PatientShell e resolve a história ativa — criando a primeira
        // quando ainda não existe nenhuma. Por isso o mesmo destino serve para
        // começar e para retomar, e é o que o resto da casa já usava.
        cta: { label: "Contar minha história", href: "/sua-historia/continuar" },
        happensInConversation: false,
      },
    };
  }

  if (leitura.estado === "HISTORIA_EM_PREENCHIMENTO") {
    return {
      kind: "action",
      action: {
        title: "Sua história está salva pela metade",
        why: "O que você já escreveu foi preservado — nada se perdeu.",
        whatHappensNext:
          "Quando você enviar, um Curador lê e procura você para conversar. Não há prazo.",
        cta: { label: "Continuar minha história", href: "/sua-historia/continuar" },
        happensInConversation: false,
      },
    };
  }

  // Curadoria entregue: há conteúdo, e o próximo passo é olhá-lo — nunca
  // recontar a história. Só entra aqui quando o contrato confirmou entrega.
  if (leitura.estado === "CURADORIA_ENTREGUE" || leitura.estado === "CASO_CONCLUIDO") {
    return {
      kind: "action",
      action: {
        title: "Sua Curadoria está pronta",
        why: "As três opções foram escolhidas para o que você definiu como importante.",
        whatHappensNext: "Você pode ler com calma, quantas vezes quiser. Nada expira.",
        cta: { label: "Ver minha Curadoria", href: "/paciente/curadoria" },
        happensInConversation: false,
      },
    };
  }

  if (!jornada) {
    return {
      kind: "nothing",
      message: "Nada depende de você agora. Sua história já está com a Aliviar.",
      whatHappensNext: "Um Curador vai ler e procurar você para uma conversa.",
    };
  }

  // 2 — Com Case aberto, a jornada manda. A primeira etapa que aguarda ELA é
  // a pendência; qualquer etapa depois dessa é futuro, não cobrança.
  const waiting = jornada.stages.find((stage) => stage.status === "AGUARDANDO_VOCE");

  if (waiting) {
    return { kind: "action", action: buildStageAction(waiting, jornada) };
  }

  // 3 — Nada aguarda ela. A tela declara o silêncio e diz com quem está.
  const current = jornada.stages.find((stage) => stage.id === jornada.currentStage);
  return {
    kind: "nothing",
    message: `Nada depende de você agora. Seu caso está com ${jornada.currentResponsible.name}, ${jornada.currentResponsible.roleLabel}.`,
    whatHappensNext: current?.description ?? "A equipe segue com o seu caso.",
  };
}

function buildStageAction(
  stage: Jornada["stages"][number],
  jornada: Jornada,
): PatientNextAction {
  switch (stage.id) {
    case "PERFIL_DE_PRIORIDADES":
      return {
        title: "Precisamos que você reconheça suas prioridades como suas",
        why: "Sem essa confirmação nada avança — a comparação só existe depois que o critério é seu, e não nosso.",
        whatHappensNext:
          "Com o seu reconhecimento, começamos a analisar os profissionais da rede aprovada segundo o que você definiu.",
        // O ato tem liturgia: leitura em voz alta, evidência ao lado, pergunta
        // aberta. Um botão "confirmar" trairia isso.
        cta: null,
        happensInConversation: true,
      };

    case "REUNIAO":
      return {
        title: "Precisamos combinar a conversa em que você vai receber as opções",
        why: "As três opções são sempre apresentadas por uma pessoa — nunca por um documento que chega sozinho.",
        whatHappensNext: `${jornada.curatorName} explica o que diferencia cada caminho e responde suas dúvidas.`,
        cta: null,
        happensInConversation: true,
      };

    case "ESCOLHA":
      return {
        title: "A escolha é sua, no seu tempo",
        why: "Os três caminhos são legítimos e não há ordem de preferência entre eles. Não existe prazo.",
        whatHappensNext:
          "Assim que você decidir, cuidamos do agendamento e seguimos acompanhando você.",
        cta: { label: "Ver meus três caminhos", href: "/paciente/curadoria" },
        happensInConversation: false,
      };

    default:
      // Nunca inventar destino para uma etapa que ainda não tem um. Melhor
      // dizer com quem está do que oferecer um link que não resolve nada.
      return {
        title: stage.nextAction?.label ?? `${stage.label}: precisamos de você`,
        why: stage.description,
        whatHappensNext: `${stage.responsible} segue com o seu caso depois disso.`,
        cta: null,
        happensInConversation: true,
      };
  }
}

/**
 * O destino de cada etapa da régua, quando existe um.
 *
 * Uma etapa da linha do tempo só vira link quando há de fato onde chegar —
 * caixa clicável que abre uma tela sem relação com ela é pior que caixa
 * estática (UX_PRINCIPLES P2).
 */
export function patientStageHref(stageId: Jornada["stages"][number]["id"]): string | undefined {
  switch (stageId) {
    case "CONSULTA_INICIAL":
      return "/sua-historia";
    case "DOSSIE":
    case "ESCOLHA":
    case "ACOMPANHAMENTO":
      return "/paciente/curadoria";
    default:
      return undefined;
  }
}
