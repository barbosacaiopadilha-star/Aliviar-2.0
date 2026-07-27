# Índice da Documentação

Mapa de todo `docs/`, por propósito. Se você não sabe onde procurar algo, comece aqui — não pelo `ls`.

Novo no projeto? Vá direto para **[ONBOARDING.md](ONBOARDING.md)**, que já traz a ordem de leitura recomendada.

## Comece aqui

| Documento                            | Propósito                                                                              |
| ------------------------------------ | -------------------------------------------------------------------------------------- |
| [`../README.md`](../README.md)       | Ponto de entrada: o que é o produto, status da versão.                                 |
| [`ONBOARDING.md`](ONBOARDING.md)     | Ordem de leitura para quem chega agora, humano ou agente de IA.                        |
| [`../CHANGELOG.md`](../CHANGELOG.md) | Histórico de entregas por sprint.                                                      |
| [`AGENTS.md`](AGENTS.md)             | Documento canônico de governança dos agentes de IA — leia antes de qualquer alteração. |

## Produto

| Documento                                                            | Propósito                                                                                                                                                                   |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`curadoria/MODELO_CURADORIA_V1.md`](curadoria/MODELO_CURADORIA_V1.md) | **Canônico** — o modelo oficial do domínio da Curadoria: quatro camadas, dois cruzamentos independentes, vocabulário oficial e o estado da implementação. Toda ADR que alterar a Curadoria deve referenciá-lo. |
| [`FUNDAMENTOS_DO_METODO_ALIVIAR.md`](FUNDAMENTOS_DO_METODO_ALIVIAR.md) | Documento institucional fundacional: o que a Aliviar é, Curadoria Compartilhada, Perfil de Prioridades, Compatibilidade, Decisão Compartilhada e os princípios da empresa — **Proposto**, não canônico. |
| [`ONTOLOGIA_CURADORIA_COMPARTILHADA.md`](ONTOLOGIA_CURADORIA_COMPARTILHADA.md) | Modelo de conhecimento oficial da Curadoria: entidades, estados, regras, invariantes, glossário e diagrama — **Proposto**, não canônico. |
| [`EXPERIENCE_BIBLE.md`](EXPERIENCE_BIBLE.md)                         | Como paciente e Curador devem se sentir em cada etapa: jornada emocional, princípios de UX, microinterações, tom de voz — **Proposto**, não canônico. |
| [`CURATION_ENGINE_SPECIFICATION.md`](CURATION_ENGINE_SPECIFICATION.md) | O processo interno da Curadoria: seis motores, estados, eventos, gatilhos, artefatos, validações e exceções — **Proposto**, não canônico. |
| [`EXPERIENCIA_CURADORIA_COMPARTILHADA.md`](EXPERIENCIA_CURADORIA_COMPARTILHADA.md) | A coreografia entre Paciente, Curador e Sistema nos nove momentos; obrigatória para Landing, Portais, Relatórios, comunicação e treinamento — **Proposto**, não canônico. |
| [`ALIVIAR_QUALITY_SYSTEM.md`](ALIVIAR_QUALITY_SYSTEM.md)             | Sistema Oficial de Qualidade: critérios, checklist, auditoria, melhoria contínua, indicadores e certificação de Curadores — **Proposto**, não canônico. |
| [`PRODUCT_ARCHITECTURE.md`](PRODUCT_ARCHITECTURE.md)                 | Modelagem funcional: as jornadas do paciente e da equipe Aliviar.                                                                                                           |
| [`PATIENT_EXPERIENCE_BLUEPRINT.md`](PATIENT_EXPERIENCE_BLUEPRINT.md) | Blueprint de serviço da jornada do paciente, etapa a etapa, verificado contra a implementação real — não propõe mudanças.                                                   |
| [`PATIENT_ENTRY_ARCHITECTURE.md`](PATIENT_ENTRY_ARCHITECTURE.md)     | Autoridade sobre a fronteira Landing↔Produto — máquina de estados da entrada do paciente, do primeiro contato à abertura do Caso; registra zonas cinzentas sem corrigi-las. |
| [`PRODUCT_VISION.md`](PRODUCT_VISION.md)                             | Missão, visão, valores, posicionamento.                                                                                                                                     |
| [`PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md)                     | Princípios permanentes de decisão de produto.                                                                                                                               |
| [`DISCOVERY_ENGINE.md`](DISCOVERY_ENGINE.md)                         | Desenho do motor de busca/descoberta (porta "Busca Direta" — ver `PRODUCT_ARCHITECTURE.md` §1; ainda não implementada).                                                     |

## Arquitetura de domínio

Consolidação dos sete domínios oficiais (`docs/architecture/`) — mapa e invariantes cross-domínio, mais a especificação de cada um. Nenhum destes documentos estava registrado neste índice antes desta entrada; adicionados juntos para não deixar um único arquivo novo órfão ao lado de sete já existentes.

| Documento                                                                                                    | Propósito                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`architecture/ARCHITECTURE_BLUEPRINT.md`](architecture/ARCHITECTURE_BLUEPRINT.md)                           | Mapa mestre dos sete domínios, diagrama e fluxo global — comece por aqui para "qual domínio decide o quê".                                                                                                                                                         |
| [`architecture/ARCHITECTURAL_INVARIANTS.md`](architecture/ARCHITECTURAL_INVARIANTS.md)                       | Invariantes que atravessam mais de um domínio, consolidados num só lugar.                                                                                                                                                                                          |
| [`architecture/DOMAIN_JOURNEY.md`](architecture/DOMAIN_JOURNEY.md)                                           | Domínio 1 — Jornada do Paciente.                                                                                                                                                                                                                                   |
| [`architecture/DOMAIN_ACE.md`](architecture/DOMAIN_ACE.md)                                                   | Domínio 2 — Aliviar Curation Engine.                                                                                                                                                                                                                               |
| [`architecture/DOMAIN_CURATION.md`](architecture/DOMAIN_CURATION.md)                                         | Domínio 3 — Curadoria (Human Review + Entrega), P009/P010.                                                                                                                                                                                                         |
| [`architecture/DOMAIN_CONNECTION_RELATIONSHIP.md`](architecture/DOMAIN_CONNECTION_RELATIONSHIP.md)           | Domínio 4 — Connection (Implementado, ADR-027) & Relationship (Implementação em Auditoria, ADR-028). Autoridade sobre o estado formal do domínio.                                                                                                                  |
| [`architecture/DOMAIN_RELATIONSHIP.md`](architecture/DOMAIN_RELATIONSHIP.md)                                 | Teoria definitiva de estados/eventos/invariantes da parte Relationship — Veredito A (Fase 4.1). Fonte de profundidade referenciada pelo documento acima, nunca uma segunda autoridade sobre o estado do domínio.                                                   |
| [`architecture/RELATIONSHIP_TECHNICAL_ARCHITECTURE.md`](architecture/RELATIONSHIP_TECHNICAL_ARCHITECTURE.md) | Arquitetura técnica (Aggregate, camadas, persistência) derivada da teoria acima — Proposto, ainda não aprovado como canônico pelo responsável do projeto.                                                                                                          |
| [`DOMAIN_RELATIONSHIP_SPECIFICATION.md`](DOMAIN_RELATIONSHIP_SPECIFICATION.md)                               | Especificação formal anterior da parte Relationship (Fases 0-1) — parcialmente superada em profundidade por `architecture/DOMAIN_RELATIONSHIP.md`; Etapas 9-10 (papéis Curador/Atendente) não têm equivalente lá, mantida por esse conteúdo e por rastreabilidade. |
| [`OPERATIONAL_ROLES_MODEL.md`](OPERATIONAL_ROLES_MODEL.md)                                                   | Modelo de papéis operacionais humanos (Paciente, Atendente, Curador, Profissional, Administrador) — Proposto, não canônico; tensão registrada com ADR-006.                                                                                                         |
| [`architecture/DOMAIN_COMPATIBILITY_INTELLIGENCE.md`](architecture/DOMAIN_COMPATIBILITY_INTELLIGENCE.md)     | Domínio 5 — Compatibility Intelligence (Conceitual, Fases 0-6 completas).                                                                                                                                                                                          |
| [`architecture/DOMAIN_EXPERIENCE_OBSERVATORY.md`](architecture/DOMAIN_EXPERIENCE_OBSERVATORY.md)             | Domínio 6 — Observatório da Experiência (protocolo ativo, sem dado real ainda).                                                                                                                                                                                    |
| [`architecture/DOMAIN_KNOWLEDGE_GOVERNANCE.md`](architecture/DOMAIN_KNOWLEDGE_GOVERNANCE.md)                 | Domínio 7 — Governança do Conhecimento (Conceitual).                                                                                                                                                                                                               |

## Arquitetura e engenharia

| Documento                                              | Propósito                                                                                                           |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| [`BASELINE_CANONICAL_ARCHITECTURE.md`](BASELINE_CANONICAL_ARCHITECTURE.md) | **Referência oficial** do estado publicado em 2026-07-27: fluxo canônico, entrega, módulos, tabelas, funções, grants e limites conhecidos. Comece por aqui. |
| [`BACKLOG_TECNICO.md`](BACKLOG_TECNICO.md)             | Dívida técnica aberta no encerramento da migração canônica, com a evidência de cada item.                           |
| [`ARCHITECTURE.md`](ARCHITECTURE.md)                   | Estado atual da arquitetura técnica — como o sistema é montado.                                                     |
| [`CODEBASE_MAP.md`](CODEBASE_MAP.md)                   | Onde cada módulo/rota/componente vive em `src/`.                                                                    |
| [`CONVENTIONS.md`](CONVENTIONS.md)                     | Padrões de código já em vigor — siga antes de inventar um novo.                                                     |
| [`DATABASE.md`](DATABASE.md)                           | Catálogo de tabelas, migrations, o que é append-only.                                                               |
| [`ENVIRONMENT_VARIABLES.md`](ENVIRONMENT_VARIABLES.md) | Toda variável de ambiente: propósito, onde é lida, comportamento por ambiente.                                      |
| [`ENGINEERING_PLAN.md`](ENGINEERING_PLAN.md)           | Plano técnico **original** do MVP — histórico, superado (ver nota no topo do arquivo); mantido por rastreabilidade. |

## O Método ACE

| Documento                                                                    | Propósito                                                                                              |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [`ace/README.md`](ace/README.md)                                             | Índice do Método: os 10 protocolos, hierarquia de autoridade, vocabulário essencial — comece por aqui. |
| [`ace/00-constitution/constitution.md`](ace/00-constitution/constitution.md) | Princípios permanentes e restrições arquiteturais obrigatórias.                                        |
| [`ace/01-framework/framework.md`](ace/01-framework/framework.md)             | Como o Método opera mecanicamente.                                                                     |
| [`ace/02-ontology/ontology.md`](ace/02-ontology/ontology.md)                 | Vocabulário oficial e estável.                                                                         |
| [`ace/03-kernel/kernel.md`](ace/03-kernel/kernel.md)                         | Regras de comportamento universais para qualquer protocolo.                                            |
| [`ace/04-specs/P0XX-*/`](ace/04-specs/)                                      | Especificação, prompt, exemplos, testes e changelog de cada protocolo (P001–P010).                     |
| [`ace/05-knowledge/README.md`](ace/05-knowledge/README.md)                   | Material de apoio, não normativo.                                                                      |
| [`ace/06-governance/governance.md`](ace/06-governance/governance.md)         | Como o Método é criado, versionado e protegido — leia antes de qualquer trabalho sobre o ACE.          |

## Operação e manutenção

| Documento                          | Propósito                                                                     |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| [`MANUAL_CURADOR.md`](MANUAL_CURADOR.md) | **Para o Curador Médico** — Manual Operacional v1.0, alinhado ao Modelo da Curadoria: papel, jornada, os dois cruzamentos, Relatório assistido, apresentação, situações especiais, auditoria e FAQ. Referência oficial de treinamento e operação. |
| [`OPERATIONS.md`](OPERATIONS.md)   | Runbook de deploy/ativação de produção, passo a passo.                        |
| [`DEBUGGING.md`](DEBUGGING.md)     | Por onde começar a diagnosticar os problemas mais prováveis.                  |
| [`CREDENTIALS.md`](CREDENTIALS.md) | Inventário de credenciais — identificador/finalidade/ambiente, nunca valores. |
| [`WORKFLOW.md`](WORKFLOW.md)       | Fluxo de trabalho detalhado entre os agentes de IA.                           |

## Marca e Landing

| Documento                                                                          | Propósito                                                                                                                                                                          |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`BRAND_GUIDELINES.md`](BRAND_GUIDELINES.md)                                       | Personalidade, tom de voz, vocabulário, uso da marca.                                                                                                                              |
| [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)                                             | Tokens visuais, tipografia, componentes, acessibilidade.                                                                                                                           |
| [`LANDING_CREATIVE_DIRECTION.md`](LANDING_CREATIVE_DIRECTION.md)                   | Direção criativa vigente da Landing (estrutura de 12 seções).                                                                                                                      |
| [`LANDING_EXPERIENCE_PHILOSOPHY.md`](LANDING_EXPERIENCE_PHILOSOPHY.md)             | Filosofia da experiência do primeiro contato do paciente — princípios emocionais/editoriais/de interação, não estrutura nem implementação.                                         |
| [`LANDING_UX_WRITING.md`](LANDING_UX_WRITING.md)                                   | Conteúdo integral da Landing (as 12 seções), auditado contra o texto real em produção — guia editorial, glossários, regras para telas/fluxos/notificações futuras.                 |
| [`LANDING_FUNCTIONAL_SPEC.md`](LANDING_FUNCTIONAL_SPEC.md)                         | Contrato funcional das 12 seções (comportamento, estados, transições, acessibilidade) — verificado contra a implementação real; não decide UI/código.                              |
| [`LANDING_IMPLEMENTATION_ARCHITECTURE.md`](LANDING_IMPLEMENTATION_ARCHITECTURE.md) | Arquitetura de referência para implementar a Landing — módulos, motores, estados, contratos, checklists; sem código nem escolha de biblioteca.                                     |
| [`LANDING_IMPLEMENTATION_PLAYBOOK.md`](LANDING_IMPLEMENTATION_PLAYBOOK.md)         | Playbook de execução — ordem de construção, sequência de integração dos motores, estratégia de PR/rollout, checklist de pronto-para-produção.                                      |
| [`LANDING_IMPLEMENTATION_AUDIT.md`](LANDING_IMPLEMENTATION_AUDIT.md)               | Contrato de auditoria — matriz de critérios verificáveis por documento canônico, criticidade/impacto, checklists de PR/Produto/UX/Performance/Acessibilidade/Conteúdo/Arquitetura. |
| [`LANDING_STRATEGY.md`](LANDING_STRATEGY.md)                                       | Estratégia original da Landing — estrutura superada pelo documento acima; tom/voz/FAQ/SEO seguem válidos.                                                                          |

## Vídeo institucional

Dois vídeos distintos (ADR-017) — não confundir. O vídeo de lançamento vigente da Landing é o Vídeo Companheiro (ambiente, já implementado — `docs/LANDING_CREATIVE_DIRECTION.md` §4, ADR-026); nenhum dos dois documentos de roteiro abaixo descreve o vídeo hoje em produção na Landing.

| Documento                                                                                                                                                                                                  | Propósito                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [`VIDEO_INSTITUCIONAL_LANDING.md`](VIDEO_INSTITUCIONAL_LANDING.md)                                                                                                                                         | **Histórico (ADR-026)** — roteiro de ~10min explicativo, nunca produzido; não é mais o vídeo vigente da Landing. |
| [`VIDEO_STORYBOARD.md`](VIDEO_STORYBOARD.md)                                                                                                                                                               | Roteiro do filme de marca de ~80s (Helena, 11 atos) — não afetado pela ADR-026.                                  |
| [`FILME_INSTITUCIONAL_ALIVIAR.md`](FILME_INSTITUCIONAL_ALIVIAR.md), [`FILME_PRODUCTION_PLAN.md`](FILME_PRODUCTION_PLAN.md), [`CINEMA_BIBLE.md`](CINEMA_BIBLE.md), [`KEYFRAME_GUIDE.md`](KEYFRAME_GUIDE.md) | Produção detalhada do filme de 80s: plano de produção, bíblia cinematográfica, guia de keyframes.                |

## Histórico e decisões

| Documento                      | Propósito                                                                                                 |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| [`RETENCAO_E_DESCARTE_DE_CASES.md`](RETENCAO_E_DESCARTE_DE_CASES.md) | Análise e decisão (ADR-038, **proposta**) sobre descartar um Case com histórico append-only: por que ele é indestrutível hoje, o que a imutabilidade pretendia garantir, e a porta administrativa auditada recomendada. |
| [`DECISIONS.md`](DECISIONS.md) | Log de ADRs — consulte quando precisar entender **por que** algo é do jeito que é.                        |
| [`tasks/`](tasks/)             | Tarefas historicamente delegadas ao Cursor (TASK-001 a TASK-005B) — arquivo histórico, não backlog ativo. |
