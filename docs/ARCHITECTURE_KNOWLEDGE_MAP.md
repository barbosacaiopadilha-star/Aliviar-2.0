# Architecture Knowledge Map — aliviar-conexao

Mapa de governança documental: não modela produto, não modela arquitetura técnica, não modela o ACE — modela **a própria documentação**, como um Enterprise Architect leria o repositório para entender quem tem autoridade sobre o quê, o que depende do quê, onde há sobreposição, e onde há lacuna de registro. Nenhum conteúdo de nenhum documento existente foi alterado para produzir este mapa; nenhuma mudança de produto, ACE, Constituição ou Compatibility Intelligence é proposta aqui — apenas observada, quando relevante à governança documental em si.

**Método**: leitura direta de todo documento em `docs/`, `README.md`, `CHANGELOG.md`, `.cursor/rules/project-governance.mdc` e `CLAUDE.md`, em 2026-07-15, extraindo o que cada documento declara sobre si mesmo (a maioria já se autodescreve — propósito, o que não duplica, em que se baseia — o que tornou este mapa uma consolidação, não uma interpretação).

---

## 1. Mapa hierárquico da documentação

A documentação não tem uma única hierarquia — tem **seis famílias**, cada uma com autoridade interna própria, mais um conjunto de documentos de navegação sem autoridade de conteúdo (só apontam para as famílias).

```
┌─ A. Governança de agentes de IA ───────────────────────────────┐
│  AGENTS.md (canônico)                                          │
│   ├─ WORKFLOW.md (estende: detalhe de delegação)               │
│   ├─ CLAUDE.md (ponteiro, raiz do repo)                        │
│   └─ .cursor/rules/project-governance.mdc (ponteiro, Cursor)   │
└──────────────────────────────────────────────────────────────┬─┘
                                                                  │ eleva princípios a regra técnica
┌─ B. Produto — negócio e princípios ────────────────────────────▼─┐
│  PRODUCT_VISION.md (canônico — missão/visão/valores/            │
│  posicionamento; "fonte única da verdade" para produto/UX/       │
│  marketing/comunicação/IA/landing/app)                          │
│   └─ PRODUCT_PRINCIPLES.md (complementa: "como decidir")        │
│        └─ PRODUCT_ARCHITECTURE.md (modelagem funcional —        │
│             jornadas; auditado contra código real em 2026-07-15)│
│             └─ PATIENT_EXPERIENCE_BLUEPRINT.md (blueprint de    │
│                  serviço, mesma data — não redefine, detalha)   │
│        └─ DISCOVERY_ENGINE.md (arquitetura conceitual do        │
│             módulo `discovery`, ainda não implementado)         │
│  DECISIONS.md (log de ADRs — cross-cutting; registra decisão     │
│  de qualquer camada, produto ou técnica)                        │
└──────────────────────────────────────────────────────────────┬─┘
                                                                  │
┌─ C. Arquitetura técnica ────────────────────────────────────────▼─┐
│  ARCHITECTURE.md (canônico — estado atual, "V1.0 Frozen")        │
│   ├─ ENGINEERING_PLAN.md (histórico/parcialmente superado —      │
│   │    stack/módulos/papéis §2-3,6-9 ainda válidos; roadmap/     │
│   │    backlog/MVP original §1,5,13,14 superados por             │
│   │    PRODUCT_ARCHITECTURE.md, nota no topo do próprio arquivo) │
│   ├─ CODEBASE_MAP.md (ponteiro — onde, não porquê)                │
│   ├─ CONVENTIONS.md (documenta padrão já em vigor, não decide)    │
│   ├─ DATABASE.md (catálogo de leitura — fonte real é              │
│   │    `supabase/migrations/*.sql`, declarado no próprio arquivo) │
│   ├─ ENVIRONMENT_VARIABLES.md                                     │
│   ├─ CREDENTIALS.md (metadados, nunca valor)                      │
│   ├─ DEBUGGING.md, OPERATIONS.md (runbooks)                       │
│   └─ INCIDENT_CLAUDE_API_KEY_PRODUCTION.md (post-mortem, histórico)│
└────────────────────────────────────────────────────────────────┘

┌─ D. O Método ACE (hierarquia própria e fechada, declarada em    ┐
│     ace/README.md e ace/06-governance/governance.md)             │
│  ace/00-constitution/constitution.md (topo — eleva               │
│   PRODUCT_VISION.md/PRODUCT_PRINCIPLES.md a restrição             │
│   arquitetural obrigatória para IA)                               │
│   └─ ace/01-framework/framework.md (mecânica de estágios)         │
│        └─ ace/02-ontology/ontology.md (vocabulário)                │
│             └─ ace/03-kernel/kernel.md (regras universais)         │
│                  └─ ace/04-specs/P0XX-*/specification.md           │
│                       (10 protocolos, cada um: specification.md    │
│                       "sempre vence" prompt.md/examples.md/         │
│                       tests.md/changelog.md)                       │
│  ace/05-knowledge/ (não-normativo, inclui golden-set-testing.md)   │
│  ace/06-governance/governance.md (meta — descreve a própria        │
│   ordem acima, cross-cutting sobre toda a família D)                │
│  ace/README.md (índice/ponteiro)                                   │
│  CALIBRATION_ROADMAP.md, CALIBRATION_REPORT.md (operacional/       │
│   histórico, adjacente à família D, fora da hierarquia formal)     │
└────────────────────────────────────────────────────────────────┘

┌─ E. Marca e Landing ─────────────────────────────────────────────┐
│  BRAND_GUIDELINES.md (canônico — voz/personalidade)                │
│  DESIGN_SYSTEM.md (canônico — tokens visuais)                      │
│   └─ LANDING_CREATIVE_DIRECTION.md (canônico da Landing, ADR-017;  │
│        supersede a ESTRUTURA de LANDING_STRATEGY.md)                │
│        └─ LANDING_STRATEGY.md (estrutura superada; tom de voz/     │
│             FAQ/SEO permanecem válidos — autoridade dividida        │
│             dentro do mesmo arquivo, declarado no topo dele)        │
│  Família vídeo (VIDEO_INSTITUCIONAL_LANDING.md,                     │
│   VIDEO_STORYBOARD.md, FILME_INSTITUCIONAL_ALIVIAR.md,              │
│   FILME_PRODUCTION_PLAN.md, CINEMA_BIBLE.md, KEYFRAME_GUIDE.md) —   │
│   dois vídeos distintos por decisão própria (ADR-017)                │
└────────────────────────────────────────────────────────────────┘

┌─ F. Navegação (sem autoridade de conteúdo, só registro/ordem) ───┐
│  INDEX.md (índice completo por propósito)                          │
│  ONBOARDING.md (ordem de leitura recomendada)                      │
│  README.md (porta de entrada)                                      │
│  CHANGELOG.md (histórico de entregas por sprint)                   │
│  docs/tasks/*.md (tarefas historicamente delegadas — arquivo       │
│   histórico, não backlog ativo, por declaração de INDEX.md)        │
└────────────────────────────────────────────────────────────────┘
```

**Observação de fora de `docs/`**: uma quantidade real de decisão de governança e de produto — o papel "Conselheiro Permanente", a avaliação completa (sete fases conceituais) do Compatibility Intelligence, a decisão de pausar/retomar essa mesma linha de trabalho, o "Manifesto da cultura Aliviar" — existe hoje **apenas na memória do agente** (`.claude/projects/.../memory/*.md`), nunca em `docs/`. Isso está fora do escopo de arquivo deste mapa (que cobre `docs/` e os dois pontos de entrada na raiz), mas é relevante à governança documental — ver seção 5.

---

## 2. Perfil por documento

Campos condensados por família — propósito, escopo, responsável conceitual, autoridade, e a decisão que **só aquele documento** pode tomar. Dependências (quem referencia quem) estão consolidadas na seção 3, para não repetir a mesma informação duas vezes.

### A. Governança de agentes

| Documento | Propósito | Responsável conceitual | Autoridade | Decisão exclusiva |
|---|---|---|---|---|
| `AGENTS.md` | Papéis, fluxo obrigatório de 8 etapas, segurança, credenciais | Usuário (Caio), formalizado por ADR-002 | **Canônico único** para governança de processo | O fluxo de trabalho em si — nenhum outro documento pode redefinir as 8 etapas |
| `WORKFLOW.md` | Formato de delegação Claude Code → Cursor | Engenheiro Líder | Subordinado, estende AGENTS.md | O formato exato de uma delegação (campos obrigatórios) |
| `CLAUDE.md` | Ponteiro de raiz para agentes | — | Sem autoridade própria (ponteiro) | Nenhuma |
| `.cursor/rules/project-governance.mdc` | Ponteiro/resumo para o Cursor | — | Sem autoridade própria (ponteiro) | Nenhuma |

### B. Produto — negócio e princípios

| Documento | Propósito | Responsável conceitual | Autoridade | Decisão exclusiva |
|---|---|---|---|---|
| `PRODUCT_VISION.md` | Missão, visão, valores, posicionamento, cliente/não-cliente | Usuário (Caio), fundacional | **Canônico**, autodeclarado "fonte única da verdade" para produto/UX/marketing/comunicação/IA/landing/app | Missão, visão, valores, "quem é/não é o cliente" |
| `PRODUCT_PRINCIPLES.md` | 15 princípios permanentes de decisão | Usuário (Caio) | Canônico, complementar à Visão | O critério de decisão quando há conflito (o princípio prevalece, salvo exceção documentada) |
| `PRODUCT_ARCHITECTURE.md` | Modelagem funcional — jornadas do paciente/equipe/profissional, módulos, estados | Engenheiro Líder, auditado 2026-07-15 | Canônico para jornada de produto | Os estados de produto (paciente/Caso/curadoria) e o mapeamento módulo↔responsabilidade |
| `PATIENT_EXPERIENCE_BLUEPRINT.md` | Blueprint de serviço por etapa (objetivo/dado/decisão/protocolo/atrito) | Service Designer (papel adotado 2026-07-15) | Complementar — detalha, não redefine, `PRODUCT_ARCHITECTURE.md` | A leitura de "linha de visibilidade" e os textos exatos que o paciente vê por estado |
| `DISCOVERY_ENGINE.md` | Arquitetura conceitual do motor de busca (`discovery`) | Engenheiro Líder | Canônico para esse módulo especificamente, ainda não implementado | Os princípios/limitações do Discovery Engine (nunca escolhe pelo paciente, nunca posição paga) |
| `DECISIONS.md` | Log de ADRs | Usuário (Caio) aprova, Engenheiro Líder registra | Canônico para "por que" — cross-cutting | Qualquer decisão estrutural individual, uma vez registrada como ADR |

### C. Arquitetura técnica

| Documento | Propósito | Responsável conceitual | Autoridade | Decisão exclusiva |
|---|---|---|---|---|
| `ARCHITECTURE.md` | Estado atual da arquitetura técnica | Engenheiro Líder | Canônico — "comece por aqui para como o sistema é montado" | O status de congelamento da V1.0 e o que conta como mudança estrutural |
| `ENGINEERING_PLAN.md` | Plano técnico original do MVP | Engenheiro Líder (histórico) | **Autoridade dividida**: §2-3,6-9 (stack, isolamento de módulo, papéis/RLS) ainda válidas; §1,5,13,14 (MVP original, roadmap, backlog) explicitamente superadas, por nota no topo do próprio arquivo | Nenhuma decisão nova — mantido por rastreabilidade |
| `CODEBASE_MAP.md` | Onde cada módulo/rota/componente vive | Engenheiro Líder | Ponteiro de localização, sem autoridade de decisão | Nenhuma — index físico do código |
| `CONVENTIONS.md` | Padrões de código já em vigor | Engenheiro Líder | Descreve, não decide ("não introduz nenhum padrão novo") | Nenhuma nova — só a obrigação de seguir o já estabelecido |
| `DATABASE.md` | Catálogo de tabelas | Engenheiro Líder | **Explicitamente não é a fonte da verdade** — "a fonte da verdade do schema é sempre o SQL em `supabase/migrations/`" | Nenhuma — mapa de leitura rápida |
| `ENVIRONMENT_VARIABLES.md` | Catálogo de variáveis de ambiente | Engenheiro Líder | Canônico para nomes/efeitos de variável (nunca valores) | O comportamento condicional de cada variável por ambiente |
| `CREDENTIALS.md` | Inventário de credenciais (metadados) | Engenheiro Líder | Canônico para o inventário, nunca para o valor em si | Nenhuma decisão — registro obrigatório |
| `DEBUGGING.md` | Runbook de diagnóstico | Engenheiro Líder | Operacional, não normativo | Nenhuma |
| `OPERATIONS.md` | Runbook de deploy/produção | Engenheiro Líder (materializado do Artifact do GO LIVE) | Operacional, autoridade sobre a ordem de execução do deploy | A sequência de 13 passos de ativação de produção |
| `INCIDENT_CLAUDE_API_KEY_PRODUCTION.md` | Post-mortem do bug `ANTHROPIC_API_KEY`/Vercel | Engenheiro Líder | Histórico | Nenhuma nova — registra o que já aconteceu |

### D. O Método ACE

| Documento | Propósito | Responsável conceitual | Autoridade | Decisão exclusiva |
|---|---|---|---|---|
| `ace/00-constitution/constitution.md` | Princípios não-negociáveis, restrições absolutas | Usuário (Caio), "arquiteto do projeto" | **Topo da hierarquia ACE** — só uma nova versão, aprovada pelo arquiteto, pode alterá-la | As 9 restrições constitucionais e a ordem de autoridade de todo o Método |
| `ace/01-framework/framework.md` | Modelo de estágios/protocolos | Chief Architect do Método | Subordinado à Constituição | A tabela dos 10 protocolos (entrada/saída/pergunta única) |
| `ace/02-ontology/ontology.md` | Vocabulário oficial e estável | Chief Architect do Método | Subordinado ao Framework; nenhum protocolo redefine um termo aqui | O significado de cada termo (Cliente, Narrative, DecisionCase, etc.) |
| `ace/03-kernel/kernel.md` | Regras universais de comportamento | Chief Architect do Método | Subordinado à Ontologia; "como, sempre" | As restrições clínicas absolutas e a política de campos em três camadas |
| `ace/04-specs/P0XX-*/specification.md` (×10) | Especificação de cada protocolo | Chief Architect do Método | "Especificação sempre vence o prompt" — fonte da verdade por protocolo | A responsabilidade exata daquele protocolo |
| `ace/04-specs/P0XX-*/{prompt,examples,tests,changelog}.md` | Implementação/exemplo/teste/histórico do protocolo | Chief Architect do Método | Subordinado à `specification.md` do mesmo protocolo | Nenhuma decisão própria — implementam a especificação |
| `ace/05-knowledge/README.md` (+`golden-set-testing.md`) | Base de conhecimento e material de apoio | Chief Architect do Método | **Não-normativo**, declarado explicitamente | Nenhuma |
| `ace/06-governance/governance.md` | Como o Método é criado/versionado/protegido | Chief Architect do Método | Meta — descreve o processo, não o conteúdo | A regra de "documento não materializado é tratado como já aprovado" |
| `ace/README.md` | Índice do Método | Chief Architect do Método | Ponteiro | Nenhuma |
| `CALIBRATION_ROADMAP.md`, `CALIBRATION_REPORT.md` | Governança do Golden Set / calibração de modelo | Engenheiro Líder | Operacional/histórico, adjacente à família D | Nenhuma nova examinada nesta auditoria (não lidos por extenso) |

### E. Marca e Landing

| Documento | Propósito | Responsável conceitual | Autoridade | Decisão exclusiva |
|---|---|---|---|---|
| `BRAND_GUIDELINES.md` | Personalidade, voz, arquétipos | Usuário (Caio) | Canônico para "como a marca se comporta e fala" | Arquétipos (Sábio/Cuidador) e o que a marca nunca é (Herói, Bobo da Corte, Tech visionário) |
| `DESIGN_SYSTEM.md` | Tokens visuais, paleta, tipografia | Usuário (Caio), ADR-008/009 | Canônico para valor de token | A paleta aprovada (navy/sage/dourado hairline) e a divergência deliberada da referência pública |
| `LANDING_CREATIVE_DIRECTION.md` | Direção criativa vigente da Landing | Usuário (Caio), ADR-017 | Canônico da Landing — supersede a estrutura de `LANDING_STRATEGY.md` | A estrutura de seções e a "ordem emocional" vigente |
| `LANDING_STRATEGY.md` | Estratégia original de 8 seções | Usuário (Caio), histórico | **Autoridade dividida, declarada no topo do próprio arquivo**: estrutura superada; tom de voz/FAQ/SEO ainda válidos | Nenhuma nova — parcialmente ainda referência viva |
| Família vídeo (6 documentos) | Produção de dois vídeos institucionais distintos | Usuário (Caio)/produção, ADR-017 | Canônica para produção audiovisual especificamente | Roteiro, storyboard, keyframes de cada vídeo |

### F. Navegação

| Documento | Propósito | Autoridade | Decisão exclusiva |
|---|---|---|---|
| `INDEX.md` | Índice completo por propósito | Registro, sem autoridade de conteúdo | Nenhuma — mas é o único lugar que declara categoria/agrupamento dos documentos |
| `ONBOARDING.md` | Ordem de leitura recomendada | Registro | A sequência de leitura para quem chega agora |
| `README.md` | Porta de entrada do repositório | Registro + resumo de status | O resumo público de "o que existe hoje" |
| `CHANGELOG.md` | Histórico de entregas por sprint | Registro histórico | Nenhuma — apenas o que já foi entregue |
| `docs/tasks/*.md` | Tarefas historicamente delegadas ao Cursor | Histórico, não backlog ativo | Nenhuma |

---

## 3. Grafo de dependências entre documentos

Setas = "referencia/depende de", extraídas das próprias declarações de cada documento ("Baseado em:", "Não duplica:", "Estende:"), não inferidas.

```
AGENTS.md ◀── WORKFLOW.md
AGENTS.md ◀── CLAUDE.md, .cursor/rules/project-governance.mdc (ponteiros)

PRODUCT_VISION.md ◀── PRODUCT_PRINCIPLES.md
PRODUCT_VISION.md ◀── PRODUCT_ARCHITECTURE.md
PRODUCT_VISION.md ◀── DISCOVERY_ENGINE.md
PRODUCT_VISION.md ◀── BRAND_GUIDELINES.md
PRODUCT_VISION.md ◀── DESIGN_SYSTEM.md (contexto de marca)
PRODUCT_VISION.md ◀── LANDING_STRATEGY.md
PRODUCT_VISION.md ◀── ace/00-constitution/constitution.md (elevado a restrição técnica)

PRODUCT_PRINCIPLES.md ◀── DISCOVERY_ENGINE.md
PRODUCT_PRINCIPLES.md ◀── ace/00-constitution/constitution.md
PRODUCT_PRINCIPLES.md ◀── LANDING_CREATIVE_DIRECTION.md

PRODUCT_ARCHITECTURE.md ◀── PATIENT_EXPERIENCE_BLUEPRINT.md
PRODUCT_ARCHITECTURE.md ◀── LANDING_CREATIVE_DIRECTION.md (posicionamento único, sigilo do Método)
PRODUCT_ARCHITECTURE.md ◀── DATABASE.md (`cases` referencia §14)
PRODUCT_ARCHITECTURE.md ◀── ENGINEERING_PLAN.md (nota de encerramento aponta para cá)

DECISIONS.md (ADRs) ◀── citado por quase todo documento acima como justificativa pontual
  (ADR-001, 004-006, 008-009, 011, 013-014, 016-021, 022, 025 aparecem
   referenciadas nos documentos lidos nesta auditoria)

ARCHITECTURE.md ◀── ENGINEERING_PLAN.md (nota de encerramento)
ARCHITECTURE.md ◀── CODEBASE_MAP.md, CONVENTIONS.md, DATABASE.md, ENVIRONMENT_VARIABLES.md
  (todos apontam de volta para ARCHITECTURE.md como "estado atual")
ARCHITECTURE.md ◀── ONBOARDING.md, README.md, INDEX.md

DATABASE.md ──(fonte real)──▶ supabase/migrations/*.sql (fora de docs/)
CODEBASE_MAP.md ──(não duplica)──▶ CONVENTIONS.md, ARCHITECTURE.md
CONVENTIONS.md ──(não duplica)──▶ DESIGN_SYSTEM.md, ENGINEERING_PLAN.md, AGENTS.md, WORKFLOW.md, ace/ (comentários)
DEBUGGING.md ──(não repete)──▶ ace/*, DATABASE.md
DEBUGGING.md ──▶ ENVIRONMENT_VARIABLES.md (tabela de failureCode)
OPERATIONS.md ──▶ ENVIRONMENT_VARIABLES.md, AGENTS.md
ENVIRONMENT_VARIABLES.md ──▶ CREDENTIALS.md, AGENTS.md, INCIDENT_CLAUDE_API_KEY_PRODUCTION.md (contexto do bug)

ace/00-constitution/constitution.md ──(eleva)──▶ PRODUCT_VISION.md, PRODUCT_PRINCIPLES.md
ace/README.md ──▶ 00-constitution → 01-framework → 02-ontology → 03-kernel → 04-specs → 05-knowledge → 06-governance (ordem obrigatória)
ace/01-framework/framework.md ──(não redefine)──▶ 00-constitution, 02-ontology
ace/03-kernel/kernel.md ──(implementa)──▶ ace/00-constitution/constitution.md
ace/06-governance/governance.md ──(consolida)──▶ toda a família D
ace/05-knowledge/README.md ──▶ golden-set-testing.md ──▶ CONVENTIONS.md (camada de teste `tests/golden/`)

BRAND_GUIDELINES.md ◀── DESIGN_SYSTEM.md (seção 0), CONVENTIONS.md ("Voz e mensagens")
DESIGN_SYSTEM.md ◀── ENGINEERING_PLAN.md, DECISIONS.md (ADR-008/009)
LANDING_CREATIVE_DIRECTION.md ──(supersede estrutura)──▶ LANDING_STRATEGY.md
LANDING_STRATEGY.md ◀── PRODUCT_VISION.md, BRAND_GUIDELINES.md
Família vídeo ◀── DECISIONS.md (ADR-017, distinção dos dois vídeos)

INDEX.md ──▶ aponta para todos os documentos de docs/ (única fonte de agrupamento)
ONBOARDING.md ──▶ README.md → PRODUCT_ARCHITECTURE.md → ace/README.md → ARCHITECTURE.md →
  CODEBASE_MAP.md → CONVENTIONS.md → DATABASE.md → DECISIONS.md (ordem de leitura prescrita)
README.md ──▶ INDEX.md, ONBOARDING.md, AGENTS.md, ARCHITECTURE.md, CODEBASE_MAP.md,
  PRODUCT_ARCHITECTURE.md, ace/README.md, CHANGELOG.md, DECISIONS.md
```

**Nós sem nenhuma referência de entrada encontrada** (ninguém em `docs/` aponta para eles, mesmo indiretamente): `CALIBRATION_ROADMAP.md`, `CALIBRATION_REPORT.md`, `ARCHITECTURE_KNOWLEDGE_MAP.md` (este documento, recém-criado) e `PATIENT_EXPERIENCE_BLUEPRINT.md` (recém-criado, ainda não referenciado por nenhum outro documento além de citar `PRODUCT_ARCHITECTURE.md`) — não é um defeito, apenas o estado real até este momento.

---

## 4. Matriz "Fonte da Verdade"

| Tema | Documento-autoridade | Nota |
|---|---|---|
| Missão, visão, valores, posicionamento | `PRODUCT_VISION.md` | Autodeclarado "fonte única da verdade" |
| Critério de decisão de produto | `PRODUCT_PRINCIPLES.md` | Complementar à Visão |
| Jornada do paciente/equipe (produto) | `PRODUCT_ARCHITECTURE.md` | Auditado 2026-07-15 |
| Jornada do paciente (blueprint de serviço) | `PATIENT_EXPERIENCE_BLUEPRINT.md` | Detalha, não redefine `PRODUCT_ARCHITECTURE.md` |
| Motor de busca/descoberta (`discovery`) | `DISCOVERY_ENGINE.md` | Ainda não implementado |
| Justificativa de qualquer decisão estrutural | `DECISIONS.md` | Log de ADRs, cross-cutting |
| Arquitetura técnica atual | `ARCHITECTURE.md` | "Comece por aqui" |
| Stack tecnológica | `DECISIONS.md` (ADR-005) + `ENGINEERING_PLAN.md` §3 | Decisão em ADR, detalhe no plano |
| Isolamento de módulo/papéis/RLS | `ENGINEERING_PLAN.md` §2,6-9 | Seções ainda válidas do plano |
| Onde cada coisa vive no código | `CODEBASE_MAP.md` | Só localização, não decisão |
| Padrões de código já em vigor | `CONVENTIONS.md` | Descreve, não decide |
| Schema de banco (leitura rápida) | `DATABASE.md` | **Não é a fonte real** |
| Schema de banco (fonte real) | `supabase/migrations/*.sql` | Fora de `docs/`, declarado no próprio `DATABASE.md` |
| Variáveis de ambiente | `ENVIRONMENT_VARIABLES.md` | Nomes/efeitos, nunca valor |
| Credenciais (inventário) | `CREDENTIALS.md` | Metadados, nunca valor |
| Deploy/produção | `OPERATIONS.md` | Runbook |
| Diagnóstico de incidente em operação | `DEBUGGING.md` | Runbook |
| Constituição do Método (ACE) | `ace/00-constitution/constitution.md` | Topo da hierarquia ACE |
| Mecânica de estágios/protocolos do ACE | `ace/01-framework/framework.md` | — |
| Vocabulário oficial do ACE | `ace/02-ontology/ontology.md` | Nenhum protocolo redefine termo daqui |
| Regras universais de comportamento do ACE | `ace/03-kernel/kernel.md` | — |
| Responsabilidade de cada protocolo (P001-P010) | `ace/04-specs/P0XX-*/specification.md` | "Especificação sempre vence o prompt" |
| Como o Método é versionado/protegido | `ace/06-governance/governance.md` | Meta-processo |
| Voz e personalidade de marca | `BRAND_GUIDELINES.md` | — |
| Tokens visuais (cor, tipografia) | `DESIGN_SYSTEM.md` | — |
| Estrutura atual da Landing | `LANDING_CREATIVE_DIRECTION.md` | Supersede `LANDING_STRATEGY.md` nisso |
| Tom de voz/FAQ/SEO da Landing | `LANDING_STRATEGY.md` (ainda válido) | Autoridade dividida — ver seção 5 |
| Produção de vídeo institucional | Família vídeo (6 docs) | ADR-017 distingue os dois vídeos |
| Histórico de entregas | `CHANGELOG.md` | — |
| Agrupamento/índice de toda a documentação | `INDEX.md` | Único registro central existente |
| Ordem de leitura para quem chega agora | `ONBOARDING.md` | — |
| Governança de agentes de IA (processo) | `AGENTS.md` | Canônico único, ADR-002 |
| Compatibility Intelligence (qualquer fase) | **Nenhum documento em `docs/`** | Existe hoje só como memória do agente — ver seção 5 |

---

## 5. Lista de possíveis conflitos documentais

1. **`LANDING_STRATEGY.md` vs. `LANDING_CREATIVE_DIRECTION.md`** — não é uma contradição não resolvida (o próprio `LANDING_STRATEGY.md` se declara parcialmente superado no topo), mas é uma **autoridade partida dentro de um único tema**: para saber a estrutura de seções da Landing hoje, o documento certo é `LANDING_CREATIVE_DIRECTION.md`; para tom de voz/FAQ/SEO, é preciso voltar a `LANDING_STRATEGY.md`. Um leitor que abra só um dos dois tem uma leitura incompleta.

2. **`ENGINEERING_PLAN.md`** tem o mesmo padrão internamente: §2-3,6-9 vigentes, §1,5,13,14 históricas — a nota de encerramento no topo resolve isso para quem lê o documento inteiro, mas nada impede uma citação futura a "`ENGINEERING_PLAN.md` diz X" sem qualificar se X está na parte vigente ou na histórica.

3. **Múltiplas declarações independentes de "documento canônico"** — `PRODUCT_VISION.md`, `BRAND_GUIDELINES.md`, `DESIGN_SYSTEM.md`, `LANDING_CREATIVE_DIRECTION.md`, `DISCOVERY_ENGINE.md`, `AGENTS.md` cada um se autodeclara canônico para seu recorte. Isso está correto hierarquicamente (cada um é canônico dentro do seu escopo, aninhado sob `PRODUCT_VISION.md`), mas a autoridade é **autodeclarada por arquivo**, não registrada num único lugar central que confirme que não há dois documentos reivindicando o mesmo tema — a matriz da seção 4 deste mapa é, até este momento, o único registro consolidado desse tipo.

4. **Compatibility Intelligence não existe em `docs/`** — o achado mais relevante desta auditoria. Um volume real de decisão conceitual (arquitetura do motor, ontologia de fatores, teoria de evidência, modelo de governança) foi produzido e existe apenas na memória do agente, nunca materializado como arquivo em `docs/`. Isso significa que `docs/AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/INDEX.md` e `docs/ONBOARDING.md` — os documentos que qualquer sessão nova (humana ou de IA) é instruída a ler primeiro — não revelam, por si só, que esse trabalho existe. Registrado aqui como observação de governança documental; nenhuma proposta de onde/como materializá-lo é feita, por estar fora do escopo desta consolidação.

5. **Correções factuais versus ADR** — a auditoria de `PRODUCT_ARCHITECTURE.md` feita em 2026-07-15 (mesma data) corrigiu a máquina de estados do Caso (§14) e o modelo de persistência de `story` (§8) diretamente no texto, sem abrir uma nova entrada em `DECISIONS.md`. Isso é consistente com o padrão observado (`ENGINEERING_PLAN.md` também foi corrigido por nota, não por ADR retroativo), mas levanta uma pergunta de governança ainda sem critério explícito em nenhum documento lido: quando uma correção de "o que já é verdade no código" precisa de ADR, e quando basta uma nota de auditoria no próprio documento? Nenhum documento define essa fronteira hoje.

6. **`docs/tasks/*.md`** está fisicamente na mesma árvore de `docs/` que documentos ativos, distinguido de "backlog ativo" só por uma frase em `INDEX.md` — quem navega pelo sistema de arquivos diretamente (sem passar por `INDEX.md`) não tem esse sinal.

---

## 6. Recomendações de organização documental

Recomendações de **organização e registro**, não de conteúdo — nenhuma delas altera o texto de um documento existente; todas são, no máximo, ideias a avaliar, não ações executadas aqui.

1. **Front-matter de autoridade machine-legible.** Hoje "canônico"/"superado"/"histórico" é uma frase em prosa, sempre no topo de cada arquivo, mas em formato livre. Um bloco curto e padronizado (ex.: `Autoridade: Canônico | Complementar | Histórico-parcial | Índice`) no topo de cada documento tornaria a matriz da seção 4 derivável automaticamente, em vez de precisar ser reconstruída por leitura manual como foi feito aqui.

2. **Um único ponto de verdade para "quem referencia quem".** O grafo da seção 3 hoje só existe porque cada documento diz, em prosa, do que depende — não há, em nenhum lugar do repositório, um registro estruturado equivalente. `INDEX.md` agrupa por categoria, mas não expõe dependência.

3. **Sinalização explícita de documentos sem consumidor conhecido.** `CALIBRATION_ROADMAP.md`/`CALIBRATION_REPORT.md` (e, agora, este próprio mapa e o Blueprint) não são referenciados por nenhum outro documento — não é necessariamente um problema, mas hoje não há como distinguir "documento novo, ainda não referenciado" de "documento órfão, esquecido" sem uma auditoria como esta.

4. **Um marcador visual consistente para autoridade dividida dentro do mesmo arquivo** (o padrão já usado em `ENGINEERING_PLAN.md` e `LANDING_STRATEGY.md`) — por exemplo, sempre no mesmo formato de nota-de-topo — ajudaria a reconhecer esse padrão à primeira vista em vez de precisar ler a nota inteira para descobrir se ela existe.

5. **Este mapa e o `PATIENT_EXPERIENCE_BLUEPRINT.md` não foram registrados em `INDEX.md`**, deliberadamente, para respeitar "não alterar nenhum documento existente" nesta rodada. Fica como decisão em aberto do usuário se e quando registrá-los.
