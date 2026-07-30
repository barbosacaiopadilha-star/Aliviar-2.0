/**
 * POLÍTICA DE FONTES E VERIFICAÇÃO
 *
 * Encontrar uma informação não é o mesmo que verificá-la.
 *
 * Esta é a frase inteira do módulo. Tudo aqui existe para que ela continue
 * verdadeira depois de trinta cadastros feitos com pressa, num dia em que
 * falta profissional na Rede e o caso está esperando.
 *
 * O que o sistema faz: organiza, classifica a fonte, diz o que ela consegue
 * sustentar, e recusa marcar `verificado` quando não pode.
 *
 * O que o sistema não faz: concluir. Nenhuma função aqui devolve
 * `verificado`. Esse estado só existe como resultado de uma pessoa autorizada
 * olhar a fonte e assinar — e o banco recusa gravá-lo sem fonte, data e
 * autor.
 */

// ---------------------------------------------------------------------------
// Fontes
// ---------------------------------------------------------------------------

export const SOURCE_TIERS = [
  "OFICIAL_PRIMARIA",
  "INSTITUCIONAL",
  "PUBLICA_SECUNDARIA",
  "INADEQUADA",
] as const;
export type SourceTier = (typeof SOURCE_TIERS)[number];

export const SOURCE_TIER_LABELS: Record<SourceTier, string> = {
  OFICIAL_PRIMARIA: "Fonte oficial primária",
  INSTITUCIONAL: "Fonte institucional do profissional",
  PUBLICA_SECUNDARIA: "Fonte pública secundária",
  INADEQUADA: "Não serve como prova isolada",
};

export const SOURCE_TIER_EXAMPLES: Record<SourceTier, readonly string[]> = {
  OFICIAL_PRIMARIA: [
    "Conselho profissional",
    "Instituição de ensino",
    "Hospital ou instituição empregadora",
    "Órgão público",
    "Documento oficial fornecido pelo profissional",
    "Certificado verificável",
  ],
  INSTITUCIONAL: [
    "Site oficial da clínica",
    "Perfil institucional no hospital",
    "Currículo fornecido pelo profissional",
    "Entrevista estruturada com o profissional ou sua equipe",
  ],
  PUBLICA_SECUNDARIA: [
    "Diretórios profissionais",
    "Páginas de congressos",
    "Publicações e bases bibliográficas",
    "Notícias institucionais",
    "Páginas de associações",
  ],
  INADEQUADA: [
    "Redes sociais pessoais",
    "Avaliações e comentários de pacientes",
    "Fóruns e anúncios",
    "Agregadores sem origem",
    "Resultado de busca sem abrir a fonte",
    "Texto gerado por inteligência artificial ou resumo automático",
    "Cópia de outro cadastro sem proveniência",
  ],
};

/** Ordem de autoridade. Maior número sustenta tudo que o menor sustenta. */
const TIER_RANK: Record<SourceTier, number> = {
  INADEQUADA: 0,
  PUBLICA_SECUNDARIA: 1,
  INSTITUCIONAL: 2,
  OFICIAL_PRIMARIA: 3,
};

// ---------------------------------------------------------------------------
// Matriz: fonte × informação
// ---------------------------------------------------------------------------

export const INFORMATION_KINDS = [
  "REGISTRO_PROFISSIONAL",
  "SITUACAO_DO_REGISTRO",
  "GRADUACAO",
  "RESIDENCIA",
  "ESPECIALIZACAO",
  "FELLOWSHIP",
  "VINCULO_INSTITUCIONAL",
  "AREA_DE_ATUACAO",
  "EXPERIENCIA_EM_TIPO_DE_CASO",
  "LOCAL_DE_ATENDIMENTO",
  "ATENDIMENTO_ONLINE",
  "CUIDADO_CONTINUO",
  "DISPONIBILIDADE",
  "IDIOMAS",
  "ACESSIBILIDADE",
] as const;
export type InformationKind = (typeof INFORMATION_KINDS)[number];

export type InformationPolicy = {
  label: string;
  /** Nível mínimo de fonte que pode sustentar esta informação. */
  minimumTier: SourceTier;
  /** Estabilidade no tempo — define quando a verificação vence. */
  volatility: "ESTAVEL" | "VOLATIL";
  /** Por que a fonte mínima é essa. Aparece para quem cadastra. */
  note: string;
};

/**
 * Nenhuma linha tem "verificável automaticamente". A coluna não existe porque
 * a resposta seria `false` em todas — e uma coluna constante é um convite
 * para alguém, um dia, escrever `true` numa delas.
 */
export const SOURCE_MATRIX: Record<InformationKind, InformationPolicy> = {
  REGISTRO_PROFISSIONAL: {
    label: "CRM e UF",
    minimumTier: "OFICIAL_PRIMARIA",
    volatility: "VOLATIL",
    note: "Só o conselho profissional confirma. Um número digitado no cadastro não é um número conferido.",
  },
  SITUACAO_DO_REGISTRO: {
    label: "Situação do registro",
    minimumTier: "OFICIAL_PRIMARIA",
    volatility: "VOLATIL",
    note: "Exige o resultado da consulta e a data em que foi feita — situação muda.",
  },
  GRADUACAO: {
    label: "Graduação",
    minimumTier: "OFICIAL_PRIMARIA",
    volatility: "ESTAVEL",
    note: "Instituição de ensino ou documento oficial.",
  },
  RESIDENCIA: {
    label: "Residência",
    minimumTier: "OFICIAL_PRIMARIA",
    volatility: "ESTAVEL",
    note: "Instituição ou documento oficial. Currículo declarado não basta.",
  },
  ESPECIALIZACAO: {
    label: "Especialização",
    minimumTier: "OFICIAL_PRIMARIA",
    volatility: "ESTAVEL",
    note: "Instituição ou certificado verificável.",
  },
  FELLOWSHIP: {
    label: "Fellowship",
    minimumTier: "OFICIAL_PRIMARIA",
    volatility: "ESTAVEL",
    note: "Instituição ou documento verificável. É o título que mais gera divergência entre o declarado e o confirmado.",
  },
  VINCULO_INSTITUCIONAL: {
    label: "Vínculo institucional",
    minimumTier: "OFICIAL_PRIMARIA",
    volatility: "VOLATIL",
    note: "A instituição confirma. Vínculos terminam sem aviso.",
  },
  AREA_DE_ATUACAO: {
    label: "Área de atuação",
    minimumTier: "INSTITUCIONAL",
    volatility: "VOLATIL",
    note: "O profissional ou a clínica declaram. A especialidade registrada no conselho não responde qual é a atuação de hoje.",
  },
  EXPERIENCIA_EM_TIPO_DE_CASO: {
    label: "Experiência em determinado tipo de caso",
    minimumTier: "INSTITUCIONAL",
    volatility: "VOLATIL",
    note: "Declaração com evidência profissional. Nenhuma fonte oficial comprova volume ou prática.",
  },
  LOCAL_DE_ATENDIMENTO: {
    label: "Local de atendimento",
    minimumTier: "INSTITUCIONAL",
    volatility: "VOLATIL",
    note: "Clínica ou profissional. Endereço de dois anos atrás é ficção sobre o presente.",
  },
  ATENDIMENTO_ONLINE: {
    label: "Atendimento online",
    minimumTier: "INSTITUCIONAL",
    volatility: "VOLATIL",
    note: "Clínica ou profissional declaram.",
  },
  CUIDADO_CONTINUO: {
    label: "Cuidado contínuo",
    minimumTier: "INSTITUCIONAL",
    volatility: "VOLATIL",
    note: "Entrevista ou descrição operacional explícita. Ter consultório não diz nada sobre acompanhar alguém ao longo do tratamento.",
  },
  DISPONIBILIDADE: {
    label: "Disponibilidade",
    minimumTier: "INSTITUCIONAL",
    volatility: "VOLATIL",
    note: "Muda toda semana. Verificação com validade curta.",
  },
  IDIOMAS: {
    label: "Idiomas",
    minimumTier: "INSTITUCIONAL",
    volatility: "ESTAVEL",
    note: "Profissional ou instituição.",
  },
  ACESSIBILIDADE: {
    label: "Acessibilidade",
    minimumTier: "INSTITUCIONAL",
    volatility: "VOLATIL",
    note: "Clínica ou verificação operacional. Rampa prometida e rampa existente não são a mesma coisa.",
  },
};

/** A fonte alcança o que esta informação exige? */
export function sourceCanSustain(kind: InformationKind, tier: SourceTier): boolean {
  return TIER_RANK[tier] >= TIER_RANK[SOURCE_MATRIX[kind].minimumTier];
}

// ---------------------------------------------------------------------------
// O que uma fonte permite concluir
// ---------------------------------------------------------------------------

export const VERIFICATION_STATES = [
  "nao_verificado",
  "verificado",
  "divergente",
  "nao_localizado",
  "desatualizado",
] as const;
export type VerificationState = (typeof VERIFICATION_STATES)[number];

export const VERIFICATION_STATE_LABELS: Record<VerificationState, string> = {
  nao_verificado: "Não verificado",
  verificado: "Verificado",
  divergente: "Divergente",
  nao_localizado: "Não localizado",
  desatualizado: "Desatualizado",
};

export type SourceEvidence = {
  kind: InformationKind;
  tier: SourceTier;
  /** Onde se olhou. Sem isto, nada pode ser verificado. */
  reference: string | null;
  /** O que a fonte diz. `null` quando se procurou e não se achou. */
  foundValue: string | null;
  /** O que o cadastro diz. */
  declaredValue: string;
};

export type SourceAssessment = {
  /** O estado que esta evidência PERMITE. Nunca `verificado` sozinho. */
  eligibleState: Exclude<VerificationState, "desatualizado">;
  /** `verificado` está ao alcance de uma pessoa autorizada? */
  allowsVerification: boolean;
  reason: string;
};

// ---------------------------------------------------------------------------
// Evidência sintética
// ---------------------------------------------------------------------------

/**
 * Domínios reservados pela IETF (RFC 2606/6761) e o prefixo de registro que a
 * fixture de certificação usa. Nada aqui pode sustentar um cadastro real —
 * são endereços que, por definição, não pertencem a ninguém.
 */
const SYNTHETIC_MARKERS = ["example.com", "example.org", "example.net", "example.test", "CRM-TEST-"];

export function isSyntheticEvidence(value: string | null | undefined): boolean {
  if (!value) return false;
  const lower = value.toLowerCase();
  return SYNTHETIC_MARKERS.some((marker) => lower.includes(marker.toLowerCase()));
}

export type AssessOptions = {
  /**
   * Modo de certificação. Só o ambiente de teste liga isto, e ligá-lo não
   * afrouxa nada além de aceitar evidência declaradamente sintética — a
   * matriz, a autoridade e a exigência de proveniência continuam valendo.
   */
  certification?: boolean;
};

/**
 * Classifica uma evidência. O nome é `assess`, não `verify`, e a diferença é
 * o módulo inteiro: o retorno diz o que a evidência **permite**, e quem
 * conclui é uma pessoa.
 *
 * O melhor resultado possível aqui é `allowsVerification: true` sobre o estado
 * `nao_verificado` — "pode ser verificado por alguém", não "está verificado".
 */
export function assessSource(evidence: SourceEvidence, options?: AssessOptions): SourceAssessment {
  const policy = SOURCE_MATRIX[evidence.kind];

  // Antes de qualquer outra coisa: a evidência é de brinquedo? Fora do modo de
  // certificação isto não é uma fonte fraca, é uma fonte que não existe.
  if (isSyntheticEvidence(evidence.reference) && !options?.certification) {
    return {
      eligibleState: "nao_verificado",
      allowsVerification: false,
      reason:
        "Esta é uma referência sintética (domínio reservado ou registro de teste). Serve à certificação automatizada, nunca a um cadastro real.",
    };
  }

  if (evidence.tier === "INADEQUADA") {
    return {
      eligibleState: "nao_verificado",
      allowsVerification: false,
      reason:
        "Esta fonte pode indicar o que investigar, nunca confirmar o fato. Serve como pista, não como prova.",
    };
  }

  if (!sourceCanSustain(evidence.kind, evidence.tier)) {
    return {
      eligibleState: "nao_verificado",
      allowsVerification: false,
      reason: `${policy.label} exige ${SOURCE_TIER_LABELS[policy.minimumTier].toLowerCase()}. ${policy.note}`,
    };
  }

  if (!evidence.reference || evidence.reference.trim() === "") {
    return {
      eligibleState: "nao_verificado",
      allowsVerification: false,
      reason: "Sem registrar onde se olhou, não há o que conferir depois.",
    };
  }

  if (evidence.foundValue === null) {
    return {
      eligibleState: "nao_localizado",
      allowsVerification: false,
      // A frase existe para ser lida por quem for tentado a concluir o
      // contrário num dia de pressa.
      reason: "Procurou-se em fonte adequada e não se encontrou. Isso não significa que seja falso.",
    };
  }

  if (!equivalent(evidence.foundValue, evidence.declaredValue)) {
    return {
      eligibleState: "divergente",
      allowsVerification: false,
      reason: `A fonte diz "${evidence.foundValue}" e o cadastro diz "${evidence.declaredValue}". As duas versões ficam registradas até alguém resolver.`,
    };
  }

  return {
    eligibleState: "nao_verificado",
    allowsVerification: true,
    reason: `Fonte adequada e coincidente com o cadastro. Falta a confirmação de quem tem autoridade para assinar.`,
  };
}

/** Comparação conservadora: na dúvida, é divergência. */
function equivalent(a: string, b: string): boolean {
  const normal = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  return normal(a) === normal(b);
}

// ---------------------------------------------------------------------------
// Quem pode verificar o quê
// ---------------------------------------------------------------------------

export const VERIFYING_ROLES = ["administrador"] as const;

/**
 * Verificar é um ato administrativo, não clínico.
 *
 * O Curador julga o dossiê — se aquela formação responde a este caso — e essa
 * é a autoridade dele sob a ADR-035. Mas conferir se o diploma existe é outra
 * coisa, e concentrar as duas na mesma pessoa faria quem avalia também
 * atestar. Atendente e Concierge registram e anexam fonte; não assinam.
 */
export function canVerify(roles: string[]): boolean {
  return roles.some((role) => (VERIFYING_ROLES as readonly string[]).includes(role));
}

export type VerificationAttempt = {
  roles: string[];
  source: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  assessment: SourceAssessment;
};

export type VerificationRefusal = { allowed: false; reason: string };
export type VerificationApproval = { allowed: true };

/**
 * A porta final antes de gravar `verificado`. O banco também recusa; isto
 * existe para a recusa chegar em português a quem clicou, e para que a razão
 * seja específica — "falta a fonte" ajuda, "erro de constraint" não.
 */
export function mayMarkVerified(attempt: VerificationAttempt): VerificationApproval | VerificationRefusal {
  if (!canVerify(attempt.roles)) {
    return {
      allowed: false,
      reason: "Verificar cadastro é ato do Administrador. Registre a informação e a fonte, e encaminhe para revisão.",
    };
  }
  if (!attempt.assessment.allowsVerification) {
    return { allowed: false, reason: attempt.assessment.reason };
  }
  if (!attempt.source || attempt.source.trim() === "") {
    return { allowed: false, reason: "Toda verificação registra a fonte consultada." };
  }
  if (!attempt.verifiedBy) {
    return { allowed: false, reason: "Toda verificação registra quem verificou." };
  }
  if (!attempt.verifiedAt) {
    return { allowed: false, reason: "Toda verificação registra quando foi feita." };
  }
  return { allowed: true };
}

// ---------------------------------------------------------------------------
// Validade no tempo
// ---------------------------------------------------------------------------

/**
 * Um diploma de 2012 continua verdadeiro em 2030. Onde a pessoa atende, não.
 *
 * Dado volátil verificado há muito tempo é mais perigoso que dado nunca
 * verificado: tem a aparência de conferido. Por isso ele vence.
 */
export const VALIDITY_DAYS: Record<InformationPolicy["volatility"], number | null> = {
  ESTAVEL: null,
  VOLATIL: 180,
};

export function daysBetween(from: string, to: string): number {
  return Math.floor((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

/** A verificação venceu? Só faz sentido perguntar de dado volátil. */
export function isStale(kind: InformationKind, verifiedAt: string | null, now: string): boolean {
  if (!verifiedAt) return false;
  const limit = VALIDITY_DAYS[SOURCE_MATRIX[kind].volatility];
  if (limit === null) return false;
  return daysBetween(verifiedAt, now) > limit;
}

/**
 * O estado corrente, já considerando o tempo. Um `verificado` vencido vira
 * `desatualizado` na leitura — o banco guarda o que foi assinado, e é aqui
 * que o relógio entra.
 */
export function currentState(
  kind: InformationKind,
  stored: VerificationState,
  verifiedAt: string | null,
  now: string,
): VerificationState {
  if (stored !== "verificado") return stored;
  return isStale(kind, verifiedAt, now) ? "desatualizado" : "verificado";
}

// ---------------------------------------------------------------------------
// Publicação
// ---------------------------------------------------------------------------

export type PublicationCandidate = {
  isDemo: boolean;
  crm: string | null;
  crmUf: string | null;
  registrationStatus: "regular" | "irregular" | "nao_localizado" | null;
  practiceAreaVerified: boolean;
  openCriticalDivergences: number;
};

/**
 * Publicar não é aprovar tecnicamente. É dizer que este cadastro pode ser
 * lido por um Curador — que a pessoa existe, exerce legalmente e declarou uma
 * área que alguém conferiu. Se ela serve a um caso continua sendo pergunta do
 * Curador, caso a caso.
 */
export function publicationBlockers(candidate: PublicationCandidate): string[] {
  const blockers: string[] = [];

  if (candidate.isDemo) blockers.push("Perfil de demonstração não pode ser publicado.");
  if (!candidate.crm || !candidate.crmUf) blockers.push("Falta CRM e UF.");
  if (candidate.registrationStatus !== "regular") {
    blockers.push(
      candidate.registrationStatus === null
        ? "O registro profissional ainda não foi consultado no conselho."
        : `O registro está como "${candidate.registrationStatus}" — publicação exige registro regular.`,
    );
  }
  if (!candidate.practiceAreaVerified) blockers.push("A área de atuação ainda não foi verificada.");
  if (candidate.openCriticalDivergences > 0) {
    blockers.push(
      `Há ${candidate.openCriticalDivergences} divergência(s) crítica(s) em aberto. Resolva antes de publicar.`,
    );
  }

  return blockers;
}
