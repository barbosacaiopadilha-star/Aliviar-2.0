# Method Invariants — Design Proposal

**Este documento é apenas uma proposta arquitetural. Não possui autoridade normativa, não altera o Método, protocolos, especificações, prompts ou o Golden Set.** Em caso de divergência, prevalecem sempre Constituição → Framework → Ontologia → Kernel → especificações → ADRs (mesma precedência de `CALIBRATION_REPORT.md`). Nenhuma ADR foi criada nesta etapa em que este documento foi originalmente escrito — desde então, ADR-023 (`docs/DECISIONS.md`) formalizou o padrão "Method Invariants" descrito aqui, e ADR-024 formalizou e implementou a instância do P003 (seção "Mapeamento" abaixo, corrigida em 2026-07-15).

## Pergunta honesta primeiro: existe um padrão novo, ou estamos só agrupando o que já existe?

**Principalmente o segundo — e isso não desvaloriza a proposta.** Ao auditar o código à procura de mecanismos com a mesma forma (rejeitar, nunca corrigir, aplicado depois da validação de forma e antes da construção do artefato), encontrei que esse padrão **já existe, disperso e sem nome**, em pelo menos cinco lugares:

- `assertFieldPolicy` (`core/field-policy.ts`) — todos os protocolos.
- `assertNoForbiddenLanguage` (`artifacts/final-curadoria.ts`) — P010.
- `assertNullFieldsAreRegisteredAsMissing` (`artifacts/decision-case.ts`) — P002 (achado ao revisar para este documento — não tinha sido citado nas calibrações anteriores).
- `assertObjectiveMatchesCase` (`protocols/p004-decision-context-modeler.ts`) — P004.
- `assertNotBlocked` (`protocols/p004-decision-context-modeler.ts`) — P004.

A única peça genuinamente **nova** é a instância que falta para o P003 (categoria × severidade de um achado do modelo) — o padrão em si não é uma invenção desta proposta, é uma **formalização** de algo que os autores anteriores do ACE já reinventaram de forma independente, cinco vezes, sem nunca lhe dar um nome único. Isso ainda tem valor real: um conceito nomeado e documentado é descobrível, citável e vira um checklist para o próximo protocolo — mas é importante ser honesto que isso é principalmente organização, não arquitetura nova.

## 1. Nome recomendado

**Method Invariants** (mantendo o nome proposto) — recomendo manter, com uma ressalva de sub-taxonomia.

Considerei alternativas:
- *Constitutional Guard* (nome da calibração anterior) — mais narrativo/personificado; menos consistente com o registro de nomenclatura já usado no projeto (`field-policy.ts`, `artifact-contract.ts`, `protocol-contract.ts` — substantivos técnicos, não metáforas de "guarda").
- *Semantic Invariants* / *Content Invariants* — mais precisos sobre o que verificam (conteúdo, não estrutura), mas menos alinhados ao vocabulário já usado no Kernel ("regras do Método").
- **Method Invariants** — vence porque nomeia exatamente o que a Constituição/Kernel já chamam de "regras do Método" (não "da Constituição" isoladamente) e porque "invariante" é um termo técnico preciso: uma propriedade que deve ser sempre verdadeira num ponto de execução, exatamente a garantia que esses mecanismos oferecem.

**Ressalva de sub-taxonomia** (achado da auditoria, não uma exigência de implementação): os cinco mecanismos encontrados não são todos do mesmo tipo. `assertFieldPolicy` e `assertNoForbiddenLanguage` protegem princípios da Constituição/Kernel diretamente (o que chamaria de **Content Invariants**); `assertObjectiveMatchesCase`, `assertNotBlocked` e `assertNullFieldsAreRegisteredAsMissing` protegem consistência entre artefatos/rastreabilidade (Kernel §4), não filosofia do Método por si só (**Consistency Invariants**). Ambos cabem sob o guarda-chuva "Method Invariants", mas essa distinção pode valer a pena registrar se/quando o conceito for formalizado no Kernel.

---

## 2–8. O que a camada resolve — e o que não resolve

**1. Qual problema esta camada resolve?**
A lacuna entre "estruturalmente válido" (schema aceita) e "metodologicamente válido" (o conteúdo obedece a uma regra fechada de `specification.md`/Kernel que sintaxe de schema não consegue expressar) — especificamente quando o modelo autoatribui uma classificação semântica (severidade, categoria, um julgamento) que precisa obedecer uma regra já decidida, e nenhum mecanismo existente a cobre.

**2. Qual problema ela NÃO resolve?**
- Qualidade/naturalidade da prosa do modelo (variação de estilo é aceitável — Kernel §4).
- Ambiguidade normativa ainda não decidida (CAL-003 é o exemplo vivo — sem regra fechada, não há invariante para aplicar).
- Não "ensina" o modelo a se comportar melhor — é uma rede de segurança que atua depois que a calibração de prompt já foi tentada e mostrou seus limites (exatamente o que o CAL-002 provou).
- Não substitui Human Review — nunca decide com autoridade humana, só impede que um artefato inconstitucional chegue perto de qualquer revisão.

**3. Por que Response Schema não resolve?**
Verifica forma (tipo, enum, presença) — não pode expressar uma regra relacional entre dois campos ("se categoria é X, severidade nunca pode ser Y"). Isso é regra de negócio do Método, não estrutura de dado; misturar as duas confundiria responsabilidades que o projeto já mantém deliberadamente separadas.

**4. Por que Field Policy não resolve?**
Verifica presença de *chaves* proibidas — nunca a relação entre *valores* de campos já permitidos. `severity: "blocking"` é um valor permitido, num campo permitido; nenhuma chave proibida está envolvida. Field Policy simplesmente não tem expressividade para "esta combinação de categoria+severidade é proibida".

**5. Por que Golden Set não resolve?**
Golden Set é detecção, não prevenção. Prova que um problema existe — só quando alguém roda a suíte manualmente. Em produção, sem execução do Golden Set a cada Caso real, o mesmo comportamento passaria despercebido. Foi o Golden Set que descobriu a necessidade deste invariante; ele nunca o substitui em produção.

**6. Por que Human Review não resolve?**
P009 ocorre muito depois no pipeline (sobre Shortlist/CompatibilityMatrix), nunca sobre o CaseAudit do P003. Um Caso incorretamente `BLOCKED` no P003 nunca chega ao Human Review — é desviado do pipeline antes mesmo do P004 rodar. Depender de Human Review para pegar esse erro significaria que ele nunca seria pego.

**7. Quando ela deve atuar?**
Depois da validação de Response Schema, antes da construção do Artifact — sempre que existir uma regra fechada, já decidida em `specification.md`/Kernel, sobre a relação entre valores que o modelo produziu, e nenhum outro mecanismo já a cobre.

**8. Quando ela nunca deve atuar?**
Quando a regra ainda não foi decidida (CAL-003), quando a variação é de estilo/fraseado, ou quando o "problema" é preferência de qualidade, não violação de regra fechada.

---

## Princípios: o que a camada pode e não pode fazer

✓ **Rejeitar** — recusar a execução/artefato quando um invariante fechado é violado.
✓ **Validar** — confirmar que um invariante se sustenta, sem intervir.

✗ **Corrigir** ✗ **Reinterpretar** ✗ **Substituir** ✗ **Decidir** ✗ **Alterar automaticamente a saída do modelo**

**Justificativa filosófica:** qualquer correção automática seria o software tomando uma decisão de conteúdo reservada exclusivamente a humanos (Constituição, Princípio 3; Kernel §6) ou ao próprio modelo dentro de sua responsabilidade declarada. Se a camada "decide" que na verdade era `warning`, ela está silenciosamente afirmando saber melhor que o modelo o que deveria ter sido dito — sem nunca ter sido autorizada a esse julgamento. Rejeitar preserva a fronteira: o software audita a **forma do julgamento** (ele obedece à regra fechada?), nunca o **conteúdo do julgamento em si**. É a mesma lógica já aplicada ao P009 (Kernel §6): "a IA nunca aprova, nunca decide em nome do revisor... o software apenas... valida a consistência estrutural".

---

## Padrão — os 5 mecanismos já existentes

| Mecanismo | É um Method Invariant? | Justificativa |
|---|---|---|
| **Response Schema** (Zod) | **NÃO** | Camada anterior e diferente — verifica forma, não regra do Método. Torna possível um Method Invariant rodar depois, mas não é ele mesmo um invariante do Método. |
| **Field Policy** | **SIM** | O mais antigo e mais bem estabelecido do ACE, só nunca nomeado assim — protege um invariante fechado (certas chaves nunca aparecem, ou só a partir de um estágio), rejeitando via `ProtocolError`, nunca corrigindo. Content Invariant. |
| **`assertNoForbiddenLanguage`** | **SIM** | Protege "nenhum texto pode afirmar ranking/vencedor/score", rejeitando a construção do artefato, nunca reescrevendo o texto. Content Invariant. |
| **`assertObjectiveMatchesCase`** | **SIM** | Protege consistência estrutural entre dois artefatos (objective do DecisionContext = goal do DecisionCase) — Consistency Invariant, categoria mais estreita/técnica que os dois acima, mas mesmo padrão "rejeitar sempre, nunca corrigir". |
| **`assertNotBlocked`** | **SIM** | Pré-condição de fluxo (nunca modelar contexto sobre um Caso já bloqueado pela própria auditoria) — Consistency Invariant, mesmo padrão. |

---

## Mapeamento

| Protocolo | Invariante | Motivação | Existe hoje? | Precisa existir? |
|---|---|---|---|---|
| Todos | Field Policy (chaves proibidas) | Kernel §1.1 | Sim | — |
| P002 | Campo `null` sempre registrado em `missingInformation` (`assertNullFieldsAreRegisteredAsMissing`) | Kernel §4 (nunca inventar/omitir lacuna) | Sim | — |
| **P003** | **Categoria × Severidade** — achado sobre restrição prática nunca pode ter `severity: "blocking"` | CAL-002, evidência direta (4/4 execuções reais, incluindo pós-reforço de prompt) | **Sim** (correção de status, 2026-07-15) | **Formalizado e implementado em ADR-024 (`docs/DECISIONS.md`, commit `502c9a4`) — `assertNoInvalidPracticalBlocking` em produção; critério de aprovação por Golden Set (3 execuções reais autorizadas) ainda pendente** |
| P004 | Objective consistency (`assertObjectiveMatchesCase`); CaseAudit não-bloqueada (`assertNotBlocked`) | Kernel §4; fluxo | Sim | — |
| P004 | Urgência × sinal de prazo | CAL-003 | Não | **Condicional** — só depois que a Alternativa A/B for decidida; hoje não existe regra para aplicar |
| P005–P007 | — | Protocolos 100% determinísticos, sem classificação semântica livre do modelo | N/A | Não — não há julgamento de modelo a proteger |
| P010 | Vocabulário de ranking/vencedor (`assertNoForbiddenLanguage`) | Constituição, Princípio 2/9 | Sim | — |

---

## Limites — quando NÃO criar um Method Invariant

- Quando a regra normativa ainda não foi decidida (CAL-003 hoje) — criar o invariante nesse caso seria o mecanismo inventando Método, não protegendo-o.
- Quando o "erro" é variação de estilo/fraseado já permitida pelo Kernel §4.
- Quando o problema pode ser resolvido de forma igualmente eficaz só ajustando o prompt — deve-se sempre tentar isso primeiro, com evidência (CAL-002 só chegou a esta proposta depois de provar, com 3 execuções reais, que o prompt sozinho não bastava).
- Quando criar o invariante exigiria "adivinhar" uma regra que a especificação não decidiu.

**O que continua sendo resolvido só por prompt/modelo/Human Review/Golden Set:**
- Qualidade e naturalidade da prosa (prompt).
- Classificações onde a regra normativa ainda está em aberto (Golden Set + decisão do arquiteto — nunca um invariante).
- Julgamento clínico-adjacente que só um humano pode fazer (Human Review, P009 — nunca automatizado).
- Deriva de comportamento do modelo ao longo do tempo/versões (Golden Set, monitoramento contínuo).

---

## Riscos de exagerar

- **Excesso de invariantes**: cada regra nova aumenta a superfície de manutenção e os lugares que uma mudança de especificação precisa tocar — tensiona com o Princípio 8 da Constituição (simplicidade arquitetural) se aplicado sem disciplina.
- **Microgerenciamento do modelo**: se toda nuance de julgamento virar invariante codificado, o ACE deixa de ser "assistido por IA" e vira um sistema de regras determinísticas com um LLM decorativo por cima — o oposto do Framework ("ACE é LLM Agnostic", presume trabalho semântico real do modelo).
- **Esconder erros do modelo**: um invariante mal desenhado (ex.: rejeitar qualquer achado sobre restrição prática, mesmo quando corretamente `warning`) causa falso-positivo sistemático — trocando um problema (falso negativo silencioso) por outro (falso positivo ruidoso, execuções falhando sem motivo real).
- **Transformar o protocolo em código determinístico**: aplicado sem critério, o protocolo passa a refletir "o que o invariante permite", não "o que o Método decide" — inversão perigosa de autoridade, onde o código vira fonte de verdade em vez da especificação.

---

## Impacto

- **Altera a Constituição?** Não.
- **Altera o Framework?** Não diretamente — não cria estágio nem protocolo novo.
- **Altera o Kernel?** **Sim, se formalizada** — mereceria uma seção nova, nomeando e generalizando o padrão, análoga à seção 1.1 (Política de Campos) — que também nasceu de mecanismos dispersos e foi centralizada por uma ADR.
- **Altera protocolos?** Só o P003 receberia uma implementação nova nesta calibração; os demais já têm invariantes implícitos e não precisam de nada novo agora.
- **Altera apenas implementação?** Parcialmente — P003 sim; o Kernel também, se formalizado.

---

## Governança

**C — ambos (ADR + atualização do Kernel).**

Justificativa: é uma decisão arquitetural real (nomear e formalizar um padrão, decidir onde vive, decidir seu alcance), no mesmo molde do precedente mais próximo já existente neste projeto — ADR-014, que formalizou a "Política de campos em três camadas" a partir de mecanismos que também existiam de forma dispersa antes dela. Uma ADR registra a decisão de formalizar o conceito; a atualização do Kernel é onde o conceito, uma vez aprovado, se torna uma regra universal citável por qualquer protocolo futuro — exatamente como a seção 1.1 do Kernel funciona hoje para Field Policy.
