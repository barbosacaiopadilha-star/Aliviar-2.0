/**
 * CATÁLOGO CANÔNICO — ARQUIVO GERADO. NÃO EDITE À MÃO (DO-NOT-EDIT).
 *
 * Fonte: curadoria.method_subcriteria + curadoria.method_subcriterion_options
 * do Supabase LOCAL (o estado que as migrations congeladas 20260802100000/
 * 110000 + 20260803100000 produzem — ADR-046 aprova o conteúdo, ADR-047 torna
 * o banco autoritativo, ADR-065 institui a leitura relacional/Catálogo 1.1.0).
 *
 * Para regenerar:
 *   node scripts/with-local-supabase.mjs node scripts/gerar-catalogo-ts.mjs
 *
 * O teste de paridade (tests/remediacao/paridade-catalogo.integration.test.ts)
 * recomputa esta carga do banco vivo e compara com o hash abaixo: qualquer
 * edição manual — aqui ou no banco — falha nomeando conceito e campo.
 */

export type CatalogoConditionalRule = {
  when: { field: string; value?: string; value_not?: string };
  show?: string;
  hide?: string;
  require_detail?: boolean;
};

export type CatalogoOpcao = {
  value: string;
  label: string;
  requiresDetail: boolean;
  detailKind: string | null;
  displayOrder: number;
  active: boolean;
  catalogVersion: string;
  /**
   * ADR-065 (leitura relacional): values do lado profissional que satisfazem
   * esta opção da pessoa, ou ["*"] = qualquer declaração vigente do conceito.
   * null = fora do mecanismo (lado profissional, conceito humano, ou opção
   * fora do cruzamento). Comparação por identidade, nunca por rótulo.
   */
  satisfiedBy: readonly string[] | null;
};

export type CatalogoCampo = {
  field: string;
  options: readonly CatalogoOpcao[];
};

export type CatalogoConceito = {
  code: string;
  group: string;
  axis: string | null;
  name: string;
  description: string;
  displayOrder: number;
  active: boolean;
  catalogVersion: string;
  professionalQuestion: string | null;
  patientQuestion: string | null;
  responseType: string | null;
  cruzamento: string | null;
  /**
   * ADR-066 §16 — SE E COMO o conceito participa do Motor: DIRETO, INDIRETO ou
   * NUNCA. Fonte autoritativa: `method_subcriteria.motor_participation`
   * (2.2C-R1). `null` só no legado 0.9.0 inativo, que saiu de circulação antes
   * de o atributo existir.
   *
   * NÃO confundir com `cruzamento`, que diz QUEM JULGA: entre os `humano` há
   * dois `NUNCA` e um `INDIRETO`. E `INDIRETO` não é `NUNCA`.
   */
  motorParticipation: string | null;
  required: boolean;
  conditionalRules: readonly CatalogoConditionalRule[];
  evidenceSource: string | null;
  reviewMonths: number | null;
  /** Lado do profissional: campos → opções fechadas, na ordem do banco. */
  profissional: readonly CatalogoCampo[];
  /** Lado da paciente: campos → opções fechadas, na ordem do banco. */
  paciente: readonly CatalogoCampo[];
};

/** Os 5 eixos, na ordem canônica (migration 20260802100000 + doc do Catálogo). */
export const CATALOGO_EIXOS = ["ACESSO_AO_CUIDADO","CONTINUIDADE_DO_CUIDADO","MODELO_DE_ATENDIMENTO","PRATICA_E_TRAJETORIA","VIABILIDADE_DE_ACESSO"] as const;

/** Versão vigente única de todos os conceitos ativos. */
export const CATALOGO_VERSAO = "1.1.0";

/** SHA-256 da carga (conceitos+opções, ordem canônica) — paridade executável. */
export const CATALOGO_GERADO_HASH = "4b53a6b551d88a3617484a4d5d9ef5f289159a4d807d44c7f8ea1e0559f6e292";

/** Total de opções no banco na geração (ativas e inativas). */
export const CATALOGO_TOTAL_OPCOES = 208;

/**
 * Todos os conceitos: os 29 ativos na ordem canônica, depois o legado 0.9.0
 * inativo (legível para histórico; nunca recebe gravação nova).
 */
export const CATALOGO_GERADO: readonly CatalogoConceito[] = [
  {
    "code": "ACESSO_MODALIDADE",
    "group": "ACESSO",
    "axis": "ACESSO_AO_CUIDADO",
    "name": "Modalidade de atendimento",
    "description": "Presencial, remoto ou os dois.",
    "displayOrder": 2,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Em quais formatos você atende hoje?",
    "patientQuestion": "Como você consegue ser atendida?",
    "responseType": "multipla_escolha",
    "cruzamento": "automatico",
    "motorParticipation": "DIRETO",
    "required": false,
    "conditionalRules": [
      {
        "when": {
          "field": "principal",
          "value": "PRIMEIRA_REMOTA_CONDICIONADA"
        },
        "require_detail": true
      },
      {
        "when": {
          "field": "principal",
          "value": "HIBRIDO_CONFORME_O_CASO"
        },
        "require_detail": true
      }
    ],
    "evidenceSource": "institucional",
    "reviewMonths": 6,
    "profissional": [
      {
        "field": "principal",
        "options": [
          {
            "value": "PRESENCIAL",
            "label": "Presencial",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "REMOTO",
            "label": "Remoto",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "PRIMEIRA_PRESENCIAL_RETORNOS_REMOTOS",
            "label": "Primeira presencial, retornos remotos",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "PRIMEIRA_REMOTA_CONDICIONADA",
            "label": "Primeira remota, sob condição",
            "requiresDetail": true,
            "detailKind": "condicao_estruturada",
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "HIBRIDO_CONFORME_O_CASO",
            "label": "Híbrido, conforme o caso",
            "requiresDetail": true,
            "detailKind": "condicao_estruturada",
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ],
    "paciente": [
      {
        "field": "principal",
        "options": [
          {
            "value": "PRECISO_REMOTO",
            "label": "Preciso de atendimento remoto",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "PREFIRO_REMOTO",
            "label": "Prefiro remoto",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "PRECISO_PRESENCIAL",
            "label": "Preciso de atendimento presencial",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "PREFIRO_PRESENCIAL",
            "label": "Prefiro presencial",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "TANTO_FAZ",
            "label": "Tanto faz",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "NAO_SEI_INFORMAR",
            "label": "Não sei informar",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 6,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ]
  },
  {
    "code": "ACESSO_DISPONIBILIDADE",
    "group": "ACESSO",
    "axis": "ACESSO_AO_CUIDADO",
    "name": "Disponibilidade",
    "description": "Horários e janelas em que consegue atender.",
    "displayOrder": 3,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Em quais janelas você atende habitualmente?",
    "patientQuestion": "Quando você consegue ser atendida?",
    "responseType": "multipla_escolha",
    "cruzamento": "automatico",
    "motorParticipation": "DIRETO",
    "required": false,
    "conditionalRules": [],
    "evidenceSource": "institucional",
    "reviewMonths": 3,
    "profissional": [
      {
        "field": "principal",
        "options": [
          {
            "value": "MANHA_DIAS_UTEIS",
            "label": "Manhã, dias úteis",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "TARDE_DIAS_UTEIS",
            "label": "Tarde, dias úteis",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "NOITE_APOS_18H",
            "label": "Noite, após 18h",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "SABADO",
            "label": "Sábado",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "DOMINGO_OU_FERIADO",
            "label": "Domingo ou feriado",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "SOB_AGENDAMENTO_ESPECIFICO",
            "label": "Sob agendamento específico",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 6,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ],
    "paciente": [
      {
        "field": "principal",
        "options": [
          {
            "value": "MANHA_DIAS_UTEIS",
            "label": "Manhã em dias úteis",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "TARDE_DIAS_UTEIS",
            "label": "Tarde em dias úteis",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "NOITE_APOS_18H",
            "label": "Noite, após as 18h",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "SABADO",
            "label": "Sábado",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "DOMINGO_OU_FERIADO",
            "label": "Domingo ou feriado",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ]
  },
  {
    "code": "ACESSO_PRAZO_PARA_CONSULTA",
    "group": "ACESSO",
    "axis": "ACESSO_AO_CUIDADO",
    "name": "Prazo para a primeira consulta",
    "description": "Quanto tempo até conseguir ser atendido.",
    "displayOrder": 4,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Qual o prazo habitual para a primeira consulta?",
    "patientQuestion": "Em quanto tempo você precisa ser atendida?",
    "responseType": "escolha_unica",
    "cruzamento": "automatico",
    "motorParticipation": "DIRETO",
    "required": false,
    "conditionalRules": [
      {
        "when": {
          "field": "principal",
          "value": "VARIA_CONFORME_O_CASO"
        },
        "require_detail": true
      }
    ],
    "evidenceSource": "institucional",
    "reviewMonths": 3,
    "profissional": [
      {
        "field": "principal",
        "options": [
          {
            "value": "ATE_7_DIAS",
            "label": "Até 7 dias",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "DE_8_A_15_DIAS",
            "label": "De 8 a 15 dias",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "DE_16_A_30_DIAS",
            "label": "De 16 a 30 dias",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "DE_31_A_60_DIAS",
            "label": "De 31 a 60 dias",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "MAIS_DE_60_DIAS",
            "label": "Mais de 60 dias",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "VARIA_CONFORME_O_CASO",
            "label": "Varia conforme o caso",
            "requiresDetail": true,
            "detailKind": "condicao_estruturada",
            "displayOrder": 6,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ],
    "paciente": [
      {
        "field": "principal",
        "options": [
          {
            "value": "ATE_7_DIAS",
            "label": "Em até 7 dias",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ATE_15_DIAS",
            "label": "Em até 15 dias",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ATE_30_DIAS",
            "label": "Em até 30 dias",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "SEM_URGENCIA_DECLARADA",
            "label": "Sem urgência declarada",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ]
  },
  {
    "code": "ACESSO_LOCAL_DE_ATENDIMENTO",
    "group": "ACESSO",
    "axis": "ACESSO_AO_CUIDADO",
    "name": "Local de atendimento",
    "description": "Onde o profissional atende presencialmente. Substitui ACESSO_LOCALIZACAO: o juízo de deslocamento passa ao lado da paciente.",
    "displayOrder": 5,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Em quais endereços você atende presencialmente?",
    "patientQuestion": "De onde você pode se deslocar, e até onde?",
    "responseType": "estruturado",
    "cruzamento": "misto",
    "motorParticipation": "DIRETO",
    "required": false,
    "conditionalRules": [],
    "evidenceSource": "institucional",
    "reviewMonths": 6,
    "profissional": [
      {
        "field": "tipo_de_local",
        "options": [
          {
            "value": "CONSULTORIO",
            "label": "Consultório",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "HOSPITAL",
            "label": "Hospital",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "CLINICA",
            "label": "Clínica",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "AMBULATORIO",
            "label": "Ambulatório",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ],
    "paciente": [
      {
        "field": "deslocamento",
        "options": [
          {
            "value": "ATE_30_MIN",
            "label": "Até 30 minutos",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ATE_1H",
            "label": "Até 1 hora",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ATE_2H",
            "label": "Até 2 horas",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "QUALQUER_DISTANCIA",
            "label": "Qualquer distância",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "NAO_POSSO_ME_DESLOCAR",
            "label": "Não posso me deslocar",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ]
  },
  {
    "code": "CONTINUIDADE_RETORNOS",
    "group": "CONTINUIDADE_DO_CUIDADO",
    "axis": "CONTINUIDADE_DO_CUIDADO",
    "name": "Retornos",
    "description": "Como e com que frequência acontecem os retornos.",
    "displayOrder": 1,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Após a primeira consulta, quais dessas condutas você costuma adotar?",
    "patientQuestion": "Como você gostaria que fosse o acompanhamento depois da primeira consulta?",
    "responseType": "multipla_escolha",
    "cruzamento": "misto",
    "motorParticipation": "DIRETO",
    "required": false,
    "conditionalRules": [
      {
        "show": "frequencia_habitual",
        "when": {
          "field": "principal",
          "value": "RETORNO_PROGRAMADO_NA_PROPRIA_CONSULTA"
        }
      },
      {
        "when": {
          "field": "frequencia_habitual",
          "value": "DEPENDE_DA_EVOLUCAO"
        },
        "require_detail": true
      }
    ],
    "evidenceSource": "institucional",
    "reviewMonths": 12,
    "profissional": [
      {
        "field": "frequencia_habitual",
        "options": [
          {
            "value": "ATE_30_DIAS",
            "label": "Até 30 dias",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "DE_1_A_3_MESES",
            "label": "De 1 a 3 meses",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "DE_3_A_6_MESES",
            "label": "De 3 a 6 meses",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ACIMA_DE_6_MESES",
            "label": "Acima de 6 meses",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "DEPENDE_DA_EVOLUCAO",
            "label": "Depende da evolução",
            "requiresDetail": true,
            "detailKind": "condicao_estruturada",
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      },
      {
        "field": "principal",
        "options": [
          {
            "value": "RETORNO_PROGRAMADO_NA_PROPRIA_CONSULTA",
            "label": "Retorno programado na própria consulta",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "RETORNO_CONFORME_EVOLUCAO",
            "label": "Retorno conforme a evolução",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "RETORNO_APENAS_SE_SOLICITADO",
            "label": "Retorno apenas se solicitado",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ENVIA_ORIENTACAO_ESCRITA",
            "label": "Envia orientação escrita",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "REAVALIA_EXAMES_ENTRE_CONSULTAS",
            "label": "Reavalia exames entre consultas",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ],
    "paciente": [
      {
        "field": "principal",
        "options": [
          {
            "value": "RETORNO_JA_MARCADO_AO_SAIR",
            "label": "Sair com o retorno já marcado",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "RETORNO_CONFORME_EU_EVOLUIR",
            "label": "Retorno conforme eu evoluir",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "PREFIRO_PROCURAR_QUANDO_PRECISAR",
            "label": "Prefiro procurar quando precisar",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "QUERO_ORIENTACAO_ESCRITA_APOS_CONSULTA",
            "label": "Quero orientação escrita após a consulta",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "NAO_TENHO_PREFERENCIA",
            "label": "Não tenho preferência",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ]
  },
  {
    "code": "CONTINUIDADE_POS_PROCEDIMENTO",
    "group": "CONTINUIDADE_DO_CUIDADO",
    "axis": "CONTINUIDADE_DO_CUIDADO",
    "name": "Acompanhamento pós-procedimento",
    "description": "O que acontece depois do procedimento, e por quanto tempo.",
    "displayOrder": 2,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Após um procedimento que você realiza, quais condutas são habituais?",
    "patientQuestion": null,
    "responseType": "multipla_escolha",
    "cruzamento": "humano",
    "motorParticipation": "INDIRETO",
    "required": false,
    "conditionalRules": [
      {
        "hide": "duracao_habitual",
        "when": {
          "field": "principal",
          "value": "NAO_REALIZA_PROCEDIMENTOS"
        }
      }
    ],
    "evidenceSource": "entrevista",
    "reviewMonths": 12,
    "profissional": [
      {
        "field": "duracao_habitual",
        "options": [
          {
            "value": "ATE_30_DIAS",
            "label": "Até 30 dias",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ATE_90_DIAS",
            "label": "Até 90 dias",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ATE_6_MESES",
            "label": "Até 6 meses",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ACIMA_DE_6_MESES",
            "label": "Acima de 6 meses",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "CONFORME_O_PROCEDIMENTO",
            "label": "Conforme o procedimento",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      },
      {
        "field": "principal",
        "options": [
          {
            "value": "ACOMPANHA_PESSOALMENTE_TODO_O_POS",
            "label": "Acompanha pessoalmente todo o pós",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ACOMPANHA_COM_EQUIPE",
            "label": "Acompanha com equipe",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ACOMPANHA_ATE_ALTA_E_ENCAMINHA",
            "label": "Acompanha até a alta e encaminha",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ENCAMINHA_PARA_OUTRO_PROFISSIONAL",
            "label": "Encaminha para outro profissional",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "NAO_REALIZA_PROCEDIMENTOS",
            "label": "Não realiza procedimentos",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ],
    "paciente": []
  },
  {
    "code": "CONTINUIDADE_EQUIPE_DE_APOIO",
    "group": "CONTINUIDADE_DO_CUIDADO",
    "axis": "CONTINUIDADE_DO_CUIDADO",
    "name": "Equipe de apoio",
    "description": "Existência de equipe que acompanha junto com o profissional.",
    "displayOrder": 3,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Quem mais acompanha as pessoas que você atende?",
    "patientQuestion": "Você precisa de acompanhamento de mais de um tipo de profissional?",
    "responseType": "multipla_escolha",
    "cruzamento": "automatico",
    "motorParticipation": "DIRETO",
    "required": false,
    "conditionalRules": [],
    "evidenceSource": "institucional",
    "reviewMonths": 12,
    "profissional": [
      {
        "field": "principal",
        "options": [
          {
            "value": "ENFERMAGEM",
            "label": "Enfermagem",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "SECRETARIA_CLINICA",
            "label": "Secretaria clínica",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "NUTRICAO",
            "label": "Nutrição",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "PSICOLOGIA",
            "label": "Psicologia",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "FISIOTERAPIA",
            "label": "Fisioterapia",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "SERVICO_SOCIAL",
            "label": "Serviço social",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 6,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "OUTRO_PROFISSIONAL_DA_EQUIPE",
            "label": "Outro profissional da equipe",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 7,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ATUA_SEM_EQUIPE_FIXA",
            "label": "Atua sem equipe fixa",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 8,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ],
    "paciente": []
  },
  {
    "code": "CONTINUIDADE_COORDENACAO",
    "group": "CONTINUIDADE_DO_CUIDADO",
    "axis": "CONTINUIDADE_DO_CUIDADO",
    "name": "Coordenação com outros profissionais",
    "description": "Como conversa com os outros profissionais que cuidam da pessoa.",
    "displayOrder": 4,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Quando a pessoa já é acompanhada por outros profissionais, o que você costuma fazer?",
    "patientQuestion": "Você já é acompanhada por outros profissionais que precisariam conversar entre si?",
    "responseType": "multipla_escolha",
    "cruzamento": "automatico",
    "motorParticipation": "DIRETO",
    "required": false,
    "conditionalRules": [],
    "evidenceSource": "entrevista",
    "reviewMonths": 12,
    "profissional": [
      {
        "field": "principal",
        "options": [
          {
            "value": "CONTATA_DIRETAMENTE_O_OUTRO_PROFISSIONAL",
            "label": "Contata diretamente o outro profissional",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ENVIA_RELATORIO_ESCRITO",
            "label": "Envia relatório escrito",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "PARTICIPA_DE_DISCUSSAO_DE_CASO",
            "label": "Participa de discussão de caso",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO",
            "label": "Orienta a pessoa a levar a informação",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ATUA_DE_FORMA_INDEPENDENTE",
            "label": "Atua de forma independente",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ],
    "paciente": [
      {
        "field": "principal",
        "options": [
          {
            "value": "SIM",
            "label": "Sim",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "NAO",
            "label": "Não",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "NAO_SEI_INFORMAR",
            "label": "Não sei informar",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ]
  },
  {
    "code": "CONTINUIDADE_CANAIS",
    "group": "CONTINUIDADE_DO_CUIDADO",
    "axis": "CONTINUIDADE_DO_CUIDADO",
    "name": "Canais entre consultas",
    "description": "Por onde e em que condições a pessoa pode falar com o profissional ou a equipe entre consultas. NAO_HA_CANAL é fato declarado, não defeito.",
    "displayOrder": 5,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Entre uma consulta e outra, como a pessoa consegue contato?",
    "patientQuestion": "Você precisa conseguir falar com alguém entre as consultas?",
    "responseType": "multipla_escolha",
    "cruzamento": "automatico",
    "motorParticipation": "DIRETO",
    "required": false,
    "conditionalRules": [
      {
        "show": "prazo_de_resposta",
        "when": {
          "field": "principal",
          "value_not": "NAO_HA_CANAL_ENTRE_CONSULTAS"
        }
      }
    ],
    "evidenceSource": "institucional",
    "reviewMonths": 6,
    "profissional": [
      {
        "field": "prazo_de_resposta",
        "options": [
          {
            "value": "MESMO_DIA",
            "label": "Mesmo dia",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ATE_48H",
            "label": "Até 48h",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ATE_5_DIAS_UTEIS",
            "label": "Até 5 dias úteis",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "SEM_PRAZO_DEFINIDO",
            "label": "Sem prazo definido",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      },
      {
        "field": "principal",
        "options": [
          {
            "value": "MENSAGEM_DIRETA_COM_O_PROFISSIONAL",
            "label": "Mensagem direta com o profissional",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "MENSAGEM_COM_A_EQUIPE_OU_SECRETARIA",
            "label": "Mensagem com a equipe ou secretaria",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "TELEFONE_EM_HORARIO_COMERCIAL",
            "label": "Telefone em horário comercial",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "PORTAL_OU_APLICATIVO",
            "label": "Portal ou aplicativo",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "CONTATO_DE_URGENCIA_FORA_DO_HORARIO",
            "label": "Contato de urgência fora do horário",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "APENAS_REAGENDAMENTO",
            "label": "Apenas reagendamento",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 6,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "NAO_HA_CANAL_ENTRE_CONSULTAS",
            "label": "Não há canal entre consultas",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 7,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ],
    "paciente": [
      {
        "field": "principal",
        "options": [
          {
            "value": "PODER_MANDAR_MENSAGEM",
            "label": "Poder mandar mensagem",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "TELEFONE_PARA_LIGAR",
            "label": "Um telefone para ligar",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "CONTATO_PARA_URGENCIA_FORA_DO_HORARIO",
            "label": "Contato para urgência fora do horário",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "BASTA_REAGENDAR",
            "label": "Basta poder reagendar",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "NAO_TENHO_PREFERENCIA",
            "label": "Não tenho preferência",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ]
  },
  {
    "code": "MODELO_COMUNICACAO",
    "group": "MODELO_DE_ATENDIMENTO",
    "axis": "MODELO_DE_ATENDIMENTO",
    "name": "Como explica",
    "description": "Condutas observáveis de explicação, adaptação da linguagem e verificação de entendimento.",
    "displayOrder": 1,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Ao explicar um diagnóstico ou tratamento, quais dessas ações você costuma realizar?",
    "patientQuestion": "O que te ajudaria a entender melhor o que for explicado?",
    "responseType": "multipla_escolha",
    "cruzamento": "automatico",
    "motorParticipation": "DIRETO",
    "required": false,
    "conditionalRules": [],
    "evidenceSource": "entrevista",
    "reviewMonths": 12,
    "profissional": [
      {
        "field": "principal",
        "options": [
          {
            "value": "ADAPTA_A_LINGUAGEM_AO_INTERLOCUTOR",
            "label": "Adapta a linguagem ao interlocutor",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "VERIFICA_SE_A_PESSOA_COMPREENDEU",
            "label": "Verifica se a pessoa compreendeu",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "REEXPLICA_DE_OUTRA_FORMA_QUANDO_NECESSARIO",
            "label": "Reexplica de outra forma quando necessário",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "USA_APOIO_VISUAL_OU_DESENHO",
            "label": "Usa apoio visual ou desenho",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ENVIA_RESUMO_ESCRITO",
            "label": "Envia resumo escrito",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "RESERVA_TEMPO_PARA_PERGUNTAS",
            "label": "Reserva tempo para perguntas",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 6,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "AUTORIZA_GRAVACAO_DA_CONSULTA",
            "label": "Autoriza gravação da consulta",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 7,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ],
    "paciente": [
      {
        "field": "principal",
        "options": [
          {
            "value": "EXPLICACAO_SEM_TERMOS_TECNICOS",
            "label": "Explicação sem termos técnicos",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": [
              "ADAPTA_A_LINGUAGEM_AO_INTERLOCUTOR",
              "REEXPLICA_DE_OUTRA_FORMA_QUANDO_NECESSARIO"
            ]
          },
          {
            "value": "QUE_CONFIRMEM_SE_ENTENDI",
            "label": "Que confirmem se eu entendi",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": [
              "VERIFICA_SE_A_PESSOA_COMPREENDEU"
            ]
          },
          {
            "value": "ALGO_ESCRITO_PARA_LEVAR",
            "label": "Algo escrito para levar",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": [
              "ENVIA_RESUMO_ESCRITO"
            ]
          },
          {
            "value": "DESENHO_OU_IMAGEM",
            "label": "Desenho ou imagem",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": [
              "USA_APOIO_VISUAL_OU_DESENHO"
            ]
          },
          {
            "value": "TEMPO_PARA_PERGUNTAR",
            "label": "Tempo para perguntar",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": [
              "RESERVA_TEMPO_PARA_PERGUNTAS"
            ]
          },
          {
            "value": "PODER_GRAVAR_A_CONVERSA",
            "label": "Poder gravar a conversa",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 6,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": [
              "AUTORIZA_GRAVACAO_DA_CONSULTA"
            ]
          }
        ]
      }
    ]
  },
  {
    "code": "MODELO_DECISAO_COMPARTILHADA",
    "group": "MODELO_DE_ATENDIMENTO",
    "axis": "MODELO_DE_ATENDIMENTO",
    "name": "Como conduz decisões",
    "description": "Condutas observáveis diante de mais de uma alternativa adequada.",
    "displayOrder": 2,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Quando existem duas ou mais opções clinicamente adequadas, quais ações você costuma realizar antes da decisão?",
    "patientQuestion": "Quando houver mais de um caminho possível, como você gostaria de participar da decisão?",
    "responseType": "multipla_escolha",
    "cruzamento": "humano",
    "motorParticipation": "INDIRETO",
    "required": false,
    "conditionalRules": [],
    "evidenceSource": "entrevista",
    "reviewMonths": 12,
    "profissional": [
      {
        "field": "principal",
        "options": [
          {
            "value": "APRESENTA_TODAS_AS_OPCOES_ADEQUADAS",
            "label": "Apresenta todas as opções adequadas",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "EXPLICA_RISCOS_E_BENEFICIOS_DE_CADA_UMA",
            "label": "Explica riscos e benefícios de cada uma",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "PERGUNTA_O_QUE_IMPORTA_PARA_A_PESSOA",
            "label": "Pergunta o que importa para a pessoa",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "OFERECE_TEMPO_PARA_DECIDIR",
            "label": "Oferece tempo para decidir",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "SUGERE_SEGUNDA_OPINIAO_QUANDO_PERTINENTE",
            "label": "Sugere segunda opinião quando pertinente",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "RECOMENDA_UMA_OPCAO_E_EXPLICA_O_PORQUE",
            "label": "Recomenda uma opção e explica o porquê",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 6,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "DECIDE_E_COMUNICA_A_CONDUTA",
            "label": "Decide e comunica a conduta",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 7,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ],
    "paciente": [
      {
        "field": "principal",
        "options": [
          {
            "value": "QUERO_DECIDIR_COM_ORIENTACAO",
            "label": "Quero decidir, com orientação",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "QUERO_QUE_O_MEDICO_RECOMENDE_E_EU_CONFIRMO",
            "label": "Quero que o médico recomende e eu confirmo",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "PREFIRO_QUE_O_MEDICO_DECIDA",
            "label": "Prefiro que o médico decida",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "NAO_SEI_AINDA",
            "label": "Não sei ainda",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ]
  },
  {
    "code": "MODELO_PARTICIPACAO_FAMILIAR",
    "group": "MODELO_DE_ATENDIMENTO",
    "axis": "MODELO_DE_ATENDIMENTO",
    "name": "Participação de acompanhantes",
    "description": "Abertura e condições para a presença de acompanhantes. Abertura à família não significa inclusão obrigatória.",
    "displayOrder": 3,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Como você conduz a presença de acompanhantes?",
    "patientQuestion": "Você quer que alguém participe das conversas?",
    "responseType": "multipla_escolha",
    "cruzamento": "automatico",
    "motorParticipation": "DIRETO",
    "required": false,
    "conditionalRules": [],
    "evidenceSource": "entrevista",
    "reviewMonths": 12,
    "profissional": [
      {
        "field": "principal",
        "options": [
          {
            "value": "ACOMPANHANTE_BEM_VINDO_SEMPRE",
            "label": "Acompanhante bem-vindo sempre",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ACOMPANHANTE_MEDIANTE_AUTORIZACAO_DA_PESSOA",
            "label": "Acompanhante mediante autorização da pessoa",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "PARTE_DA_CONSULTA_A_SOS",
            "label": "Parte da consulta a sós",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "CONTATO_COM_FAMILIA_ENTRE_CONSULTAS_SE_AUTORIZADO",
            "label": "Contato com a família entre consultas, se autorizado",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ATENDIMENTO_APENAS_INDIVIDUAL",
            "label": "Atendimento apenas individual",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ],
    "paciente": [
      {
        "field": "principal",
        "options": [
          {
            "value": "QUERO_ACOMPANHANTE_SEMPRE",
            "label": "Quero acompanhante sempre",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": [
              "ACOMPANHANTE_BEM_VINDO_SEMPRE",
              "ACOMPANHANTE_MEDIANTE_AUTORIZACAO_DA_PESSOA"
            ]
          },
          {
            "value": "EM_ALGUMAS_CONVERSAS",
            "label": "Em algumas conversas",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": [
              "ACOMPANHANTE_BEM_VINDO_SEMPRE",
              "ACOMPANHANTE_MEDIANTE_AUTORIZACAO_DA_PESSOA",
              "PARTE_DA_CONSULTA_A_SOS"
            ]
          },
          {
            "value": "PREFIRO_SOZINHA",
            "label": "Prefiro sozinha",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": [
              "*"
            ]
          },
          {
            "value": "NAO_TENHO_PREFERENCIA",
            "label": "Não tenho preferência",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ]
  },
  {
    "code": "MODELO_ALTERNATIVAS",
    "group": "MODELO_DE_ATENDIMENTO",
    "axis": "MODELO_DE_ATENDIMENTO",
    "name": "Explicação de alternativas",
    "description": "Se apresenta os caminhos possíveis, inclusive o de não intervir.",
    "displayOrder": 4,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Ao propor uma conduta, quais dessas você costuma apresentar?",
    "patientQuestion": "O que você precisa saber antes de aceitar um tratamento?",
    "responseType": "multipla_escolha",
    "cruzamento": "automatico",
    "motorParticipation": "DIRETO",
    "required": false,
    "conditionalRules": [],
    "evidenceSource": "entrevista",
    "reviewMonths": 12,
    "profissional": [
      {
        "field": "principal",
        "options": [
          {
            "value": "OPCOES_DE_TRATAMENTO_DISPONIVEIS",
            "label": "Opções de tratamento disponíveis",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "OPCAO_DE_ACOMPANHAR_SEM_INTERVIR",
            "label": "Opção de acompanhar sem intervir",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "RISCOS_DE_CADA_CAMINHO",
            "label": "Riscos de cada caminho",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "O_QUE_ACONTECE_SE_NADA_FOR_FEITO",
            "label": "O que acontece se nada for feito",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "LIMITES_DO_QUE_SE_SABE_HOJE",
            "label": "Limites do que se sabe hoje",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "CUSTO_E_COBERTURA_DE_CADA_OPCAO",
            "label": "Custo e cobertura de cada opção",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 6,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ],
    "paciente": [
      {
        "field": "principal",
        "options": [
          {
            "value": "TODAS_AS_OPCOES_DISPONIVEIS",
            "label": "Todas as opções disponíveis",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": [
              "OPCOES_DE_TRATAMENTO_DISPONIVEIS"
            ]
          },
          {
            "value": "OPCAO_DE_NAO_FAZER_NADA",
            "label": "A opção de não fazer nada",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": [
              "OPCAO_DE_ACOMPANHAR_SEM_INTERVIR",
              "O_QUE_ACONTECE_SE_NADA_FOR_FEITO"
            ]
          },
          {
            "value": "RISCOS_DE_CADA_CAMINHO",
            "label": "Os riscos de cada caminho",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": [
              "RISCOS_DE_CADA_CAMINHO"
            ]
          },
          {
            "value": "CUSTOS_DE_CADA_CAMINHO",
            "label": "Os custos de cada caminho",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": [
              "CUSTO_E_COBERTURA_DE_CADA_OPCAO"
            ]
          }
        ]
      }
    ]
  },
  {
    "code": "MODELO_PREFERENCIAS_E_RESTRICOES",
    "group": "MODELO_DE_ATENDIMENTO",
    "axis": "MODELO_DE_ATENDIMENTO",
    "name": "Respeito a recusas e restrições",
    "description": "Como o profissional lida com recusas explícitas e restrições pessoais, religiosas ou culturais. Texto livre da paciente nunca entra no Motor.",
    "displayOrder": 5,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Quando a pessoa recusa uma conduta ou tem restrição pessoal, religiosa ou cultural, o que você costuma fazer?",
    "patientQuestion": "Existe algo que você não aceita, ou que precisa ser respeitado no seu cuidado?",
    "responseType": "multipla_escolha",
    "cruzamento": "humano",
    "motorParticipation": "NUNCA",
    "required": false,
    "conditionalRules": [],
    "evidenceSource": "entrevista",
    "reviewMonths": 12,
    "profissional": [
      {
        "field": "principal",
        "options": [
          {
            "value": "REGISTRA_A_RESTRICAO_NO_PRONTUARIO",
            "label": "Registra a restrição no prontuário",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "BUSCA_ALTERNATIVA_COMPATIVEL",
            "label": "Busca alternativa compatível",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "EXPLICA_CONSEQUENCIAS_E_MANTEM_O_ACOMPANHAMENTO",
            "label": "Explica consequências e mantém o acompanhamento",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ENCAMINHA_QUANDO_NAO_PODE_ATENDER_A_RESTRICAO",
            "label": "Encaminha quando não pode atender à restrição",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "NAO_ACOMPANHA_QUEM_RECUSA_A_CONDUTA_INDICADA",
            "label": "Não acompanha quem recusa a conduta indicada",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ],
    "paciente": []
  },
  {
    "code": "MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS",
    "group": "MODELO_DE_ATENDIMENTO",
    "axis": "MODELO_DE_ATENDIMENTO",
    "name": "Condução de notícias difíceis",
    "description": "Condutas na comunicação de notícia grave: ritmo, preparo, companhia e continuidade imediata. Fronteira estreita (ADR-065): cobre somente a conduta na comunicação de notícia grave — explicação rotineira permanece em MODELO_COMUNICACAO; presença rotineira de acompanhante permanece em MODELO_PARTICIPACAO_FAMILIAR; este conceito não deve ser alargado para absorvê-las.",
    "displayOrder": 6,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Ao comunicar um diagnóstico grave ou uma notícia difícil, quais dessas condutas você costuma adotar?",
    "patientQuestion": "Se houver uma notícia difícil, como você prefere recebê-la?",
    "responseType": "multipla_escolha",
    "cruzamento": "humano",
    "motorParticipation": "NUNCA",
    "required": false,
    "conditionalRules": [],
    "evidenceSource": "entrevista",
    "reviewMonths": 12,
    "profissional": [
      {
        "field": "principal",
        "options": [
          {
            "value": "RESERVA_TEMPO_DEDICADO_PARA_A_CONVERSA",
            "label": "Reserva tempo dedicado para a conversa",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "PERGUNTA_O_QUANTO_A_PESSOA_QUER_SABER",
            "label": "Pergunta o quanto a pessoa quer saber",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "COMUNICA_JUNTO_COM_OS_PROXIMOS_PASSOS",
            "label": "Comunica junto com os próximos passos",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "OFERECE_PRESENCA_DE_ACOMPANHANTE",
            "label": "Oferece a presença de um acompanhante",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "PROGRAMA_RECONTATO_PROXIMO_APOS_A_NOTICIA",
            "label": "Programa recontato próximo após a notícia",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ],
    "paciente": [
      {
        "field": "principal",
        "options": [
          {
            "value": "DIRETA_E_COMPLETA",
            "label": "De forma direta e completa",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "NO_MEU_RITMO_CONFORME_EU_PERGUNTAR",
            "label": "No meu ritmo, conforme eu perguntar",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "COM_ALGUEM_QUE_EU_ESCOLHER_JUNTO",
            "label": "Com alguém que eu escolher junto",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "JUNTO_COM_O_QUE_PODE_SER_FEITO",
            "label": "Junto com o que pode ser feito a respeito",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "NAO_SEI_AINDA",
            "label": "Não sei ainda",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ]
  },
  {
    "code": "FORMACAO_GRADUACAO",
    "group": "FORMACAO",
    "axis": "PRATICA_E_TRAJETORIA",
    "name": "Graduação",
    "description": "Onde e quando se formou em medicina.",
    "displayOrder": 1,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Instituição e ano de graduação",
    "patientQuestion": null,
    "responseType": "estruturado",
    "cruzamento": "humano",
    "motorParticipation": "INDIRETO",
    "required": false,
    "conditionalRules": [],
    "evidenceSource": "oficial_primaria",
    "reviewMonths": 60,
    "profissional": [],
    "paciente": []
  },
  {
    "code": "FORMACAO_RESIDENCIA",
    "group": "FORMACAO",
    "axis": "PRATICA_E_TRAJETORIA",
    "name": "Residência médica",
    "description": "Residência concluída na especialidade em questão.",
    "displayOrder": 2,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Residências concluídas",
    "patientQuestion": null,
    "responseType": "estruturado",
    "cruzamento": "humano",
    "motorParticipation": "INDIRETO",
    "required": false,
    "conditionalRules": [],
    "evidenceSource": "oficial_primaria",
    "reviewMonths": 60,
    "profissional": [],
    "paciente": []
  },
  {
    "code": "FORMACAO_ESPECIALIZACAO",
    "group": "FORMACAO",
    "axis": "PRATICA_E_TRAJETORIA",
    "name": "Especialização",
    "description": "Título de especialista ou especialização formal na área.",
    "displayOrder": 3,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Títulos de especialista",
    "patientQuestion": null,
    "responseType": "estruturado",
    "cruzamento": "humano",
    "motorParticipation": "INDIRETO",
    "required": false,
    "conditionalRules": [],
    "evidenceSource": "oficial_primaria",
    "reviewMonths": 36,
    "profissional": [],
    "paciente": []
  },
  {
    "code": "FORMACAO_FELLOWSHIP",
    "group": "FORMACAO",
    "axis": "PRATICA_E_TRAJETORIA",
    "name": "Fellowship",
    "description": "Formação avançada em subárea, no país ou fora.",
    "displayOrder": 4,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Fellowships realizados",
    "patientQuestion": null,
    "responseType": "estruturado",
    "cruzamento": "humano",
    "motorParticipation": "INDIRETO",
    "required": false,
    "conditionalRules": [],
    "evidenceSource": "oficial_primaria",
    "reviewMonths": 60,
    "profissional": [],
    "paciente": []
  },
  {
    "code": "FORMACAO_COMPLEMENTAR",
    "group": "FORMACAO",
    "axis": "PRATICA_E_TRAJETORIA",
    "name": "Formação complementar",
    "description": "Pós-graduação e cursos relevantes.",
    "displayOrder": 5,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Outras formações relevantes",
    "patientQuestion": null,
    "responseType": "estruturado",
    "cruzamento": "humano",
    "motorParticipation": "INDIRETO",
    "required": false,
    "conditionalRules": [],
    "evidenceSource": "institucional",
    "reviewMonths": 36,
    "profissional": [],
    "paciente": []
  },
  {
    "code": "EXPERIENCIA_TEMPO_DE_PRATICA",
    "group": "EXPERIENCIA",
    "axis": "PRATICA_E_TRAJETORIA",
    "name": "Tempo de prática",
    "description": "Há quanto tempo atua na especialidade.",
    "displayOrder": 1,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Há quanto tempo atua na especialidade?",
    "patientQuestion": null,
    "responseType": "escolha_unica",
    "cruzamento": "humano",
    "motorParticipation": "INDIRETO",
    "required": false,
    "conditionalRules": [],
    "evidenceSource": "institucional",
    "reviewMonths": 12,
    "profissional": [
      {
        "field": "principal",
        "options": [
          {
            "value": "ATE_2",
            "label": "Até 2 anos",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "3_A_5",
            "label": "De 3 a 5 anos",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "6_A_10",
            "label": "De 6 a 10 anos",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "11_A_20",
            "label": "De 11 a 20 anos",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "MAIS_DE_20",
            "label": "Mais de 20 anos",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ],
    "paciente": []
  },
  {
    "code": "EXPERIENCIA_VOLUME_DE_ATUACAO",
    "group": "EXPERIENCIA",
    "axis": "PRATICA_E_TRAJETORIA",
    "name": "Volume de atuação",
    "description": "Com que frequência atende esse tipo de caso.",
    "displayOrder": 4,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Com que frequência atende esse tipo de caso?",
    "patientQuestion": null,
    "responseType": "escolha_unica",
    "cruzamento": "humano",
    "motorParticipation": "INDIRETO",
    "required": false,
    "conditionalRules": [],
    "evidenceSource": "institucional",
    "reviewMonths": 12,
    "profissional": [
      {
        "field": "principal",
        "options": [
          {
            "value": "SEMANALMENTE",
            "label": "Semanalmente",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "MENSALMENTE",
            "label": "Mensalmente",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ALGUMAS_VEZES_AO_ANO",
            "label": "Algumas vezes ao ano",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "RARAMENTE",
            "label": "Raramente",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ],
    "paciente": []
  },
  {
    "code": "EXPERIENCIA_NO_TIPO_DE_CASO",
    "group": "EXPERIENCIA",
    "axis": "PRATICA_E_TRAJETORIA",
    "name": "Experiência no tipo de caso",
    "description": "Experiência na condição/procedimento e em casos semelhantes. Fusão de EXPERIENCIA_CASOS_SEMELHANTES e EXPERIENCIA_CONDICAO_OU_PROCEDIMENTO.",
    "displayOrder": 5,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Com quais condições e procedimentos você tem prática regular?",
    "patientQuestion": null,
    "responseType": "estruturado",
    "cruzamento": "humano",
    "motorParticipation": "INDIRETO",
    "required": false,
    "conditionalRules": [],
    "evidenceSource": "institucional",
    "reviewMonths": 12,
    "profissional": [],
    "paciente": []
  },
  {
    "code": "PRATICA_LIMITES_DE_ATUACAO",
    "group": "EXPERIENCIA",
    "axis": "PRATICA_E_TRAJETORIA",
    "name": "Limites de atuação",
    "description": "O que o profissional NÃO atende e quando encaminha. Protege a paciente: sem ele, a incompatibilidade só aparece na consulta — depois da espera, do deslocamento e do custo. É a Área de Atuação em negativo, e alimenta o filtro eliminatório da Curadoria.",
    "displayOrder": 6,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Quais situações você não atende e encaminha?",
    "patientQuestion": null,
    "responseType": "estruturado",
    "cruzamento": "humano",
    "motorParticipation": "INDIRETO",
    "required": false,
    "conditionalRules": [],
    "evidenceSource": "entrevista",
    "reviewMonths": 12,
    "profissional": [
      {
        "field": "encaminhamento",
        "options": [
          {
            "value": "ENCAMINHA_COM_INDICACAO",
            "label": "Encaminha com indicação",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ENCAMINHA_SEM_INDICACAO",
            "label": "Encaminha sem indicação",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ],
    "paciente": []
  },
  {
    "code": "HISTORICO_TRAJETORIA_INSTITUCIONAL",
    "group": "HISTORICO",
    "axis": "PRATICA_E_TRAJETORIA",
    "name": "Trajetória institucional",
    "description": "Serviços e instituições em que atuou.",
    "displayOrder": 2,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Vínculos institucionais atuais e anteriores",
    "patientQuestion": null,
    "responseType": "estruturado",
    "cruzamento": "humano",
    "motorParticipation": "INDIRETO",
    "required": false,
    "conditionalRules": [],
    "evidenceSource": "oficial_primaria",
    "reviewMonths": 12,
    "profissional": [],
    "paciente": []
  },
  {
    "code": "HISTORICO_ATIVIDADE_ACADEMICA",
    "group": "HISTORICO",
    "axis": "PRATICA_E_TRAJETORIA",
    "name": "Atividade acadêmica",
    "description": "Produção científica, ensino e formação de outros. Fusão de HISTORICO_PRODUCAO_ACADEMICA e HISTORICO_ENSINO_E_PESQUISA.",
    "displayOrder": 5,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Atividade acadêmica",
    "patientQuestion": null,
    "responseType": "multipla_escolha",
    "cruzamento": "humano",
    "motorParticipation": "INDIRETO",
    "required": false,
    "conditionalRules": [],
    "evidenceSource": "publica_secundaria",
    "reviewMonths": 24,
    "profissional": [
      {
        "field": "principal",
        "options": [
          {
            "value": "PUBLICA_REGULARMENTE",
            "label": "Publica regularmente",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "PUBLICOU_NO_PASSADO",
            "label": "Publicou no passado",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "LECIONA",
            "label": "Leciona",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ORIENTA_RESIDENTES",
            "label": "Orienta residentes",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "SEM_ATIVIDADE_ACADEMICA",
            "label": "Sem atividade acadêmica",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ],
    "paciente": []
  },
  {
    "code": "HISTORICO_AREAS_DE_ATUACAO",
    "group": "HISTORICO",
    "axis": "PRATICA_E_TRAJETORIA",
    "name": "Áreas de atuação",
    "description": "Áreas em que atua hoje. Formalização: já existia como professional_practice_areas; passa a ser conceito do catálogo.",
    "displayOrder": 6,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Áreas em que atua hoje",
    "patientQuestion": null,
    "responseType": "estruturado",
    "cruzamento": "humano",
    "motorParticipation": "INDIRETO",
    "required": false,
    "conditionalRules": [],
    "evidenceSource": "institucional",
    "reviewMonths": 12,
    "profissional": [],
    "paciente": []
  },
  {
    "code": "VIABILIDADE_COBERTURA_E_CONVENIO",
    "group": "VIABILIDADE",
    "axis": "VIABILIDADE_DE_ACESSO",
    "name": "Cobertura e convênio",
    "description": "Por quais formas de cobertura o profissional atende, e o que a pessoa precisa usar. Fora da matriz do Motor: sinaliza barreira objetiva, nunca elimina nem ranqueia.",
    "displayOrder": 1,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Por quais formas de cobertura você atende hoje?",
    "patientQuestion": "Como você pretende usar sua cobertura?",
    "responseType": "multipla_escolha",
    "cruzamento": "humano",
    "motorParticipation": "NUNCA",
    "required": false,
    "conditionalRules": [
      {
        "when": {
          "field": "principal",
          "value": "CONVENIOS_SELECIONADOS"
        },
        "require_detail": true
      },
      {
        "when": {
          "field": "principal",
          "value": "SUJEITO_A_CONFIRMACAO_ADMINISTRATIVA"
        },
        "require_detail": true
      }
    ],
    "evidenceSource": "institucional",
    "reviewMonths": 3,
    "profissional": [
      {
        "field": "principal",
        "options": [
          {
            "value": "EXCLUSIVAMENTE_PARTICULAR",
            "label": "Exclusivamente particular",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "CONVENIOS_SELECIONADOS",
            "label": "Convênios selecionados",
            "requiresDetail": true,
            "detailKind": "lista_operadoras",
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "EMITE_DOCUMENTACAO_PARA_REEMBOLSO",
            "label": "Emite documentação para reembolso",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "NAO_EMITE_DOCUMENTACAO_PARA_REEMBOLSO",
            "label": "Não emite documentação para reembolso",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "SUJEITO_A_CONFIRMACAO_ADMINISTRATIVA",
            "label": "Sujeito a confirmação administrativa",
            "requiresDetail": true,
            "detailKind": "condicao_estruturada",
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "NAO_INFORMADO",
            "label": "Não informado",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 6,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ],
    "paciente": [
      {
        "field": "principal",
        "options": [
          {
            "value": "PRECISO_USAR_ESTE_CONVENIO",
            "label": "Preciso usar este convênio",
            "requiresDetail": true,
            "detailKind": "operadora",
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "POSSO_USAR_REEMBOLSO",
            "label": "Posso usar reembolso",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ACEITO_ATENDIMENTO_PARTICULAR",
            "label": "Aceito atendimento particular",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "PRECISO_CONFIRMAR_MINHA_COBERTURA",
            "label": "Preciso confirmar minha cobertura",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "SEM_RESTRICAO_DECLARADA",
            "label": "Sem restrição declarada",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "NAO_SE_APLICA",
            "label": "Não se aplica",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 6,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ]
  },
  {
    "code": "VIABILIDADE_CUSTO_E_PAGAMENTO",
    "group": "VIABILIDADE",
    "axis": "VIABILIDADE_DE_ACESSO",
    "name": "Custo e pagamento",
    "description": "O custo declarado do atendimento e as formas de pagá-lo. Fora da matriz do Motor: proibido comparar faixas entre profissionais ou ordenar por preço (ADR-041 item 4).",
    "displayOrder": 2,
    "active": true,
    "catalogVersion": "1.1.0",
    "professionalQuestion": "Qual o custo da primeira consulta e como pode ser pago?",
    "patientQuestion": "O que precisa ser verdade para você conseguir pagar?",
    "responseType": "estruturado",
    "cruzamento": "humano",
    "motorParticipation": "NUNCA",
    "required": false,
    "conditionalRules": [
      {
        "when": {
          "field": "faixa",
          "value": "SUJEITO_A_CONFIRMACAO"
        },
        "require_detail": true
      },
      {
        "when": {
          "field": "formas",
          "value": "CARTAO_PARCELADO"
        },
        "require_detail": true
      }
    ],
    "evidenceSource": "institucional",
    "reviewMonths": 3,
    "profissional": [
      {
        "field": "custos_adicionais",
        "options": [
          {
            "value": "EXAMES_NAO_INCLUSOS",
            "label": "Exames não inclusos",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "RETORNO_COBRADO_A_PARTE",
            "label": "Retorno cobrado à parte",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "TAXA_DE_PROCEDIMENTO",
            "label": "Taxa de procedimento",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "SEM_CUSTOS_ADICIONAIS_CONHECIDOS",
            "label": "Sem custos adicionais conhecidos",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "NAO_INFORMADO",
            "label": "Não informado",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      },
      {
        "field": "faixa",
        "options": [
          {
            "value": "ATE_300",
            "label": "Até R$ 300",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "DE_301_A_600",
            "label": "De R$ 301 a R$ 600",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "DE_601_A_1000",
            "label": "De R$ 601 a R$ 1.000",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "DE_1001_A_2000",
            "label": "De R$ 1.001 a R$ 2.000",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ACIMA_DE_2000",
            "label": "Acima de R$ 2.000",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "SUJEITO_A_CONFIRMACAO",
            "label": "Sujeito a confirmação",
            "requiresDetail": true,
            "detailKind": "condicao_estruturada",
            "displayOrder": 6,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "NAO_INFORMADO",
            "label": "Não informado",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 7,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      },
      {
        "field": "formas",
        "options": [
          {
            "value": "DINHEIRO_OU_PIX",
            "label": "Dinheiro ou Pix",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "CARTAO_A_VISTA",
            "label": "Cartão à vista",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "CARTAO_PARCELADO",
            "label": "Cartão parcelado",
            "requiresDetail": true,
            "detailKind": "numero_parcelas",
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "TRANSFERENCIA",
            "label": "Transferência",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "BOLETO",
            "label": "Boleto",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ],
    "paciente": [
      {
        "field": "principal",
        "options": [
          {
            "value": "TENHO_LIMITE_FINANCEIRO",
            "label": "Tenho limite financeiro",
            "requiresDetail": true,
            "detailKind": "faixa",
            "displayOrder": 1,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "PRECISO_SABER_O_VALOR_ANTES_DE_ESCOLHER",
            "label": "Preciso saber o valor antes de escolher",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 2,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "ACEITO_ATE_ESTA_FAIXA",
            "label": "Aceito até esta faixa",
            "requiresDetail": true,
            "detailKind": "faixa",
            "displayOrder": 3,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "PRECISO_DE_PARCELAMENTO",
            "label": "Preciso de parcelamento",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 4,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "NAO_DECLAREI_RESTRICAO",
            "label": "Não declarei restrição",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 5,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "PREFIRO_NAO_INFORMAR",
            "label": "Prefiro não informar",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 6,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          },
          {
            "value": "NAO_SE_APLICA",
            "label": "Não se aplica",
            "requiresDetail": false,
            "detailKind": null,
            "displayOrder": 7,
            "active": true,
            "catalogVersion": "1.1.0",
            "satisfiedBy": null
          }
        ]
      }
    ]
  },
  {
    "code": "ACESSO_LOCALIZACAO",
    "group": "ACESSO",
    "axis": null,
    "name": "Localização",
    "description": "Onde atende, e o quanto isso pesa no deslocamento.",
    "displayOrder": 1,
    "active": false,
    "catalogVersion": "0.9.0",
    "professionalQuestion": null,
    "patientQuestion": null,
    "responseType": null,
    "cruzamento": null,
    "motorParticipation": null,
    "required": false,
    "conditionalRules": [],
    "evidenceSource": null,
    "reviewMonths": null,
    "profissional": [],
    "paciente": []
  },
  {
    "code": "EXPERIENCIA_CASOS_SEMELHANTES",
    "group": "EXPERIENCIA",
    "axis": null,
    "name": "Casos semelhantes",
    "description": "Experiência com situações parecidas com a desta pessoa.",
    "displayOrder": 2,
    "active": false,
    "catalogVersion": "0.9.0",
    "professionalQuestion": null,
    "patientQuestion": null,
    "responseType": null,
    "cruzamento": null,
    "motorParticipation": null,
    "required": false,
    "conditionalRules": [],
    "evidenceSource": null,
    "reviewMonths": null,
    "profissional": [],
    "paciente": []
  },
  {
    "code": "EXPERIENCIA_CONDICAO_OU_PROCEDIMENTO",
    "group": "EXPERIENCIA",
    "axis": null,
    "name": "Condição ou procedimento",
    "description": "Experiência específica na condição ou no procedimento em questão.",
    "displayOrder": 3,
    "active": false,
    "catalogVersion": "0.9.0",
    "professionalQuestion": null,
    "patientQuestion": null,
    "responseType": null,
    "cruzamento": null,
    "motorParticipation": null,
    "required": false,
    "conditionalRules": [],
    "evidenceSource": null,
    "reviewMonths": null,
    "profissional": [],
    "paciente": []
  },
  {
    "code": "HISTORICO_ENSINO_E_PESQUISA",
    "group": "HISTORICO",
    "axis": null,
    "name": "Ensino e pesquisa",
    "description": "Participação em ensino, pesquisa ou formação de outros profissionais.",
    "displayOrder": 4,
    "active": false,
    "catalogVersion": "0.9.0",
    "professionalQuestion": null,
    "patientQuestion": null,
    "responseType": null,
    "cruzamento": null,
    "motorParticipation": null,
    "required": false,
    "conditionalRules": [],
    "evidenceSource": null,
    "reviewMonths": null,
    "profissional": [],
    "paciente": []
  },
  {
    "code": "HISTORICO_PRODUCAO_ACADEMICA",
    "group": "HISTORICO",
    "axis": null,
    "name": "Produção acadêmica",
    "description": "Publicação e produção científica na área.",
    "displayOrder": 3,
    "active": false,
    "catalogVersion": "0.9.0",
    "professionalQuestion": null,
    "patientQuestion": null,
    "responseType": null,
    "cruzamento": null,
    "motorParticipation": null,
    "required": false,
    "conditionalRules": [],
    "evidenceSource": null,
    "reviewMonths": null,
    "profissional": [],
    "paciente": []
  },
  {
    "code": "HISTORICO_REGULARIDADE",
    "group": "HISTORICO",
    "axis": null,
    "name": "Regularidade profissional",
    "description": "Registro regular no conselho, sem pendência em aberto.",
    "displayOrder": 1,
    "active": false,
    "catalogVersion": "0.9.0",
    "professionalQuestion": null,
    "patientQuestion": null,
    "responseType": null,
    "cruzamento": null,
    "motorParticipation": null,
    "required": false,
    "conditionalRules": [],
    "evidenceSource": null,
    "reviewMonths": null,
    "profissional": [],
    "paciente": []
  }
];
