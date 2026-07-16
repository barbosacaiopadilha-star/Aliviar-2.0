# Domínio: Relationship — Teoria Definitiva de Estados e Eventos

**Estado**: Conceitual — teoria formal consolidada ao longo de 6 fases desta sessão (Fases 0-4.1 de Relationship). **Veredito atualizado na Fase 4.1: A** (ver Etapa 12) — as três lacunas conceituais bloqueantes identificadas na Fase 4 (divergência entre relatos, profissional que sai da plataforma, falecimento do paciente) foram fechadas com decisão e justificativa, sem transformar nenhuma hipótese em decisão sem base. Os itens que permanecem abertos (PAUSADO, processo de verificação de evidência de óbito) já eram classificados como lacunas de Produto/Operacionais, não conceituais — não bloqueiam o início do desenho técnico, pelo mesmo critério já usado na promoção de Connection (Fase 4 de Connection: E2E e teste de Server Action ficaram como ressalvas não-bloqueantes). `src/modules/relationship` continua não existindo, nem mesmo como pasta reservada. Nenhum código, schema, migration ou API foi criado ou alterado para produzir este documento ou sua atualização.

**Nota de duplicação — resolvida (Fase 6.2, `docs/DECISIONS.md` ADR-028)**: `docs/architecture/DOMAIN_CONNECTION_RELATIONSHIP.md` permanece a entrada oficial do domínio 4 ("Connection & Relationship Engine") na tabela de `ARCHITECTURE_BLUEPRINT.md` — inclusive o estado formal do domínio (hoje, Relationship: Implementação em Auditoria). Este documento, `DOMAIN_RELATIONSHIP.md`, não é uma segunda autoridade paralela: é a fonte detalhada de teoria (estados, eventos, invariantes, fronteiras) referenciada por aquele, exatamente o padrão que `docs/DOCUMENTATION_GOVERNANCE_POLICY.md` §3 recomenda para dois documentos endereçando o mesmo tema ("um precisa ser reclassificado como referência que aponta para o outro"). Nada neste documento decide o estado formal do domínio — isso é exclusivo de `DOMAIN_CONNECTION_RELATIONSHIP.md`/ADR.

**Autoridade**: subordinado a `ARCHITECTURE_BLUEPRINT.md`, `ARCHITECTURAL_INVARIANTS.md`, `docs/OPERATIONAL_ROLES_MODEL.md` (Proposto) e, acima de todos, à Constituição da Aliviar. Nenhuma decisão aqui contradiz ADR-006 ou ADR-027 — onde há tensão com eles, é registrada, nunca resolvida unilateralmente (ver Etapa 6/11).

---

## Etapa 1 — Identidade do domínio

- **O que é um Relationship?** O registro fiel de um ciclo de cuidado continuado entre um paciente e um profissional específicos, iniciado pela confirmação real de um primeiro atendimento.
- **Qual fato ele representa?** Que um cuidado real começou e está sendo acompanhado — nunca uma promessa, nunca uma intenção, sempre um fato já ocorrido.
- **Qual sua finalidade?** Produzir, de forma append-only e nunca inferida, os fatos brutos que permitem à Aliviar saber se um cuidado continua, pausou, mudou de rumo ou terminou — sem nunca julgar o mérito desse cuidado.
- **O que ele nunca representa?** Uma avaliação de qualidade do cuidado; uma opinião sobre se o par paciente-profissional "funcionou" (isso é exclusivo do CI); uma extensão ou fase da Connection que o originou.
- **Qual sua identidade?** O par (paciente, profissional) originado por uma Connection específica — um Relationship é sempre identificável por essa Connection de origem, nunca por si só.
- **Quem é seu dono?** O paciente é a autoridade primária sobre seu conteúdo (Etapa 6, `OPERATIONAL_ROLES_MODEL.md`); o Sistema é seu guardião estrutural (integridade, imutabilidade, append-only) — nenhum dos dois é "dono" no sentido de poder alterar livremente: o paciente relata fatos, o sistema os preserva.
- **Quem pode criá-lo?** Ninguém "cria" diretamente — ele nasce automaticamente do evento `PRIMEIRO_ATENDIMENTO_REALIZADO` de uma Connection, relatado pelo paciente (hoje) ou pelo profissional (quando houver canal).
- **Quem pode encerrá-lo?** O paciente (sempre); o profissional (quando houver canal); a equipe, só excepcionalmente, com evidência concreta e autoria nomeada.
- **Quem nunca altera sua história?** CI, Observatório, ACE, Curadoria, Journey — nenhum tem autoridade de escrita. Nem mesmo o paciente ou a equipe podem editar um evento já registrado — só adicionar um evento novo de correção.

---

## Etapa 2 — Estados

| Candidato                 | Definição                                                           | Evento de entrada                             | Evento de saída                      | Duração                            | Evidência documental                                                                                                                                       | Pertence ao domínio?                              | Classificação  |
| ------------------------- | ------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------ | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------------- |
| **ATIVO**                 | Relationship existe e não foi encerrado por nenhum evento explícito | Nascimento (`PRIMEIRO_ATENDIMENTO_REALIZADO`) | Qualquer Encerramento                | Sem teto, sem piso, nunca inferida | Fases 0-2 desta sessão                                                                                                                                     | Sim                                               | **Confirmado** |
| **ENCERRADO**             | Ciclo de cuidado daquele registro chegou a um fim definitivo        | Qualquer Encerramento                         | Nenhum — terminal                    | N/A                                | Fases 0-2                                                                                                                                                  | Sim                                               | **Confirmado** |
| **PAUSADO**               | Hiato explicitamente declarado, com motivo real                     | Pausa Declarada (não oficializada)            | Continuidade Relatada / Encerramento | Indeterminada                      | Fase 1, Etapa 10 — só uma consequência de domínio identificada (modular cadência de check-in); evento de origem, necessidade de data e teto nunca fechados | Candidato, com consequência real mas incompleta   | **Hipótese**   |
| REABERTO                  | —                                                                   | —                                             | —                                    | —                                  | Fase 0, Etapa 6 — testado e refutado como estado interno                                                                                                   | Não — é sempre um ciclo novo, nunca uma transição | **Rejeitado**  |
| EM_DIVERGÊNCIA / PENDENTE | —                                                                   | —                                             | —                                    | —                                  | Fase 1, Etapa 5 — testado e refutado por não ter consequência de domínio própria comprovada                                                                | Não                                               | **Rejeitado**  |

Nenhum outro estado surgiu naturalmente ao longo desta fase além dos já mapeados nas Fases 0-2.

---

## Etapa 3 — Eventos

### Eventos do domínio (mudam estado ou constituem o núcleo factual)

| Evento                    | Declara                               | Registra               | Autoridade            | Pré-condições                                         | Pós-condições                                 | Altera estado?                   | Produz ExperienceSignal? | Journey | CI  | Observatório                |
| ------------------------- | ------------------------------------- | ---------------------- | --------------------- | ----------------------------------------------------- | --------------------------------------------- | -------------------------------- | ------------------------ | ------- | --- | --------------------------- |
| **Nascimento**            | Paciente (hoje)/profissional (futuro) | O declarante           | Paciente/profissional | Connection em `DECISAO_REGISTRADA`/`CONTATO_INICIADO` | Connection terminal; Relationship nasce ATIVO | Sim (cria)                       | Sim — fato de origem, L3 | Não     | Sim | Não                         |
| **Continuidade Relatada** | Paciente/profissional                 | O declarante/Atendente | Paciente/profissional | Relationship ATIVO                                    | Nenhuma mudança de rótulo                     | Não                              | Sim                      | Não     | Sim | Não                         |
| **Encerramento**          | Paciente/profissional                 | O declarante/Atendente | Paciente/profissional | Relationship ATIVO                                    | Relationship ENCERRADO                        | Sim                              | Sim                      | Não     | Sim | Talvez (se atrito relatado) |
| **Troca de Profissional** | Paciente                              | Paciente               | Paciente, exclusiva   | Relationship ATIVO                                    | ENCERRADO + novo ciclo de Connection          | Sim                              | Sim                      | Não     | Sim | Não                         |
| **Reabertura**            | Paciente                              | Paciente               | Paciente, exclusiva   | Relationship ENCERRADO                                | Novo Caso nasce (fora deste registro)         | Não (o registro antigo não muda) | Sim (`REABERTA`)         | Sim     | Sim | Não                         |

### Eventos administrativos (integridade do registro, não mudança operacional cotidiana)

| Evento                          | Declara                     | Registra      | Autoridade                            | Pré-condições                    | Pós-condições                  | Altera estado?      | ExperienceSignal?                                         |
| ------------------------------- | --------------------------- | ------------- | ------------------------------------- | -------------------------------- | ------------------------------ | ------------------- | --------------------------------------------------------- |
| **Encerramento Administrativo** | Equipe (excepcional)        | Equipe        | Administrador, com evidência concreta | Situação excepcional documentada | Relationship ENCERRADO         | Sim                 | Sim, mas marcado como administrativo, não espontâneo      |
| **Correção de Registro**        | Autor do relato original    | O mesmo       | O autor original                      | Evento anterior existente        | Nenhuma — só adiciona contexto | Não necessariamente | Não                                                       |
| **Contestação**                 | Parte que discorda (futuro) | O contestante | A outra parte, quando houver canal    | Evento anterior existente        | Nenhuma automática             | Não                 | Não — é sinal de divergência, não fato de compatibilidade |

### Eventos operacionais (suporte, fora do núcleo do domínio)

| Evento                   | Declara               | Registra | Autoridade | Altera estado?                                          |
| ------------------------ | --------------------- | -------- | ---------- | ------------------------------------------------------- |
| **Solicitação de Ajuda** | Paciente/profissional | O autor  | O autor    | Não — efeito puramente operacional (aciona a Atendente) |

---

## Etapa 4 — Máquina de Estados

```
(inexistente)
      │ Nascimento (paciente/profissional)
      ▼
   ATIVO ──┐
      │◀───┘ Continuidade Relatada (não muda estado)
      │
      ├── Encerramento ──────────────────▶ ENCERRADO (terminal)
      └── Troca de Profissional ─────────▶ ENCERRADO (terminal) + novo ciclo de Connection (fora desta máquina)

ENCERRADO ── [fora desta máquina] Reabertura ──▶ novo Caso ──▶ nova Connection ──▶ Relationship inteiramente novo
```

| Origem          | Destino                | Evento                | Responsável                               | Condições                                                 | Restrições                               |
| --------------- | ---------------------- | --------------------- | ----------------------------------------- | --------------------------------------------------------- | ---------------------------------------- |
| _(inexistente)_ | ATIVO                  | Nascimento            | Paciente/profissional                     | Connection em estado não-terminal, ainda sem Relationship | Não repetível para a mesma Connection    |
| ATIVO           | ATIVO                  | Continuidade Relatada | Paciente/profissional                     | Relationship já ATIVO                                     | Repetível indefinidamente                |
| ATIVO           | ENCERRADO              | Encerramento          | Paciente/profissional/equipe(excepcional) | Relationship ATIVO                                        | Irreversível para este registro          |
| ATIVO           | ENCERRADO + novo ciclo | Troca de Profissional | Paciente, exclusivo                       | Relationship ATIVO                                        | Nunca reabre a Connection de origem      |
| ENCERRADO       | _(fora desta máquina)_ | Reabertura            | Paciente, exclusivo                       | Relationship ENCERRADO                                    | Sempre um Caso novo, nunca este registro |

- **Existe retorno?** Não — nenhuma transição volta a um estado anterior do mesmo registro.
- **Existe edição retroativa?** Não — toda correção é um evento novo, aditivo.
- **Existe reabertura?** Sim, mas sempre como um ciclo (Caso→Connection→Relationship) inteiramente novo.
- **Existe mutação da origem?** Não — a Connection de origem, o paciente e o profissional de um Relationship são imutáveis para sempre naquele registro.
- **Existe criação automática?** Não — todo Relationship nasce de um evento humano explícito, nunca de um processo automático ou de inferência.

---

## Etapa 5 — Invariantes

| Invariante                                 | Confirmado/Rejeitado | Evidência                                                                      |
| ------------------------------------------ | -------------------- | ------------------------------------------------------------------------------ |
| Nasce uma única vez                        | **Confirmado**       | Nascimento não é repetível — Connection é terminal após esse evento            |
| Nunca muda a Connection de origem          | **Confirmado**       | Connection imutável após terminal, testado em produção (Fase 4, Connection)    |
| Nunca muda o paciente                      | **Confirmado**       | Identidade fixa desde o nascimento                                             |
| Nunca muda o profissional de origem        | **Confirmado**       | Troca de profissional sempre gera um Relationship novo, nunca muta o atual     |
| Nunca termina por silêncio                 | **Confirmado**       | Todo encerramento exige evento explícito                                       |
| Nunca nasce por inferência                 | **Confirmado**       | Nascimento exige relato explícito do fato real                                 |
| Nunca interpreta fatos                     | **Confirmado**       | Interpretação é exclusiva do CI (`DOMAIN_COMPATIBILITY_INTELLIGENCE.md`)       |
| Nunca substitui Journey                    | **Confirmado**       | Relationship só produz o sinal de reabertura; quem cria o Caso é a Jornada/ACE |
| Nunca substitui Compatibility Intelligence | **Confirmado**       | Relationship produz fato bruto, nunca hipótese                                 |
| Nunca altera Connection                    | **Confirmado**       | Nenhuma escrita proposta em nenhuma fase                                       |

**Invariantes adicionais, descobertos ao longo das Fases 0-3.5, reafirmados aqui**:

- Nenhum evento é editado ou apagado (append-only).
- Nenhuma autoridade de resolução de conflito é presumida sem decisão documental.
- Nenhum estado é declarado oficial sem consequência de domínio própria e evento de origem explícito (razão de PAUSADO permanecer Hipótese).
- Reabertura nunca reabre um Caso já fechado — só origina um Caso novo (herdado do invariante #14 pré-existente, `ARCHITECTURAL_INVARIANTS.md`).

---

## Etapa 6 — Fronteiras

- **Connection**: termina exatamente no evento `PRIMEIRO_ATENDIMENTO_REALIZADO`; Relationship nunca toca Connection depois disso, exceto para produzir uma NOVA Connection via Troca de Profissional (nunca a antiga).
- **Curadoria**: termina na entrega (P010); Relationship nunca gera ou revisa Shortlist, nunca reinterpreta a Curadoria entregue.
- **Journey**: Relationship produz o sinal de reabertura; quem efetivamente cria o Caso novo é a Jornada/ACE — a fronteira é o sinal, não o Caso em si.
- **Compatibility Intelligence**: recebe fatos brutos, unidirecional; nunca decide nada sobre o próprio Relationship.
- **Observatório**: recebe atrito operacional sobre o USO do produto por quem vive um Relationship, nunca sobre o mérito do cuidado em si.
- **Operação Humana** (`OPERATIONAL_ROLES_MODEL.md`): a Atendente acompanha continuamente, o Curador reentra por escalonamento — mas **nenhum dos dois tem hoje um ponto de integração técnica formal com os eventos deste domínio** (achado repetido desde a Fase 3.5, não resolvido aqui). Essa fronteira, especificamente, permanece teórica, não técnica.

Nenhuma responsabilidade permanece duplicada entre os seis limites acima.

---

## Etapa 7 — Linha do tempo

```
Connection (decisão + primeiro contato)
      │
      ▼
Primeiro atendimento confirmado ── (evento-fronteira, mesmo fato para os dois domínios)
      │
      ▼
Nascimento do Relationship (ATIVO)
      │
      ├── Continuidade Relatada (0..N vezes, atravessa CI a cada ocorrência)
      ├── Correções (0..N vezes, quando necessário)
      ├── [Pausa Declarada — hipótese, não oficial]
      │
      ▼
Encerramento (por qualquer categoria válida) ── atravessa CI (fato bruto), possivelmente Observatório (atrito)
      │
      ├──▶ Troca de Profissional: atravessa Connection (novo ciclo, mesmo Caso)
      │
      └──▶ [futuro, fora deste registro] Reabertura: atravessa Journey/ACE (novo Caso) e CI (`REABERTA`)
```

Pontos de atravessamento de domínio, nomeados explicitamente: (1) nascimento — fronteira com Connection; (2) cada fato relatado — fronteira com CI; (3) encerramento com atrito — fronteira com Observatório; (4) troca de profissional — fronteira de volta a Connection; (5) reabertura — fronteira com Journey/ACE.

---

## Etapa 8 — Casos limite

| Caso                                  | Relationship reage ou apenas registra?                                                                                        | Detalhe                                                                                                                                                                                                            |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Paciente desaparece**               | Apenas registra (a ausência, que não é um fato)                                                                               | Nunca transiciona por isso — permanece ATIVO indefinidamente                                                                                                                                                       |
| **Paciente troca de profissional**    | Reage                                                                                                                         | Mecanismo já formalizado (Etapa 3/4)                                                                                                                                                                               |
| **Profissional deixa a plataforma**   | Apenas registra (o profissional de origem permanece imutável)                                                                 | **Resolvido, Fase 4.1**: fato técnico de outro domínio, nunca transiciona/encerra sozinho; Atendente comunica, paciente decide via os eventos já existentes                                                        |
| **Paciente retorna anos depois**      | Se ainda ATIVO: apenas registra (Continuidade). Se já ENCERRADO: reage, mas via Reabertura (ação do paciente, nunca do tempo) | Nenhuma duração máxima existe                                                                                                                                                                                      |
| **Novo Caso**                         | Reage produzindo o sinal; nunca cria o Caso diretamente                                                                       | Fronteira com Journey/ACE                                                                                                                                                                                          |
| **Encerramento administrativo**       | Reage, só mediante evento humano explícito com evidência                                                                      | Nunca por padrão                                                                                                                                                                                                   |
| **Falecimento**                       | Reage, como Encerramento (motivo específico)                                                                                  | **Resolvido, Fase 4.1**: `ENCERRADO` com motivo, nunca estado próprio; Administrador registra a partir de evidência externa verificada; processo exato de verificação permanece lacuna operacional, não conceitual |
| **Erro de registro**                  | Reage via evento de Correção                                                                                                  | Nunca edição destrutiva                                                                                                                                                                                            |
| **Relatos conflitantes**              | Apenas registra (ambos os relatos, lado a lado)                                                                               | Não resolve — "quem decide conflito" continua lacuna                                                                                                                                                               |
| **Paciente nunca responde check-ins** | Apenas registra a ausência                                                                                                    | Nunca reage — silêncio nunca é evento                                                                                                                                                                              |

---

## Etapa 9 — Experience Signals

| Fato                            | Produção de fato bruto (Relationship)                                                                                           | Interpretação (nunca Relationship — sempre CI)           |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Primeiro atendimento confirmado | Sim — evento de nascimento                                                                                                      | CI decide se e quando amadurece em evidência L3          |
| Continuidade confirmada         | Sim                                                                                                                             | CI interpreta padrão de continuidade                     |
| Encerramento                    | Sim, com motivo factual (nunca julgamento)                                                                                      | CI decide o que esse fato significa para compatibilidade |
| Reabertura                      | Sim — sinal `REABERTA`, já nominalmente citado em `DOMAIN_COMPATIBILITY_INTELLIGENCE.md` como o sinal comportamental mais forte | CI interpreta                                            |
| Troca de profissional           | Sim — fato de que o par não seguiu adiante                                                                                      | CI interpreta                                            |

**Confirmação explícita**: Relationship nunca interpreta comportamento — em nenhum dos fatos acima o domínio produz uma conclusão ("esse par funcionou"/"não funcionou"), só o fato cru do que ocorreu, quando e relatado por quem. Toda leitura de significado é exclusiva do Compatibility Intelligence.

---

## Etapa 10 — Auditoria conceitual

- **Estado sem evento?** Não — ATIVO e ENCERRADO têm evento de origem claro.
- **Evento sem estado?** Sim, por design: Solicitação de Ajuda, Correção e Contestação não mudam estado — são eventos administrativos/operacionais, não estruturais (distinção formalizada na Etapa 3).
- **Transição impossível?** Nenhuma nova além das já vedadas (`ENCERRADO→ATIVO`, qualquer transição sem evento explícito).
- **Autoridade indefinida?** As três encontradas na Fase 4 foram fechadas na Fase 4.1: (1) divergência de fato → Operação Humana decide o efeito, nunca a verdade histórica; (2) profissional que sai da plataforma → fato técnico de outro domínio, decisão continua exclusiva do paciente; (3) falecimento → Administrador registra a partir de evidência externa, `ENCERRADO` com motivo. Resta só o _processo_ de verificação de evidência de óbito — lacuna operacional, não conceitual.
- **Responsabilidade duplicada?** Nenhuma encontrada.
- **Dependência circular?** Nenhuma — fluxo estritamente direcional (Connection→Relationship→CI/Observatório/Journey), nunca retorna.
- **Violação de Connection?** Nenhuma.
- **Conflito com Curadoria?** Nenhum.
- **Conflito com CI?** Nenhum na teoria; risco de implementação já registrado (alguém ler Connection diretamente, pulando Relationship) permanece como vigilância futura, não uma falha desta teoria.
- **Conflito com Operação Humana?** Nenhum conflito de responsabilidade, mas uma fronteira ainda não tecnicamente integrada (Reunião de Acolhimento sem registro formal) — já registrada, não nova.

---

## Etapa 11 — Lacunas

**Conceituais**: nenhuma — as três identificadas na Fase 4 (divergência de fato, profissional que sai da plataforma, falecimento) foram fechadas com decisão e justificativa na Fase 4.1.

**Produto**: se PAUSADO deve ser formalizado (evento de origem, necessidade de data, teto de duração); se Solicitação de Ajuda é válida em estado ENCERRADO.

**Operacionais**: processo de verificação de evidência de óbito (novo, Fase 4.1); canal real de entrada de um Visitante desconhecido (já aceito como lacuna em `PATIENT_ENTRY_ARCHITECTURE.md`); integração técnica entre Atendente/Curador e os eventos formais deste domínio; a tensão Curador/Atendente vs. `DOMAIN_CURATION.md`/ADR-006, agora citada pela quinta vez nesta sessão sem decisão formal.

**Evidência**: taxa real de resposta a check-ins; frequência real de troca de profissional; utilidade prática de PAUSADO.

**Técnicas (fora de escopo)**: schema, nomes de tabela, mecanismo de disparo de cadência — nenhuma tratada aqui.

Nenhuma lacuna foi resolvida por conveniência.

---

## Etapa 12 — Veredito

**Atualizado na Fase 4.1: A) Domínio Relationship teoricamente fechado. Pronto para desenho técnico.**

Justificativa: nenhum conflito estrutural foi encontrado em nenhuma das etapas de auditoria/verificação — estados, eventos, máquina, invariantes e fronteiras formam um conjunto coerente e sem contradição interna. As três lacunas genuinamente conceituais que impediam o Veredito A na Fase 4 (autoridade de divergência, destino de profissional que sai da plataforma, tratamento de falecimento) foram fechadas na Fase 4.1 com decisão e justificativa — nenhuma delas resolvida por conveniência ou inventada sem base documental. Os itens que permanecem abertos (PAUSADO — Produto; processo de verificação de evidência de óbito, canal de entrada de Visitante, integração técnica Atendente/Curador, tensão com ADR-006 — Operacionais) já eram, desde a Fase 4, classificados fora da categoria "conceitual bloqueante" — o mesmo critério que já permitiu a Connection ser promovida a Implementado com ressalvas não-bloqueantes (E2E, teste de Server Action) se aplica aqui. **O domínio Relationship está autorizado a seguir para uma fase de desenho técnico (schema, máquina de estados em TypeScript, migrations, persistência).**

---

## Fase 4.1 — Decisões de fechamento das lacunas conceituais

### Divergência entre relatos

**Modelo escolhido**: B, com uma extensão explícita — **o primeiro relato válido cria o fato imediatamente; uma divergência posterior nunca bloqueia nem reescreve esse fato, apenas gera um evento de Contestação.** Quando a divergência exige uma decisão concreta sobre qual caminho seguir dali em diante (ex.: paciente diz "quero continuar", profissional diz "encerrei"), a autoridade de **efeito operacional** — nunca de verdade histórica — é a Operação Humana já formalizada em `docs/OPERATIONAL_ROLES_MODEL.md` (Atendente para questões operacionais, Curador para questões do processo de Curadoria).

**Alternativas rejeitadas**:

- **Modelo A (equipe decide antes do domínio avançar)** — rejeitado como padrão: bloquearia todo relato à espera de aprovação, contrariando a decisão já tomada na Fase 1 ("nascimento nunca fica pendente"), e reintroduziria paternalismo sobre a palavra do paciente mesmo sem nenhuma segunda parte discordando. Mantido, porém, como o mecanismo usado quando uma divergência REAL e concreta precisa de um efeito operacional definido.
- **Modelo C (estado EM_DIVERGÊNCIA)** — rejeitado, reafirmando a rejeição já feita na Fase 1 (Etapa 5) e na Fase 4 (Etapa 2): nenhuma consequência de domínio própria foi encontrada que justifique um estado à parte.

**Justificativa**: a distinção central, nunca antes articulada com esta precisão, é entre três ações diferentes — preservar os dois relatos (sempre), decidir o efeito operacional (só quando uma ação concreta depende disso) e declarar qual relato é historicamente verdadeiro (nunca é feito). Isso fecha a lacuna sem inventar autoridade nova: a Operação Humana já tinha essa função de mediação formalizada.

**Resposta às perguntas da etapa**: a divergência nunca impede o registro do fato; não existe estado EM_DIVERGÊNCIA; a autoridade de efeito é a Operação Humana (Atendente/Curador); a divergência só altera o estado indiretamente, através do efeito decidido — nunca automaticamente; ela cria evento (Contestação, já catalogado, mais um eventual evento de Resolução de Efeito Operacional); não gera interpretação de compatibilidade por si só, só mais um fato bruto disponível; pertence ao Relationship (o registro) e à Operação Humana (a mediação do efeito).

### Profissional deixa a plataforma

**Decisão**: a saída do profissional é um **fato técnico de outro domínio** (Profissionais/Curadoria — disponibilidade de cadastro), nunca um evento de Relationship. Ele **nunca**, por si só, transiciona ou encerra o Relationship. A Atendente é responsável por comunicar o fato ao paciente; a decisão sobre o destino do relacionamento (continuar de algum jeito, trocar de profissional, encerrar) continua sendo exclusivamente do paciente, através dos eventos já existentes (Continuidade, Troca de Profissional, Encerramento) — nunca inferida, nunca automática.

**Separação formalizada**: _fato técnico_ ("o profissional não está disponível") pertence ao domínio de Profissionais, é objetivo e não interpreta nada; _decisão humana_ ("o relacionamento precisa continuar ou terminar") pertence sempre e exclusivamente ao paciente.

**Justificativa**: qualquer encerramento ou troca automática, disparada pela saída do profissional, seria uma inferência sobre a vontade do paciente a partir de um fato de terceiro — exatamente o que os invariantes já estabelecidos (nenhum encerramento por inferência, paciente sempre decisor final) proíbem. Nenhuma autoridade nova precisou ser inventada — a Atendente já tinha, em `OPERATIONAL_ROLES_MODEL.md`, a responsabilidade de "manter o paciente informado".

### Falecimento do paciente

**Decisão**: **Opção B — ENCERRADO com motivo específico**, nunca um estado `FALECIDO` próprio. É sempre um subtipo, com evidência mais estrita, do já existente Encerramento Administrativo. Quem registra: o Administrador, nunca o Sistema sozinho, nunca inferido. Todo o histórico factual do Relationship permanece preservado (mesmo padrão append-only).

**Alternativa rejeitada**: **Opção A (estado `FALECIDO` próprio)** — rejeitada porque nenhuma consequência de máquina de estados foi encontrada que diferencie esse motivo de qualquer outro motivo de encerramento; abrir uma exceção só para este motivo quebraria a consistência já estabelecida de que "motivo" é sempre um dado do evento, nunca uma dimensão do estado (mesmo padrão já usado em `closeWithoutRelationship`, Connection).

**Novo invariante adicionado**: _encerramento por falecimento nunca produz `ExperienceSignal` de compatibilidade_ — extensão direta do invariante já existente ("Relationship nunca interpreta fatos") a um caso concreto que nenhuma fase anterior havia examinado.

**Lacuna explicitamente delimitada, não resolvida (e não bloqueante)**: quem tem autoridade para **verificar a evidência legal** do óbito (certidão, contato de familiares, processo de confirmação) não está definido em nenhum documento desta sessão e não pode ser inventado aqui — é uma questão operacional/legal, não conceitual. A teoria do domínio já responde tudo que lhe cabe: o fato precisa de evidência externa verificada por um humano autorizado (Administrador), nunca inferido; o _processo_ dessa verificação é uma decisão operacional futura, da mesma natureza já registrada como não-bloqueante em outras partes desta sessão (canal, SLA, cadência).

---

## Revisão dos estados (Etapa 4 desta fase)

Nenhuma das três decisões acima altera a máquina de estados formal. **ATIVO** e **ENCERRADO** permanecem exatamente como estavam. **PAUSADO** permanece **Hipótese**, não promovida nem removida — nenhuma das três decisões desta fase trouxe evidência nova sobre ele especificamente, e promovê-lo sem essa evidência violaria a restrição explícita desta fase ("não transformar hipótese em decisão sem justificativa"). **REABERTO** e **EM_DIVERGÊNCIA** continuam rejeitados — a Etapa 1 desta fase inclusive reforça a rejeição de `EM_DIVERGÊNCIA`.

## Revisão dos eventos (Etapa 5 desta fase)

Três refinamentos conceituais, nenhum deles uma nova transição na máquina de estados:

1. **Resolução de Efeito Operacional** — evento administrativo novo; autoridade: Atendente/Curador; nunca reescreve o relato original; não muda a máquina formal, só o efeito prático de uma divergência já registrada.
2. **Profissional Indisponível** — não é um evento de Relationship; pertence ao domínio de Profissionais; consumido só como informação; nunca muda estado.
3. **Encerramento por Falecimento** — não é um evento novo; é uma instância mais estrita do já existente Encerramento Administrativo.

## Revisão dos invariantes (Etapa 6 desta fase)

Os quatro invariantes centrais verificados continuam válidos sem exceção: nunca nasce por inferência; nunca termina por silêncio; nunca altera história passada; nunca substitui outros domínios — nenhuma das três decisões desta fase os violou ou exigiu enfraquecê-los.

**Dois novos invariantes adicionados**:

- Encerramento por falecimento nunca produz `ExperienceSignal` de compatibilidade.
- Nenhuma decisão sobre o destino do relacionamento é inferida a partir da disponibilidade do profissional — é sempre do paciente, mediante informação, nunca automática.

## Auditoria final (Etapa 7 desta fase)

Nenhum estado sem evento; nenhuma responsabilidade sem papel; nenhum papel humano sem responsabilidade; nenhum conflito com Connection, Curadoria, CI ou Operação Humana. **Evento sem autoridade**: nenhum mais — os três eventos revisados têm autoridade definida, exceto o _processo_ de verificação de evidência de óbito, já delimitado como lacuna operacional, não conceitual. **Decisão sem dono**: a lacuna histórica "quem decide divergência" foi fechada (Atendente/Curador, para efeito operacional); resta só o processo de verificação de óbito, deliberadamente não inventado.

---

## Documentos relacionados

- `docs/architecture/DOMAIN_CONNECTION_RELATIONSHIP.md` — documento oficial do domínio 4; ver nota de duplicação no topo.
- `docs/OPERATIONAL_ROLES_MODEL.md` — modelo de papéis humanos, Proposto, base da Etapa 6.
- `docs/architecture/DOMAIN_COMPATIBILITY_INTELLIGENCE.md` — consumidor exclusivo de interpretação (Etapa 9).
- `docs/architecture/ARCHITECTURAL_INVARIANTS.md` — invariante #14 (reabertura), base da Etapa 5.
- `docs/PATIENT_ENTRY_ARCHITECTURE.md` — Cenário C, base de uma das lacunas operacionais (Etapa 11).
- `docs/DECISIONS.md` — ADR-006, ADR-027.

## Diagrama

Ver diagrama mestre em `ARCHITECTURE_BLUEPRINT.md`. Neste domínio, o trecho relevante é: `CONNECTION ──▶ RELATIONSHIP ──▶ (evidência) ──▶ COMPATIBILITY INTELLIGENCE`.
