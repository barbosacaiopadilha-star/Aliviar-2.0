# Índice da Documentação

Mapa de todo `docs/`, por propósito. Se você não sabe onde procurar algo, comece aqui — não pelo `ls`.

Novo no projeto? Vá direto para **[ONBOARDING.md](ONBOARDING.md)**, que já traz a ordem de leitura recomendada.

## Comece aqui

| Documento | Propósito |
|---|---|
| [`../README.md`](../README.md) | Ponto de entrada: o que é o produto, status da versão. |
| [`ONBOARDING.md`](ONBOARDING.md) | Ordem de leitura para quem chega agora, humano ou agente de IA. |
| [`../CHANGELOG.md`](../CHANGELOG.md) | Histórico de entregas por sprint. |
| [`AGENTS.md`](AGENTS.md) | Documento canônico de governança dos agentes de IA — leia antes de qualquer alteração. |

## Produto

| Documento | Propósito |
|---|---|
| [`PRODUCT_ARCHITECTURE.md`](PRODUCT_ARCHITECTURE.md) | Modelagem funcional: as jornadas do paciente e da equipe Aliviar. |
| [`PRODUCT_VISION.md`](PRODUCT_VISION.md) | Missão, visão, valores, posicionamento. |
| [`PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md) | Princípios permanentes de decisão de produto. |
| [`DISCOVERY_ENGINE.md`](DISCOVERY_ENGINE.md) | Desenho do motor de busca/descoberta (porta "Busca Direta" — ver `PRODUCT_ARCHITECTURE.md` §1; ainda não implementada). |

## Arquitetura e engenharia

| Documento | Propósito |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Estado atual da arquitetura técnica — comece por aqui para "como o sistema é montado". |
| [`CODEBASE_MAP.md`](CODEBASE_MAP.md) | Onde cada módulo/rota/componente vive em `src/`. |
| [`CONVENTIONS.md`](CONVENTIONS.md) | Padrões de código já em vigor — siga antes de inventar um novo. |
| [`DATABASE.md`](DATABASE.md) | Catálogo de tabelas, migrations, o que é append-only. |
| [`ENVIRONMENT_VARIABLES.md`](ENVIRONMENT_VARIABLES.md) | Toda variável de ambiente: propósito, onde é lida, comportamento por ambiente. |
| [`ENGINEERING_PLAN.md`](ENGINEERING_PLAN.md) | Plano técnico **original** do MVP — histórico, superado (ver nota no topo do arquivo); mantido por rastreabilidade. |

## O Método ACE

| Documento | Propósito |
|---|---|
| [`ace/README.md`](ace/README.md) | Índice do Método: os 10 protocolos, hierarquia de autoridade, vocabulário essencial — comece por aqui. |
| [`ace/00-constitution/constitution.md`](ace/00-constitution/constitution.md) | Princípios permanentes e restrições arquiteturais obrigatórias. |
| [`ace/01-framework/framework.md`](ace/01-framework/framework.md) | Como o Método opera mecanicamente. |
| [`ace/02-ontology/ontology.md`](ace/02-ontology/ontology.md) | Vocabulário oficial e estável. |
| [`ace/03-kernel/kernel.md`](ace/03-kernel/kernel.md) | Regras de comportamento universais para qualquer protocolo. |
| [`ace/04-specs/P0XX-*/`](ace/04-specs/) | Especificação, prompt, exemplos, testes e changelog de cada protocolo (P001–P010). |
| [`ace/05-knowledge/README.md`](ace/05-knowledge/README.md) | Material de apoio, não normativo. |
| [`ace/06-governance/governance.md`](ace/06-governance/governance.md) | Como o Método é criado, versionado e protegido — leia antes de qualquer trabalho sobre o ACE. |

## Operação e manutenção

| Documento | Propósito |
|---|---|
| [`OPERATIONS.md`](OPERATIONS.md) | Runbook de deploy/ativação de produção, passo a passo. |
| [`DEBUGGING.md`](DEBUGGING.md) | Por onde começar a diagnosticar os problemas mais prováveis. |
| [`CREDENTIALS.md`](CREDENTIALS.md) | Inventário de credenciais — identificador/finalidade/ambiente, nunca valores. |
| [`WORKFLOW.md`](WORKFLOW.md) | Fluxo de trabalho detalhado entre os agentes de IA. |

## Marca e Landing

| Documento | Propósito |
|---|---|
| [`BRAND_GUIDELINES.md`](BRAND_GUIDELINES.md) | Personalidade, tom de voz, vocabulário, uso da marca. |
| [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) | Tokens visuais, tipografia, componentes, acessibilidade. |
| [`LANDING_CREATIVE_DIRECTION.md`](LANDING_CREATIVE_DIRECTION.md) | Direção criativa vigente da Landing (estrutura de 12 seções). |
| [`LANDING_STRATEGY.md`](LANDING_STRATEGY.md) | Estratégia original da Landing — estrutura superada pelo documento acima; tom/voz/FAQ/SEO seguem válidos. |

## Vídeo institucional

Dois vídeos distintos (ADR-017) — não confundir:

| Documento | Propósito |
|---|---|
| [`VIDEO_INSTITUCIONAL_LANDING.md`](VIDEO_INSTITUCIONAL_LANDING.md) | Vídeo de ~10min explicativo, para a Landing. |
| [`VIDEO_STORYBOARD.md`](VIDEO_STORYBOARD.md) | Roteiro do filme de marca de ~80s (Helena, 11 atos). |
| [`FILME_INSTITUCIONAL_ALIVIAR.md`](FILME_INSTITUCIONAL_ALIVIAR.md), [`FILME_PRODUCTION_PLAN.md`](FILME_PRODUCTION_PLAN.md), [`CINEMA_BIBLE.md`](CINEMA_BIBLE.md), [`KEYFRAME_GUIDE.md`](KEYFRAME_GUIDE.md) | Produção detalhada do filme de 80s: plano de produção, bíblia cinematográfica, guia de keyframes. |

## Histórico e decisões

| Documento | Propósito |
|---|---|
| [`DECISIONS.md`](DECISIONS.md) | Log de ADRs — consulte quando precisar entender **por que** algo é do jeito que é. |
| [`tasks/`](tasks/) | Tarefas historicamente delegadas ao Cursor (TASK-001 a TASK-005B) — arquivo histórico, não backlog ativo. |
