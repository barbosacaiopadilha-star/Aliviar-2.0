import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { changeCaseStatus, createCase } from "@/modules/cases/repository";
import { SupabaseConnectionRepository } from "@/modules/connection";
import { createConnection } from "@/modules/connection/commands";
import * as curadoria from "@/modules/curadoria/repository";
import * as reports from "@/modules/curadoria/report-repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { getOrCreateActiveStory, saveStoryDraft, submitStory } from "@/modules/story/repository";

import { createCuradoriaClient } from "../integration/curadoria-client";
import { seedPublishedProfessional } from "../integration/rede-fixture";
import { preencherMapaEBlocoRelacional } from "../e2e/apoio-mapa";

/**
 * B1R · A CURADORIA ENTREGUE, COMO FIXTURE COMPARTILHADA.
 *
 * Nasceu dentro de connection-choice.spec.ts, onde era função local. Foi
 * extraída sem mudar um fato: mesma cadeia canônica — Acolhimento, contexto,
 * critérios, Mapa, validação, seleção humana, Relatório, aprovação, emissão e
 * entrega. Nenhum protocolo do ACE participa, nenhum estado é inventado.
 *
 * Existe porque o portão de entrega da Curadoria precisava ser falseável, e
 * provar "entregue" contra "emitida" exige um cenário entregue DE VERDADE —
 * construir um por SQL provaria o SQL, não o caminho.
 *
 * Vive em tests/. Nada aqui é importado por src/.
 */

const envPath = path.resolve(__dirname, "../../.env.local");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  }
}

export function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// G1/ETAPA-2 (FS-04): o parecer da fixture carrega conteúdo real — o vazio
// silencioso era o defeito, nunca o payload "normal".
export const PONTOS_FAVORAVEIS_DO_PARECER = ["Acompanha casos como o dela ao longo do tempo."];

export type DeliveredFixture = {
  patientEmail: string;
  patientPassword: string;
  patientProfileId: string;
  /**
   * O administrador/curador sintético desta execução — âncora do cleanup.
   *
   * Ele era criado e nunca removido. Na suíte de INTEGRAÇÃO isso não aparecia:
   * `tests/integration/setup-limpeza.ts` restaura a baseline a cada arquivo e
   * absorvia a sobra. No E2E não existe esse guarda-chuva, e a conta ficava —
   * uma por fixture, 225 acumuladas quando a B3-CLEANUP-ADMIN mediu.
   */
  adminUserId: string;
  caseId: string;
  /** Os profissionais criados por ESTA execução — âncora do cleanup. */
  createdProfessionalIds: string[];
  /** A seleção humana que o Relatório materializa. */
  curatedSelectionId: string;
  /** Âncora canônica da entrega — `connection_records.curadoria_report_id`. */
  reportId: string;
  /** Os três que a Curadoria de fato entregou, com o nome que aparece na tela. */
  selectedProfessionals: Array<{ id: string; name: string }>;
  professionalDisplayNames: string[];
};

/**
 * B11-FIX-A · OS DOZE CORTES DA MATRIZ CR (contrato 36 §10.1).
 *
 * Cada corte é um estado que o produto **de fato** produz, e nasce pelo writer
 * real do seu ato. A fixture não inventa estágio: ela para onde o produto para.
 */
export const ESTAGIOS_CR = [
  "CR-01", "CR-02", "CR-03", "CR-04", "CR-05", "CR-06",
  "CR-07", "CR-08", "CR-09", "CR-10", "CR-11", "CR-12",
] as const;

export type EstagioCR = (typeof ESTAGIOS_CR)[number];

/**
 * A matriz nominal, declarada — não deduzida do código que a monta.
 *
 * `responsavel` e `grupoDaFila` são o que a B12-FILA vai verificar; ficam aqui
 * porque quem define o estágio é o fato, e o fato é declarado neste lugar.
 *
 * ⚠️ **`CR-04` diz "reconhecido POR ELA".** A lista que originou esta matriz
 * pedia "validação pelo Curador" — isso **não existe**: a ADR-042 removeu essa
 * porta, e quem reconhece o Perfil é a paciente. Nomear o Curador aqui
 * reintroduziria, em fixture, a autoridade que a ADR removeu.
 */
export const MATRIZ_CR: Record<
  EstagioCR,
  {
    cenario: string;
    ator: "paciente" | "curador";
    fato: string;
    atoDevido: string;
    responsavel: string;
    /** `null` = fora da Fila, por decisão do contrato §10.1. */
    grupoDaFila: string | null;
  }
> = {
  "CR-01": {
    cenario: "antes da Curadoria",
    ator: "curador",
    fato: "Case sem understanding_confirmed_at",
    atoDevido: "acolher",
    responsavel: "Curador",
    grupoDaFila: "Aguarda Acolhimento",
  },
  "CR-02": {
    cenario: "preparação do 1º encontro",
    ator: "curador",
    fato: "Mapa preparado, meeting_held_at is null",
    atoDevido: "realizar o primeiro encontro",
    responsavel: "Curador",
    grupoDaFila: "Aguarda o Primeiro Encontro",
  },
  "CR-03": {
    cenario: "1º encontro realizado",
    ator: "curador",
    fato: "meeting_held_at presente, validated_at is null",
    atoDevido: "aguardar o reconhecimento dela",
    responsavel: "a paciente",
    grupoDaFila: "Aguarda o reconhecimento dela",
  },
  "CR-04": {
    cenario: "Perfil reconhecido por ela",
    ator: "paciente",
    fato: "validated_at pela via real (acknowledge_priority_profile)",
    atoDevido: "analisar",
    responsavel: "Curador",
    grupoDaFila: "Curadoria em curso",
  },
  "CR-05": {
    cenario: "análise entre encontros",
    ator: "curador",
    fato: "seleção salva, Relatório não emitido",
    atoDevido: "concluir a análise",
    responsavel: "Curador",
    grupoDaFila: "Curadoria em curso",
  },
  "CR-06": {
    cenario: "Relatório emitido, não entregue",
    ator: "curador",
    fato: "emitted_at presente, delivered_at is null",
    atoDevido: "entregar",
    responsavel: "Curador",
    grupoDaFila: "Aguarda entrega",
  },
  "CR-07": {
    cenario: "entregue, sem decisão",
    ator: "curador",
    fato: "seleção entregue e Relatório marcado como entregue",
    atoDevido: "aguardar a decisão dela",
    responsavel: "a paciente",
    grupoDaFila: "Aguarda a decisão dela",
  },
  "CR-08": {
    cenario: "decisão CHOSEN",
    ator: "paciente",
    fato: "patient_curadoria_decisions com chosen_option_id",
    atoDevido: "acompanhar",
    responsavel: "Equipe Aliviar",
    grupoDaFila: "Com o Concierge",
  },
  "CR-09": {
    cenario: "decisão NONE_OF_THEM",
    ator: "paciente",
    fato: "patient_curadoria_decisions com chosen_option_id null",
    atoDevido: "acompanhar",
    responsavel: "Equipe Aliviar",
    grupoDaFila: "Com o Concierge",
  },
  "CR-10": {
    cenario: "acompanhamento aberto",
    ator: "paciente",
    fato: "connection_records para o Case",
    atoDevido: "acompanhar",
    responsavel: "Equipe Aliviar",
    grupoDaFila: "Com o Concierge",
  },
  "CR-11": {
    cenario: "encerrado sem entrega",
    ator: "curador",
    fato: "cases.closed_at / status CANCELLED",
    atoDevido: "nenhum",
    responsavel: "ninguém",
    grupoDaFila: null,
  },
  "CR-12": {
    cenario: "compatibilidade legada",
    ator: "curador",
    fato: "entrega do motor antigo, sem Curadoria estruturada",
    atoDevido: "nenhum",
    responsavel: "ninguém",
    grupoDaFila: null,
  },
};

/** O que existe desde o primeiro corte. */
type CasoBase = {
  patientEmail: string;
  patientPassword: string;
  patientProfileId: string;
  adminUserId: string;
  caseId: string;
  storyId: string;
  createdProfessionalIds: string[];
};

type ComPerfil = CasoBase & { priorityProfileId: string };
type ComSelecao = ComPerfil & {
  curatedSelectionId: string;
  selectedProfessionals: Array<{ id: string; name: string }>;
  professionalDisplayNames: string[];
};
type ComRelatorio = ComSelecao & { reportId: string };
type ComDecisao = ComRelatorio & { decisionId: string };

/**
 * A discriminação é do TIPO, não da disciplina: pedir `reportId` num caso de
 * CR-04 não compila, e `decisionId` só existe de CR-08 em diante. Sem isto, um
 * teste leria `undefined` e passaria comparando nada com nada.
 */
export type CasoSintetico =
  | ({ estagio: "CR-01" | "CR-11" } & CasoBase)
  | ({ estagio: "CR-02" | "CR-03" | "CR-04" } & ComPerfil)
  | ({ estagio: "CR-05" } & ComSelecao)
  | ({ estagio: "CR-06" | "CR-07" } & ComRelatorio)
  | ({ estagio: "CR-08" | "CR-09" } & ComDecisao)
  | ({ estagio: "CR-10" } & ComDecisao & { connectionId: string })
  | ({ estagio: "CR-12" } & CasoBase & { legadoDeliveryId: string });

async function seedPresentableProfessional(
  adminClient: ReturnType<typeof createAdminSupabaseClient>,
  adminUserId: string,
  displayName: string,
) {
  // B-2: a versão anterior criava o profissional SEM publicá-lo e a fixture
  // só passava porque a rede compartilhada carregava resíduo publicado de
  // outras execuções — com o banco recém-restaurado, zero elegíveis. A
  // fixture canônica percorre o caminho real de publicação (registro
  // consultado + área verificada + gatilho do banco), tornando o spec
  // autossuficiente.
  return seedPublishedProfessional(adminClient, adminUserId, displayName);
}

/**
 * B1R · `entregar: false` para o cenário EMITIDA E NÃO ENTREGUE.
 *
 * A cadeia é a mesma até a emissão; apenas os dois atos de ENTREGA não
 * acontecem. É estado legítimo do ciclo — o instante anterior à entrega —,
 * não um estado inventado para o teste passar. O padrão continua entregando,
 * e por isso o spec original não muda de comportamento.
 */
/**
 * B11-FIX-A · `estagio` é o parâmetro de corte da matriz CR.
 *
 * Sem ele, o comportamento é **exatamente** o de antes — cadeia completa até a
 * entrega, com `entregar`/`decidir`. Os seis consumidores existentes não mudam
 * de forma. Com ele, a montagem para no fato que define o estágio.
 */
export async function seedDeliveredCase(
  opcoes?: { entregar?: boolean; decidir?: "CHOSEN" | "NONE_OF_THEM" },
): Promise<DeliveredFixture>;
export async function seedDeliveredCase(
  opcoes: { entregar?: boolean; decidir?: "CHOSEN" | "NONE_OF_THEM"; estagio: EstagioCR },
): Promise<CasoSintetico>;
export async function seedDeliveredCase(
  opcoes: {
    entregar?: boolean;
    decidir?: "CHOSEN" | "NONE_OF_THEM";
    estagio?: EstagioCR;
  } = {},
): Promise<DeliveredFixture | CasoSintetico> {
  const estagio = opcoes.estagio;

  // CR-12 não nasce aqui: a entrega legada tem helper mantido próprio
  // (`legacy-ace-chain-fixture`), e duplicá-la nesta cadeia produziria uma
  // segunda implementação do motor antigo.
  if (estagio === "CR-12") {
    throw new Error(
      "CR-12 (compatibilidade legada) é montado por seedLegacyFinalCuradoriaDelivery — " +
        "ver tests/integration/legacy-ace-chain-fixture.ts.",
    );
  }
  /** Para antes de produzir o fato do próximo corte. */
  const pararEm = (ate: EstagioCR) =>
    estagio !== undefined && ESTAGIOS_CR.indexOf(estagio) <= ESTAGIOS_CR.indexOf(ate);
  const entregar = opcoes.entregar ?? true;
  const adminClient = createAdminSupabaseClient();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  const adminEmail = unique("connection-e2e-admin") + "@aliviar-conexao.local";
  const adminAuth = await adminClient.auth.admin.createUser({
    email: adminEmail,
    password: "senha-temporaria-123",
    email_confirm: true,
  });
  const adminUserId = adminAuth.data.user!.id;
  await adminClient.from("user_roles").insert({
    profile_id: adminUserId,
    role_id: (
      await adminClient
        .from("roles")
        .select("id")
        .eq("slug", "administrador")
        .single()
    ).data!.id,
  });
  // A Curadoria canônica exige um Curador responsável pelo Case. O mesmo
  // usuário acumula os dois papéis para manter a fixture com uma identidade só.
  await adminClient.from("user_roles").insert({
    profile_id: adminUserId,
    role_id: (
      await adminClient.from("roles").select("id").eq("slug", "curador_medico").single()
    ).data!.id,
  });

  const adminSessionClient = createCuradoriaClient(url, anonKey);
  await adminSessionClient.auth.signInWithPassword({
    email: adminEmail,
    password: "senha-temporaria-123",
  });

  const patientEmail =
    unique("connection-e2e-patient") + "@aliviar-conexao.local";
  const patientAccount = await createPatientAccount(
    adminClient,
    adminSessionClient,
    { email: patientEmail, displayName: "Paciente E2E Connection" },
    adminUserId,
  );

  const patientClient = createCuradoriaClient(url, anonKey);
  await patientClient.auth.signInWithPassword({
    email: patientEmail,
    password: patientAccount.password,
  });
  const draft = await getOrCreateActiveStory(
    patientClient,
    patientAccount.profileId,
  );
  await saveStoryDraft(
    patientClient,
    draft.id,
    draft.revision,
    { motivo: "Buscando apoio para ansiedade recorrente." },
    "motivo",
  );
  const refreshed = await getOrCreateActiveStory(
    patientClient,
    patientAccount.profileId,
  );
  await submitStory(patientClient, draft.id, refreshed.revision);

  const created = await createCase(
    adminSessionClient,
    draft.id,
    adminUserId,
    adminUserId,
  );
  await changeCaseStatus(
    adminSessionClient,
    created.id,
    "IN_REVIEW",
    adminUserId,
  );
  await changeCaseStatus(
    adminSessionClient,
    created.id,
    "READY_FOR_CURATION",
    adminUserId,
  );

  // Nomes únicos por execução: o E2E localiza o profissional pelo nome
  // acessível, e nomes fixos colidiam quando uma execução anterior deixava
  // resíduo — três registros distintos chamados "Ana E2E" fazem o localizador
  // resolver múltiplos rádios. Unicidade dá tolerância a interrupção; o
  // cleanup abaixo dá a higiene normal. Um não substitui o outro.
  const runId = unique("run");
  const createdProfessionalIds: string[] = [];
  for (const nome of ["Ana", "Bruno", "Carla"]) {
    createdProfessionalIds.push(
      await seedPresentableProfessional(
        adminClient,
        adminUserId,
        `${nome} E2E ${runId}`,
      ),
    );
  }

  // ENTREGA CANÔNICA — o mesmo caminho que as telas percorrem: Acolhimento,
  // contexto, critérios, validação, comparação, seleção humana, Relatório,
  // emissão e entrega. Nenhum protocolo do ACE participa.
  const cliente = adminSessionClient;

  const base = {
    patientEmail,
    patientPassword: patientAccount.password,
    patientProfileId: patientAccount.profileId,
    adminUserId,
    caseId: created.id,
    storyId: draft.id,
    createdProfessionalIds,
  };

  // CR-01 · o Case existe e ninguém acolheu ainda. CR-11 encerra a partir daqui.
  //
  // `estagio === "CR-11"` precisa ser explícito: `pararEm` compara POSIÇÃO na
  // lista, e CR-11 é o penúltimo — `pararEm("CR-01")` é `10 <= 0`, falso. Sem
  // esta cláusula o ramo era inalcançável, a cadeia inteira rodava, e o Case
  // nunca era encerrado. O teste mediu isso; o writer nunca chegou a ser
  // chamado.
  if (pararEm("CR-01") || estagio === "CR-11") {
    if (estagio === "CR-11") {
      // Pelo writer de transição, nunca por update direto: `changeCaseStatus`
      // é quem conhece a máquina de estados e recusa salto inválido. O update
      // que estava aqui simplesmente não pegou — o Case seguiu em
      // READY_FOR_CURATION e o teste mediu isso.
      //
      // Encerrar NÃO é Curadoria concluída: é o Caso que parou antes de
      // entregar, e por isso fica fora da Fila (contrato 36 §10.1).
      await changeCaseStatus(adminSessionClient, created.id, "CANCELLED", adminUserId);

      const { data, error } = await cliente
        .from("cases")
        .select("status, closed_at")
        .eq("id", created.id)
        .single();
      if (error) throw new Error(`Fixture CR-11: releitura do Case falhou — ${error.message}`);
      if (data?.status !== "CANCELLED") {
        throw new Error(`Fixture CR-11: o Case ficou em "${data?.status}", não em CANCELLED.`);
      }
      return { estagio: "CR-11", ...base };
    }
    return { estagio: "CR-01", ...base };
  }

  await cliente.from("consultation_records").insert({
    case_id: created.id,
    curator_id: adminUserId,
    context_reviewed: true,
    documents_reviewed: true,
    narrative: "Ela contou a história inteira, e eu devolvi organizada.",
    understanding_confirmed_at: new Date().toISOString(),
  });
  await cliente
    .from("case_clinical_context")
    .insert({ case_id: created.id, clinical_context: "Contexto clínico relatado por ela." });

  const priorityProfileId = await curadoria.createPriorityProfile(
    cliente,
    created.id,
    adminUserId,
  );
  await curadoria.addFilter(
    cliente,
    priorityProfileId,
    "FILTRO_OBRIGATORIO",
    "CUIDADO_CONTINUO",
    "true",
    "Ela quer alguém que acompanhe do começo ao fim.",
  );
  // B-2 (ADR-065): o banco só valida Perfil com Mapa completo, e o
  // reconhecimento exige o bloco relacional — estado legítimo via factory.
  await preencherMapaEBlocoRelacional(cliente, created.id, adminUserId);

  // CR-02 · Mapa preparado, e o primeiro encontro ainda não aconteceu.
  if (pararEm("CR-02")) return { estagio: "CR-02", ...base, priorityProfileId };

  // O fato mínimo do encontro realizado — `meeting_held_at`, entregue na D-9.
  // É do Curador, e é o único que ele registra nesta faixa.
  {
    const { data, error } = await cliente
      .from("consultation_records")
      .update({ meeting_held_at: new Date().toISOString() })
      .eq("case_id", created.id)
      .select("id");
    if (error) throw new Error(`Fixture: registrar o encontro falhou — ${error.message}`);
    if ((data ?? []).length === 0) {
      throw new Error("Fixture: nenhum consultation_record recebeu meeting_held_at.");
    }
  }

  // CR-03 · o Mapa está pronto e aguarda **o reconhecimento dela**. O Curador
  // vê, e não age: a autoridade é dela.
  if (pararEm("CR-03")) return { estagio: "CR-03", ...base, priorityProfileId };

  // ────────────────────────────────────────────────────────────────────────
  // O RECONHECIMENTO — ato DELA, pelo writer real.
  //
  // Aqui morava o defeito: `fixtureValidarPerfil` escrevia `VALIDATED` direto
  // em `priority_profiles`, com a SESSÃO DO CURADOR. Isso reintroduzia, em
  // fixture, a autoridade que a ADR-042 removeu — e produzia um Perfil
  // reconhecido sem que ninguém tivesse reconhecido nada.
  //
  // A via oficial é `acknowledge_priority_profile`, com gate
  // `is_patient_for_case`: só a paciente atravessa. O retorno é LIDO, e a
  // releitura confirma o fato — RPC que devolve 'NAO_AUTORIZADO' sem erro
  // passaria despercebida.
  // ────────────────────────────────────────────────────────────────────────
  {
    const { data: desfecho, error } = await patientClient.rpc("acknowledge_priority_profile", {
      _case_id: created.id,
    });
    if (error) throw new Error(`Fixture: o reconhecimento dela falhou — ${error.message}`);
    // O RPC devolve RECONHECIDO no sucesso; VALIDATED é o status da TABELA.
    // Confundir os dois faria o oráculo recusar o caminho certo.
    if (desfecho !== "RECONHECIDO") {
      throw new Error(
        `Fixture: acknowledge_priority_profile devolveu "${desfecho}" — o Perfil não foi reconhecido por ela.`,
      );
    }

    const { data: perfil } = await cliente
      .from("priority_profiles")
      .select("status, validated_at")
      .eq("id", priorityProfileId)
      .single();
    if (perfil?.status !== "VALIDATED" || !perfil?.validated_at) {
      throw new Error("Fixture: o Perfil não ficou reconhecido depois do ato dela.");
    }
  }

  // CR-04 · Perfil reconhecido POR ELA. A análise pode começar.
  if (pararEm("CR-04")) return { estagio: "CR-04", ...base, priorityProfileId };

  // B-2: os três são os que ESTA execução semeou e publicou. A versão
  // anterior tomava 3 publicados quaisquer da rede compartilhada — com
  // specs concorrentes, a seleção referenciava profissionais de OUTRO spec
  // e o cleanup de lá quebrava com FK em curated_selection_options.
  const tres = createdProfessionalIds.map((id) => ({ professionalId: id }));
  if (tres.length < 3) {
    throw new Error("Fixture E2E: a rede local não tem três profissionais elegíveis.");
  }

  // Nomes pela fonte canônica — as análises não carregam mais display name.
  const { data: nomesRows } = await cliente
    .from("professional_profiles")
    .select("id, display_name")
    .in("id", tres.map((a) => a.professionalId));
  const nomeDe = new Map((nomesRows ?? []).map((row) => [row.id as string, row.display_name as string]));

  await curadoria.saveSelection(
    cliente,
    created.id,
    priorityProfileId,
    adminUserId,
    "Os três cobrem experiência e continuidade de formas diferentes.",
    tres.map((a) => ({
      professionalProfileId: a.professionalId,
      rationale: "Entra porque atende o que ela pediu.",
      tradeOff: "Agenda mais concorrida.",
    })),
  );
  const selection = await curadoria.getSelection(cliente, priorityProfileId);

  const comSelecao = {
    ...base,
    priorityProfileId,
    curatedSelectionId: selection!.id,
    selectedProfessionals: tres.map((a) => ({
      id: a.professionalId,
      name: nomeDe.get(a.professionalId) ?? "Profissional",
    })),
    professionalDisplayNames: tres.map((a) => nomeDe.get(a.professionalId) ?? "Profissional"),
  };

  // CR-05 · a seleção está salva e a análise ainda não virou Relatório emitido.
  if (pararEm("CR-05")) return { estagio: "CR-05", ...comSelecao };

  await reports.saveReport(
    cliente,
    created.id,
    selection!.id,
    "Os três cobrem experiência e continuidade de formas diferentes.",
    tres.map((a) => ({
      professionalProfileId: a.professionalId,
      justification: "Responde ao critério que ela nomeou.",
      relationToWeights: "Cobre experiência, que ela pesou mais.",
      attentionPoints: ["Agenda mais concorrida."],
      // G1/ETAPA-2: oráculo anterior certificava o defeito FS-04 (favorablePoints: []
      // replicado como payload normal — consertar o apagamento não quebraria teste
      // algum); novo oráculo exige o comportamento da ADR-064 (conteúdo do parecer
      // sobrevive ao round-trip, sem perda silenciosa); correção do defeito no Bloco D.
      favorablePoints: PONTOS_FAVORAVEIS_DO_PARECER,
      suggestedQuestions: ["Quantos casos como o meu você acompanha por ano?"],
      curatorObservations: null,
    })),
  );
  const report = await reports.getReportBySelection(cliente, selection!.id);
  // G1/ETAPA-2 (FS-04/ADR-064): prova de round-trip na leitura de volta que o
  // teste já fazia — o conteúdo salvo precisa existir intacto no banco.
  const { data: opcoesRoundTrip } = await cliente
    .from("curadoria_report_options")
    .select("favorable_points")
    .eq("report_id", report!.id);
  if ((opcoesRoundTrip ?? []).length !== 3) {
    throw new Error("Fixture: o Relatorio deveria ter 3 opcoes.");
  }
  for (const opcao of opcoesRoundTrip ?? []) {
    // FS-04/ADR-064: o conteudo do parecer precisa sobreviver ao round-trip.
    // Mesma checagem do spec original — so deixou de depender do `expect` do
    // Playwright, para o helper servir aos dois runners.
    if (JSON.stringify(opcao.favorable_points) !== JSON.stringify(PONTOS_FAVORAVEIS_DO_PARECER)) {
      throw new Error("Fixture: favorable_points nao sobreviveu ao round-trip (FS-04).");
    }
  }
  // Emitir exige aprovação prévia — o Curador assume a autoria da versão final.
    await reports.approveReport(cliente, report!.id, adminUserId);
    await reports.emitReport(cliente, report!.id);

  const comRelatorio = { ...comSelecao, reportId: report!.id };

  // CR-06 · emitido, e ainda não entregue.
  if (pararEm("CR-06")) return { estagio: "CR-06", ...comRelatorio };

  if (entregar) {
    await curadoria.deliverSelection(cliente, selection!.id);
    await reports.markReportDelivered(cliente, report!.id);
  }

  // CR-07 · entregue, e a decisão é dela — ainda não tomada.
  if (pararEm("CR-07")) return { estagio: "CR-07", ...comRelatorio };

  // B3-RI · o fluxo canônico registra a decisão ANTES da conexão. A fixture
  // acompanha o produto: quem quiser o cenário pós-decisão pede `decidir`, e
  // o fato entra pelo writer real, nunca pelo DOM nem por connection_records.
  // CR-08/09/10 pedem a decisão pelo caminho dela; quem passou `decidir`
  // continua mandando como antes.
  const desfechoDoEstagio =
    estagio === "CR-08" || estagio === "CR-10"
      ? ("CHOSEN" as const)
      : estagio === "CR-09"
        ? ("NONE_OF_THEM" as const)
        : opcoes.decidir;

  if (entregar && desfechoDoEstagio) {
    // A FK de `chosen_option_id` aponta para `curated_selection_options` — a
    // seleção humana —, não para as opções do Relatório. O contrato 27 §F já
    // dizia "chave: curated_selection_options.id"; usei a tabela errada e a
    // FK recusou.
    // A opção é localizada pelo PROFISSIONAL, nunca por posição: esta consulta
    // não tem `order by`, e o Postgres não garante ordem — pegar `[0]` fazia a
    // pessoa decidida variar entre execuções e não corresponder a
    // `selectedProfessionals[0]`, que é por onde os testes a encontram.
    const { data: opcoesDaSelecao } = await cliente
      .from("curated_selection_options")
      .select("id, professional_profile_id")
      .eq("curated_selection_id", selection!.id);

    const opcaoDecidida = (opcoesDaSelecao ?? []).find(
      (o) => o.professional_profile_id === tres[0]!.professionalId,
    );
    if (!opcaoDecidida) {
      throw new Error("Fixture: opção do primeiro profissional não encontrada na seleção.");
    }

    const pacienteCliente = createCuradoriaClient(url, anonKey);
    await pacienteCliente.auth.signInWithPassword({
      email: patientEmail,
      password: patientAccount.password,
    });
    // A decisão entra pela SESSÃO DELA, sob RLS — nunca por service role. Não
    // há writer público invocável de teste (a action é Server Action do Next),
    // e este é o precedente mantido mais próximo: o mesmo caminho que a tela
    // percorre, com a mesma autoridade.
    const { data: decisaoGravada, error: erroDecisao } = await pacienteCliente
      .from("patient_curadoria_decisions")
      .insert({
        case_id: created.id,
        curated_selection_id: selection!.id,
        outcome: desfechoDoEstagio,
        chosen_option_id: desfechoDoEstagio === "CHOSEN" ? opcaoDecidida.id : null,
      })
      .select("id")
      .single();
    if (erroDecisao) throw new Error(`Fixture: decisao nao registrada: ${erroDecisao.message}`);

    if (estagio === "CR-08" || estagio === "CR-09") {
      return { estagio, ...comRelatorio, decisionId: decisaoGravada!.id as string };
    }

    // CR-10 · o acompanhamento aberto. A Connection é continuidade, nunca o
    // fato da decisão — e ela nasce DEPOIS, como no produto.
    if (estagio === "CR-10") {
      // Pelo caminho canônico: o comando puro monta o rascunho e o repositório
      // chama `create_connection_from_report`, que deriva Case e paciente do
      // PRÓPRIO Relatório e é idempotente. Inserir em `connection_records` à
      // mão pularia a âncora e o evento — e foi o que a primeira tentativa
      // fez, até `decided_at NOT NULL` recusar.
      const agora = new Date().toISOString();
      const { record, event } = createConnection(
        {
          caseId: created.id,
          anchor: { source: "METODO", reportId: report!.id },
          patientProfileId: patientAccount.profileId,
          professionalProfileId: tres[0]!.professionalId,
          actorId: patientAccount.profileId,
          occurredAt: agora,
          recordedAt: agora,
        },
        { eligibleProfessionalProfileIds: tres.map((a) => a.professionalId) },
      );
      const conexao = await new SupabaseConnectionRepository(pacienteCliente).create(
        record,
        event,
      );
      return {
        estagio: "CR-10",
        ...comRelatorio,
        decisionId: decisaoGravada!.id as string,
        connectionId: conexao.id,
      };
    }
  }

  return {
    patientEmail,
    patientPassword: patientAccount.password,
    patientProfileId: patientAccount.profileId,
    adminUserId,
    caseId: created.id,
    reportId: report!.id,
    curatedSelectionId: selection!.id,
    createdProfessionalIds,
    selectedProfessionals: tres.map((a) => ({
      id: a.professionalId,
      name: nomeDe.get(a.professionalId) ?? "Profissional",
    })),
    professionalDisplayNames: tres.map((a) => nomeDe.get(a.professionalId) ?? "Profissional"),
  };
}

/**
 * Remove POR INTEIRO um paciente sintético — e prova que removeu.
 *
 * A versão anterior confiava em `auth.admin.deleteUser` para cascatear
 * `auth.users → curadoria.profiles → cases`. A cascata existe (`profiles_id_fkey`
 * é ON DELETE CASCADE), mas `deleteUser` NUNCA chegava a executá-la: ~60 chaves
 * estrangeiras apontam para `curadoria.profiles` sem cascade, e três delas são
 * criadas pela própria fixture — `patient_stories.created_by`,
 * `patient_story_versions.created_by` e `crm_contacts.patient_profile_id`. O
 * GoTrue devolvia 500 (SQLSTATE 23503) e ninguém lia:
 *
 *   cleanupFixture  → o erro do `deleteUser` era descartado sem checagem;
 *   H4 (e2e legado) → `.catch(() => undefined)` engolia o mesmo 500.
 *
 * Resultado medido na B3-CLEANUP: 10 Cases e centenas de contas sintéticas
 * acumuladas no banco local, sem que nenhum teste ficasse vermelho.
 *
 * A ordem abaixo não é estilo — é a topologia real das FKs:
 *
 *   1. `connection_events` sai antes das `connection_records` que os contêm;
 *   2. o **Case** é a porta de saída de quase toda a cadeia (39 FKs apontam
 *      para ele, quase todas em cascade) e precisa sair ANTES da história,
 *      porque `cases.source_story_id` NÃO cascateia;
 *   3. `patient_stories` leva junto as `patient_story_versions` (cascade);
 *   4. `crm_contacts` prende o perfil e não cascateia;
 *   5. só então o perfil, os papéis e a conta.
 *
 * Cada passo lê o próprio erro, e o Case esperado é EXIGIDO: zero linhas
 * afetadas passa a ser falha, nunca silêncio.
 */
export async function removerPacienteSintetico(
  adminClient: ReturnType<typeof createAdminSupabaseClient>,
  profileId: string,
  caseIdEsperado?: string,
): Promise<{ casesRemovidos: string[] }> {
  const conexoes = await exigirSucesso(
    "ler connection_records",
    adminClient.from("connection_records").select("id").eq("patient_profile_id", profileId),
  );
  for (const conexao of (conexoes ?? []) as Array<{ id: string }>) {
    await exigirSucesso(
      "apagar connection_events",
      adminClient.from("connection_events").delete().eq("connection_id", conexao.id).select(),
    );
  }

  const removidos = (await exigirSucesso(
    "apagar cases",
    adminClient.from("cases").delete().eq("patient_profile_id", profileId).select("id"),
  )) as Array<{ id: string }> | null;
  const casesRemovidos = (removidos ?? []).map((c) => c.id);

  if (caseIdEsperado && !casesRemovidos.includes(caseIdEsperado)) {
    throw new Error(
      `o Case ${caseIdEsperado} não saiu do banco: o DELETE afetou ${casesRemovidos.length} linha(s) ` +
        `(${casesRemovidos.join(", ") || "nenhuma"}). Sem isto, o perfil seria removido e o Case ficaria órfão.`,
    );
  }

  await exigirSucesso(
    "apagar patient_stories",
    adminClient.from("patient_stories").delete().eq("profile_id", profileId).select(),
  );
  await exigirSucesso(
    "apagar crm_contacts",
    adminClient.from("crm_contacts").delete().eq("patient_profile_id", profileId).select(),
  );
  await exigirSucesso(
    "apagar patient_profiles",
    adminClient.from("patient_profiles").delete().eq("profile_id", profileId).select(),
  );
  await removerContaSintetica(adminClient, profileId);

  return { casesRemovidos };
}

/**
 * Apaga uma conta sintética que já não tem fato material preso a ela.
 *
 * `user_roles` sai ANTES da conta, e não é detalhe de ordem: apagar
 * `auth.users` cascateia até `curadoria.profiles` e daí até `user_roles`, cujo
 * trigger `log_user_role_change()` grava auditoria com `old.profile_id` — com
 * o perfil já removido no mesmo comando, a gravação viola
 * `audit_logs_target_profile_id_fkey` (23503) e derruba a transação inteira.
 * Foi assim que a remoção dos Cases órfãos abortou na B3-CLEANUP.
 *
 * O erro do `deleteUser` é LIDO. Era ele que ficava invisível.
 */
export async function removerContaSintetica(
  adminClient: ReturnType<typeof createAdminSupabaseClient>,
  profileId: string,
): Promise<void> {
  await exigirSucesso(
    "apagar user_roles",
    adminClient.from("user_roles").delete().eq("profile_id", profileId).select(),
  );

  const { error } = await adminClient.auth.admin.deleteUser(profileId);
  if (error) {
    throw new Error(
      `apagar a conta sintética ${profileId} falhou (${error.status ?? "?"}): ${error.message}. ` +
        "Alguma tabela ainda referencia curadoria.profiles sem cascade — veja o log do supabase_auth.",
    );
  }
}

/** Lê o `.error` de cada operação: silêncio deixou de ser resultado aceitável. */
async function exigirSucesso<T>(
  rotulo: string,
  operacao: PromiseLike<{ data: T | null; error: { message: string } | null }>,
): Promise<T | null> {
  const { data, error } = await operacao;
  if (error) {
    throw new Error(`limpeza da fixture — ${rotulo}: ${error.message}`);
  }
  return data;
}

export async function cleanupFixture(fixture: DeliveredFixture | undefined) {
  // A preparação pode ter falhado antes de produzir a fixture. Sem esta
  // guarda, o cleanup lança um TypeError que aparece no relatório NO LUGAR do
  // erro real — foi assim que "papel não encontrado" ficou escondido atrás de
  // "Cannot read properties of undefined".
  if (!fixture) return;

  const adminClient = createAdminSupabaseClient();

  // Profissionais SEMPRE por último, e só depois que o Case tiver saído: a
  // Curadoria canônica grava `curated_selection_options` e
  // `curadoria_report_options` com FK para `professional_profiles`. Inverter a
  // ordem faz o DELETE falhar por FK — silenciosamente, se o erro não for lido.
  const removerProfissionais = async () => {
    const ids = fixture.createdProfessionalIds ?? [];
    if (ids.length === 0) return;

    await adminClient
      .from("professional_competency_areas")
      .delete()
      .in("professional_profile_id", ids);
    const { error } = await adminClient.from("professional_profiles").delete().in("id", ids);
    if (error) {
      throw new Error(`Falha ao remover profissionais da fixture: ${error.message}`);
    }
  };

  // Fixture parcial: o paciente pode nem ter sido criado. Os profissionais que
  // já existem precisam sair mesmo assim, senão uma preparação interrompida
  // deixa resíduo — e resíduo com nome colidente foi o que travou este spec.
  // O admin/curador da fixture só pode sair DEPOIS do Case e dos profissionais:
  // ele é `created_by` de ambos, e nenhuma dessas FKs cascateia. `audit_logs`
  // permanece — `actor_id` é ON DELETE SET NULL, então a trilha não é apagada,
  // só deixa de apontar para uma conta que não existe mais.
  const removerAdmin = async () => {
    if (!fixture.adminUserId) return;
    await removerContaSintetica(adminClient, fixture.adminUserId);
  };

  if (!fixture.patientProfileId) {
    await removerProfissionais();
    await removerAdmin();
    return;
  }

  await removerPacienteSintetico(adminClient, fixture.patientProfileId, fixture.caseId);

  await removerProfissionais();
  await removerAdmin();
}
