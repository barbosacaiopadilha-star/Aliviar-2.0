# Arquitetura de Produto — Aliviar Curadoria Médica

Documento de modelagem funcional do produto **[aliviarcuradoriamedica.com.br](https://www.aliviarcuradoriamedica.com.br)**. Fase 2 do projeto: encerrada a construção do Método (ACE, `docs/ace/`), o foco passa a ser o produto que existe ao redor dele.

Este documento **modela, não implementa**. Nenhuma decisão aqui gera código, página, componente ou schema de banco antes de aprovação explícita e de uma tarefa de engenharia própria — mesma disciplina já aplicada à construção do ACE (`docs/ace/06-governance/governance.md`).

**Não redefine** o que já está decidido em: `docs/PRODUCT_VISION.md` (missão, visão, valores, posicionamento), `docs/PRODUCT_PRINCIPLES.md` (como decidir), `docs/BRAND_GUIDELINES.md` (voz e tom), `docs/ENGINEERING_PLAN.md` (stack, módulos, roadmap técnico), `docs/DISCOVERY_ENGINE.md` (motor de busca/descoberta), `docs/ace/*` (o Método). Este documento **referencia e organiza** esses documentos ao redor de uma visão funcional única — quando há conflito aparente, os documentos-fonte prevalecem, e o conflito deve ser levantado explicitamente, nunca resolvido silenciosamente aqui.

**Princípio de decisão desta fase:** toda escolha de produto responde primeiro a "isto melhora a experiência do paciente?" — se a resposta é não, não pertence ao produto, independentemente de conveniência técnica, comercial ou de prazo.

**Nota de auditoria (2026-07-15):** este documento foi escrito na Fase 2, antes da maior parte da jornada abaixo existir em código. A V1.0 foi entregue e congelada desde então (ADR-021, `docs/DECISIONS.md`) — boa parte do que as seções 4 e 8 tratavam como "a desenhar" já está implementada e em operação. As seções marcadas abaixo foram conferidas contra o código real (`src/app/`, `src/modules/story`, `src/modules/cases`, `src/modules/concierge`) e corrigidas onde divergiam do que foi de fato construído. Esta auditoria não altera nenhum protocolo, Constituição, Ontologia, Kernel ou schema — apenas a descrição, aqui, do que já existe.

---

## 0. O que muda nesta fase

- **O ACE está congelado.** Nenhum protocolo novo, nenhuma alteração estrutural — apenas correção de bugs/inconsistências identificadas em operação (mesmo critério já usado nas Sprints 8-10). O ACE (P001-P010) é tratado, a partir de agora, como **componente interno estável**, não mais como objeto de design.
- **O foco vira o Produto.** Toda a experiência ao redor do ACE — cadastro, dashboards, notificação, painel do curador, relacionamento de 12 meses, busca direta, painel administrativo — ainda não foi desenhada em conjunto. Este documento é a primeira tentativa de desenhá-la como um todo coerente.
- **Esta sprint modela, não implementa.** O resultado é este documento. Nenhuma página, componente, migration ou tabela é criada nesta sprint.

---

## 1. Visão geral do produto

Existe **um único produto**: a **Curadoria Médica Aliviar**. Não são dois produtos, nem duas ofertas concorrentes — é uma experiência contínua de curadoria de cuidado, com **duas portas de entrada** para a mesma coisa:

1. **Busca Direta** (`docs/DISCOVERY_ENGINE.md`) — a pessoa entra já sabendo o que busca, filtra e compara profissionais por conta própria, com total autonomia.
2. **Concierge de Saúde** (ACE, `docs/ace/`) — a pessoa entra contando sua história (`sua-historia`, já implementado), e a equipe Aliviar conduz a curadoria por ela, entregando uma proposta validada por humano, com acompanhamento contínuo por 12 meses.

As duas portas levam ao mesmo lugar: um profissional certo, encontrado com **curadoria humana independente**, nunca por posição paga (`docs/PRODUCT_VISION.md`). Qual porta a pessoa usa é só uma escolha de **como ela prefere chegar lá** — nunca uma bifurcação de identidade de produto, marca ou padrão de qualidade. A Aliviar Curadoria Médica é a evolução comercial da plataforma `aliviar-conexao` (nome técnico do repositório).

> **Princípio central desta fase:** o paciente nunca interage com protocolos. O paciente vive uma experiência contínua de Curadoria Médica.
>
> Isso vale mesmo para quem entra pela Busca Direta: ainda que o Concierge (ACE) não esteja envolvido nesse caminho, a experiência da pessoa continua sendo "a Aliviar me ajudou a encontrar cuidado com critério" — nunca "eu usei o mecanismo de busca da Aliviar". A distinção entre os dois caminhos é uma decisão de arquitetura interna (esta seção e a seção 9); para o paciente, existe uma única marca, uma única promessa, uma única experiência.

O Concierge é o modo mais diferenciado e o que dá nome ao domínio (`aliviarcuradoriamedica.com.br`); a Busca Direta é o modo leve e sempre disponível, que sustenta o módulo `discovery` já previsto no MVP técnico (`docs/ENGINEERING_PLAN.md`). Nenhum dos dois é "melhor" — são modos de uso diferentes para necessidades diferentes (alguém que já sabe o que busca vs. alguém que precisa de ajuda para navegar a decisão), dentro do mesmo produto.

---

## 2. Objetivos

**Objetivos de produto (Fase 2):**

1. Desenhar a jornada completa do paciente do primeiro contato até o encerramento de um ciclo de Concierge de 12 meses.
2. Desenhar a jornada da equipe Aliviar — em especial o papel humano central do Método: a Revisão Humana (P009).
3. Desenhar a jornada do profissional parceiro, hoje quase invisível na documentação existente além do cadastro/perfil.
4. Definir com precisão onde o ACE participa e onde termina — para que nenhuma equipe futura (produto, engenharia, atendimento) presuma que o ACE faz mais do que faz.
5. Definir os módulos que faltam para orquestrar o ACE dentro do produto (hoje o ACE é uma biblioteca de protocolos sem nenhuma camada de aplicação ao redor).

**Não-objetivos desta fase:** desenhar telas, escrever copy final, definir schema de banco, escolher biblioteca de UI, estimar prazo de engenharia.

---

## 3. Personas

### 3.1 Paciente (pessoa buscando cuidado)

Alguém em um momento vulnerável — ansiedade, luto, transição de vida, dúvida sobre iniciar ou não um tratamento — que não sabe por onde começar, ou já tentou e se frustrou com diretórios frios e comercialmente enviesados. Quer confiança antes de rapidez. Pode preferir contar sua história com calma (Concierge) ou já saber exatamente o que busca (Busca Direta).

### 3.2 Profissional parceiro

Psicólogo(a), terapeuta ou profissional de saúde independente que quer ser encontrado por quem realmente precisa do seu cuidado, sem pagar por destaque e sem competir em uma vitrine de anúncios. Quer ser representado com fidelidade (bio própria, abordagem, não reduzido a "nota"), e quer receber apenas contatos genuinamente compatíveis com o que oferece — não qualquer lead.

### 3.3 Curador Médico

Membro da equipe Aliviar com preparo para avaliar, em linguagem simples e evidências já organizadas pelo ACE, se uma proposta de curadoria está madura o suficiente para chegar ao paciente. Não é um papel técnico — é o ponto exato onde a Constituição do ACE (Princípio 9) se torna real: nenhuma decisão de cuidado sai da Aliviar sem passar por uma pessoa. **Papel implementado e em operação desde a V1.0** (`src/app/curador/`, Revisão Humana em `casos/[id]/revisao`) — operacional do produto, sem ter exigido qualquer alteração no ACE (ver seção 17).

### 3.4 Administrador(a) Aliviar

Papel operacional interno já previsto (ADR-006): modera e verifica cadastro de profissionais, opera o painel administrativo. Pode ou não acumular o papel de Curador Médico — tratado como decisão separada (seção 17).

### 3.5 Visitante

Qualquer pessoa não autenticada navegando a landing page, iniciando "sua história", ou buscando profissionais publicamente. A intake do Concierge (`sua-historia`) e a Busca Direta são deliberadamente acessíveis sem cadastro prévio até o ponto em que a identidade é realmente necessária (entrega da curadoria, solicitação de contato) — reduzir fricção antes do compromisso (Princípio 3, clareza acima de complexidade; Princípio 4, transparência acima de persuasão).

---

## 4. Jornada completa do paciente

A jornada tem duas portas de entrada (Busca Direta e Concierge) que convergem no mesmo destino (contato com um profissional) e podem coexistir para a mesma pessoa.

### 4.1 Jornada — Busca Direta

1. Visitante chega à landing page ou direto na busca pública.
2. Filtra por especialidade, modalidade, região, convênio, disponibilidade (`docs/DISCOVERY_ENGINE.md`, seção 6.1).
3. Vê lista de profissionais verificados, cada um com explicação simples de "por que aparece" (seção 4.1 do Discovery Engine).
4. Abre o perfil público de um profissional.
5. Solicita contato (módulo `connection`, já previsto no MVP) — aqui a identidade passa a ser necessária (cadastro/login).
6. Profissional responde (aceita/recusa) no seu painel.
7. Conexão estabelecida — fora da plataforma a partir daqui (a Aliviar não medeia consulta, pagamento ou prontuário).

### 4.2 Jornada — Concierge de Saúde (ACE)

**Correção de regra de negócio (substitui a versão anterior desta seção):** conforme §21, a equipe Aliviar sempre cria a conta do paciente previamente — não existe, em nenhum ponto da jornada, criação ou associação de conta a partir de "sua história". A identidade já é necessária **antes** do acolhimento, não depois dele.

1. **Descoberta**: visitante encontra a landing page ou é indicado por conteúdo institucional. A página pública `sua-historia` (raiz) explica o que é o Concierge, mas **não permite preenchimento** sem login — só orienta a pessoa a entrar em contato com a Aliviar ou, se já tiver conta, a fazer login.
2. **Conta já existente** (pré-requisito, §21): a pessoa já tem conta e papel "paciente", criados previamente pela equipe Aliviar por um canal próprio (fora deste fluxo) — nunca por autocadastro.
3. **Acolhimento** (`sua-historia`, autenticado, exige papel "paciente"): logada, a pessoa conta sua história em seis etapas — para quem é o cuidado, o motivo da busca, a história em si, informações adicionais (com anexos), preferências de atendimento, e uma revisão final antes de enviar (`src/app/(public)/sua-historia/(wizard)/`). Desde `feat(story): make patient story an editorial journey`, cada etapa é escrita como prosa calma e acolhedora, não como rótulo de formulário. O rascunho é salvo automaticamente no servidor (tabela `patient_stories`, `src/modules/story/repository.ts`) a cada 600ms de inatividade, com controle de concorrência otimista por revisão e retomada exata de onde parou em qualquer dispositivo — o `localStorage` existe apenas como cache transitório para sobreviver a uma aba fechada antes do autosave confirmar, nunca como fonte de verdade (**corrige a versão anterior desta seção, que descrevia persistência apenas local**). Ao concluir, a história fica marcada como `enviada`, permanentemente vinculada à conta — **mas isso não abre um Caso automaticamente**: a criação do Caso continua sendo uma ação manual da equipe (`createCaseAction`, disparada pelo Administrador na página do paciente), que então aciona o módulo `concierge` para orquestrar o pipeline do ACE — **implementado e em operação desde o encerramento do MVP (V1.0)**.
4. **Curadoria em andamento** (implementado, V1.0; invisível para a pessoa, ACE P001-P008): o caso é estruturado, auditado, contextualizado, e uma proposta de composição (Shortlist) é gerada. A pessoa vê apenas um estado de "sua curadoria está sendo preparada" — nunca o detalhe técnico do pipeline (Princípio 5, tecnologia invisível).
5. **Revisão humana** (ACE P009, implementado, V1.0; invisível para a pessoa): um Curador Médico avalia a proposta, aprova, ajusta ou — quando necessário — pede mais informação (o que pode significar retomar a etapa 2 com a pessoa) ou rejeita (raro; significa que a Aliviar não tem, hoje, uma opção responsável para aquele caso, e isso é comunicado com honestidade, não escondido). Diferente de P001-P008, o P009 nunca foi disparado automaticamente pelo orquestrador — dependia sempre de uma ação explícita do Curador Médico. **Descontinuado em 2026-07-26 (ADR-035 / ADR-036):** a Curadoria passou a ter uma única autoridade decisória, o Curador na Mesa, e a decisão passou a produzir o Relatório canônico. A tela de revisão, a Server Action e o escritor do P009 não existem mais; os `HumanReviewResult` já registrados permanecem íntegros e legíveis.
6. **Entrega da Curadoria Final** (ACE P010): a pessoa recebe, de forma clara e humana, a apresentação de exatamente três profissionais, com o porquê de cada um, sem ranking, com disclaimer claro de que a escolha é dela.
7. **Decisão e primeiro contato**: a pessoa escolhe (ou nenhum, ou pede para reabrir — ver seção 13) e solicita contato com quem preferir — mesmo módulo `connection` da Busca Direta.
8. **Acompanhamento (meses 1-12)**: a equipe Aliviar mantém contato periódico (ver seção 12) para saber como está a experiência, sem se inserir na relação clínica em si.
9. **Encerramento ou renovação do ciclo**: ao fim dos 12 meses (ou antes, se a pessoa pedir), o ciclo se encerra, se renova, ou uma nova curadoria é aberta se a necessidade mudou substancialmente.

**Teto real de implementação (auditoria 2026-07-15, atualizado na mesma data — ADR-027):** os passos 1-6 acima (Descoberta → Entrega da Curadoria Final) estão implementados e em operação desde a V1.0, verificados diretamente em código. O passo 7 (Decisão e primeiro contato) também está implementado: o módulo `connection` deixou de estar reservado e vazio (histórico preservado em `docs/architecture/DOMAIN_CONNECTION_RELATIONSHIP.md`), validado por testes de integração contra banco real. Os passos 8-9 (Acompanhamento, Encerramento/renovação) continuam sendo modelagem de produto, não implementação: não existe ainda nenhum módulo `relationship` no repositório (nem reservado) — a jornada real de um paciente hoje termina em "escolheu um profissional e registrou intenção de contato (ou não)", sem caminho de sistema para ser acompanhado nos 12 meses ou ter o Caso reaberto por sinal de comportamento.

---

## 5. Jornada da equipe Aliviar

A "equipe Aliviar" cobre dois papéis funcionalmente distintos, ainda que possam ser a mesma pessoa nos primeiros meses de operação (decisão de negócio, não de arquitetura):

### 5.1 Curador Médico — responsável pela Revisão Humana (P009)

1. Recebe uma fila de casos com curadoria proposta (Shortlist) aguardando revisão.
2. Abre um caso: vê a Narrativa original, o Contexto de Decisão, a Matriz de Compatibilidade completa (todas as dimensões, forças, limitações, informações ausentes) e a Shortlist proposta — tudo já organizado pelo ACE, nunca uma tabela crua.
3. Decide: `APPROVE` (aceita integralmente), `ADJUST` (ajusta a composição dentro do conjunto já avaliado pelo ACE), `REJECT` (com justificativa), ou `REQUEST_MORE_INFORMATION` (interrompe, sinalizando o que falta).
4. Quando `ADJUST` envolve um caso de composição ambígua (mais de três candidatos igualmente fundamentados — ACE, `AMBIGUOUS_COMPOSITION`), a interface deve apresentar os candidatos preservados lado a lado, com todas as justificativas, para que a escolha humana seja informada, não arbitrária.
5. Sua decisão gera o `HumanReviewResult` — se validada, a entrega (P010) é disparada por uma ação explícita do Curador/Administrador na própria tela de revisão (V1.0: sob confirmação, nunca automática).

### 5.2 Administrador(a) — moderação e operação

1. Aprova/verifica cadastro de novos profissionais (pré-requisito para um profissional aparecer em qualquer busca ou curadoria — ver seção 5 do Discovery Engine: "toda curadoria de profissional passa por revisão humana antes de entrar no motor").
2. Modera denúncias/inconsistências de perfil.
3. Acompanha métricas operacionais agregadas (nunca dado clínico individual sem necessidade).

### 5.3 Time de Relacionamento (Concierge, meses 1-12)

1. Acompanha, em cadência definida (proposta: mensal, revisável), como está a experiência de cada paciente em Concierge ativo.
2. Registra sinais de que uma nova curadoria pode ser necessária (mudança de necessidade, conexão que não funcionou) — decide, com a pessoa, se abre um novo ciclo de "sua história" para aquele caso.
3. Não substitui nem se sobrepõe ao Curador Médico do P009 — apenas identifica quando reabrir o funil é a ação certa.

---

## 6. Jornada do profissional parceiro

1. **Cadastro**: cria conta, preenche perfil profissional (bio, formação, especialidades, modalidade, cidade, convênios) — módulo `profiles`, já previsto.
2. **Verificação**: aguarda aprovação de um Administrador antes de aparecer em qualquer busca ou ser elegível a qualquer curadoria (nunca visível "por padrão" antes de verificado).
3. **Visibilidade**: aparece na Busca Direta (perfil público) e é elegível a ser avaliado pelo ACE (P006 em diante) — sempre com os mesmos dados de análise, nunca dois perfis divergentes para os dois caminhos.
4. **Recebimento de contato**: vê, no seu painel, solicitações de conexão — tanto vindas da Busca Direta quanto originadas por uma Curadoria Final (o profissional não precisa saber, nem importa para ele, por qual caminho o paciente chegou — a experiência de resposta é a mesma).
5. **Resposta**: aceita ou recusa, com uma mensagem simples.
6. **Atualização contínua**: pode manter seu perfil, disponibilidade e modalidades atualizados a qualquer momento — dado que alimenta tanto a Busca Direta quanto o `ProviderProfileRepository`/`ProviderPresentationRepository` do ACE (ver seção 10).

**O que o profissional nunca vê:** a Matriz de Compatibilidade, a Shortlist, ou qualquer artefato interno do ACE — para ele, o resultado é apenas "uma solicitação de contato chegou", com a mesma experiência independentemente da origem.

---

## 7. Fluxos internos

- **Fluxo de verificação de profissional**: cadastro → fila de verificação → aprovação/rejeição por Administrador → habilitado para Busca Direta e ACE.
- **Fluxo de intake → curadoria**: `sua-historia` (produto) → Narrativa (ACE P001) → pipeline ACE (P002-P008, automatizado) → fila de Revisão Humana (P009) → decisão do Curador Médico → Entrega (P010) → notificação ao paciente.
- **Fluxo de conexão** (comum aos dois caminhos): solicitação → notificação ao profissional → resposta → notificação ao paciente.
- **Fluxo de acompanhamento de Concierge**: caso entregue → agendamento de check-ins periódicos → registro de status → decisão de reabrir/encerrar/renovar.
- **Fluxo de reabertura de caso**: paciente ou Time de Relacionamento sinaliza necessidade de nova curadoria → nova Narrativa (nova rodada de "sua história", parcial ou completa) → novo ciclo ACE, sempre como um novo Caso, nunca uma edição retroativa do anterior (mesmo princípio de imutabilidade/versionamento já aplicado dentro do ACE).

---

## 8. Módulos do sistema

Reconciliando `docs/ENGINEERING_PLAN.md` (módulos já previstos) com o que a Fase 2 exige:

**Implementados e em operação desde a V1.0 (auditoria 2026-07-15):**

- `auth` — identidade, sessão, papéis, proteção de rota.
- `profiles` — perfil base + conta de paciente + perfil de profissional.
- `story` (`src/modules/story`) — o assistente "sua história"; persiste em `patient_stories` no Supabase, com autosave, concorrência otimista e retomada entre dispositivos (`localStorage` é só cache transitório) — **corrige a versão anterior desta lista, que descrevia persistência apenas local**.
- `cases` (`src/modules/cases`) — a entidade Caso, com máquina de estados própria (ver seção 14 revisada).
- `ace` (`src/modules/ace`) — o Método completo (P001-P010), biblioteca de protocolos pura.
- `concierge` (`src/modules/concierge`) — **implementado, não mais "nome de trabalho"**: orquestra automaticamente P001-P008 a partir de uma história enviada (`orchestrator.ts`), e expõe P009 (Revisão Humana) e P010 (Entrega) como ações server-side próprias e manuais — nunca disparadas pelo orquestrador automático.
- A fila e a interface de Revisão Humana (o que esta seção previa como módulo `curation-desk`) **não nasceu como módulo próprio** — vive como rotas de produto dentro de `src/app/curador/` e `src/app/admin/casos/`, sobre as ações do próprio `concierge`. Nome mantido aqui só como referência histórica.
- `connection` (`src/modules/connection`) — **[ATUALIZADO 2026-07-15, ADR-027 em `docs/DECISIONS.md`]** implementado (só a parte pontual — decisão do paciente e primeiro contato). Até esta data era "reservado, vazio"; **corrige a versão anterior desta lista**, que ainda o descrevia como não construído. Domínio puro + persistência (migrations, RLS, funções de transição atômica) + Server Actions + apresentação, validado por 14 testes de integração contra Supabase local. Detalhe completo em `docs/architecture/DOMAIN_CONNECTION_RELATIONSHIP.md`.

**Já previstos no MVP técnico, ainda não construídos:**

- `discovery` — Busca Direta (`docs/DISCOVERY_ENGINE.md`) — reservado, vazio.

**Ainda necessário, e ainda sem sequer uma pasta reservada:**

- `relationship` (nome de trabalho) — acompanhamento dos 12 meses de Concierge: cadência de check-in, sinalização de reabertura, encerramento. Diferente de `discovery` (reservado) e `connection` (implementado), este módulo não tem nenhum placeholder no repositório hoje.

**Reservados, fora de escopo (herdados do plano técnico, inalterados):** `community`, `institutions`, `benefits`, `programs`, `ai`, `partners`.

---

## 9. Integração entre módulos

Mantendo a regra já estabelecida (`docs/ENGINEERING_PLAN.md`, seção 2): módulos nunca acessam dados uns dos outros diretamente — só por contrato explícito.

```
story ──(Narrative)──▶ concierge ──executa──▶ ace (P001-P010, puro)
                             │                        │
                             │                  (lê perfis via portas)
                             │                        ▼
                             │              profiles / discovery
                             │
                             ├──(fila de revisão)──▶ curation-desk
                             │                              │
                             │                    (decisão do Curador Médico)
                             │                              ▼
                             └──(FinalCuradoria)──▶ relationship ──▶ connection
                                                                          ▲
discovery ──(perfil público)──▶ connection ◀── paciente (Busca Direta) ──┘
```

- `concierge` é o único módulo que conhece o `ace` como dependência direta — nenhum outro módulo (UI, discovery, connection) importa o ACE diretamente.
- As "portas" do ACE (`ProviderRepository`, `ProviderProfileRepository`, `ProviderPresentationRepository`) são implementadas pelo módulo `profiles`/`discovery` — o ACE nunca acessa a tabela de profissionais diretamente, apenas através dessas interfaces já definidas (`src/modules/ace/ports/`).
- `connection` é o ponto de convergência dos dois caminhos — recebe uma solicitação seja ela originada de uma busca direta ou de uma Curadoria Final; para o módulo `connection`, a origem é só um metadado, nunca uma ramificação de lógica.

---

## 10. Onde o ACE participa

- Estruturação da história do paciente em um Caso de Decisão (P001-P002).
- Auditoria de prontidão do caso (P003).
- Modelagem do contexto de decisão (P004).
- Tradução do contexto em perfil de competência necessário (P005).
- Identificação de profissionais elegíveis, via a porta `ProviderRepository` (P006).
- Avaliação individual e comparável de cada profissional elegível, via `ProviderProfileRepository` (P007).
- Composição (ou bloqueio explicável) de uma proposta de três profissionais (P008).
- Registro estruturado da decisão humana de um Curador Médico (P009).
- Materialização e comunicação da curadoria validada ao paciente (P010).

---

## 11. Onde o ACE NÃO participa

- **Busca Direta** — filtros, ordenação e apresentação de resultados de busca livre são o `discovery` (`docs/DISCOVERY_ENGINE.md`), um mecanismo próprio e mais simples (regras determinísticas de filtro/ordenação declaradas), não uma instância do ACE.
- **Cadastro e verificação de profissional** — decisão humana de Administrador, sem qualquer protocolo do ACE envolvido.
- **Resposta do profissional a uma solicitação de contato** — decisão do próprio profissional, fora do ACE.
- **Relação clínica em si** (consulta, diagnóstico, tratamento, prontuário) — nunca, em nenhuma hipótese, dentro do escopo do ACE ou do produto (Constituição do ACE, Kernel seção 1; `docs/PRODUCT_VISION.md`).
- **Acompanhamento de relacionamento nos 12 meses** — é conduzido por pessoas (Time de Relacionamento), o ACE não "monitora" o paciente; se uma nova curadoria for necessária, um **novo** Caso é aberto, do zero, pela história atualizada — o ACE nunca reabre ou modifica retroativamente uma Curadoria Final já entregue.
- **Cobrança, pagamento, plano/assinatura do Concierge** — inteiramente fora do ACE.
- **Comunicação de marketing, e-mail transacional, notificações push** — infraestrutura de produto, não do Método.

---

## 12. Fluxo completo do Concierge (12 meses)

Modelo proposto (primeira modelagem — a validar antes de qualquer construção):

| Momento        | O que acontece                                                                                                                                                 | Quem conduz                       |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **Semana 0**   | Acolhimento (`sua-historia`) + confirmação/cadastro.                                                                                                           | Paciente (autosserviço)           |
| **Semana 0-1** | Pipeline ACE (P001-P008), automatizado.                                                                                                                        | ACE                               |
| **Semana 1**   | Revisão Humana (P009).                                                                                                                                         | Curador Médico                    |
| **Semana 1-2** | Entrega da Curadoria Final (P010) + comunicação humana de acompanhamento.                                                                                      | Produto + Time de Relacionamento  |
| **Semana 2-4** | Paciente decide, solicita contato, inicia relação com o(s) profissional(is) escolhido(s).                                                                      | Paciente + Profissional           |
| **Mês 1**      | Primeiro check-in: como foi o primeiro contato/consulta.                                                                                                       | Time de Relacionamento            |
| **Meses 2-11** | Check-ins periódicos (cadência proposta: mensal ou bimestral — decisão de produto a confirmar); disponibilidade para reabrir curadoria se a necessidade mudar. | Time de Relacionamento            |
| **Mês 12**     | Encerramento do ciclo: renovação, encerramento, ou transição para um novo Caso se a necessidade evoluiu.                                                       | Time de Relacionamento + Paciente |

**Reabertura a qualquer momento**: se em qualquer ponto dos 12 meses a pessoa sentir que a conexão não está funcionando, ou sua necessidade mudar, ela pode solicitar uma nova curadoria — isso abre um **novo Caso** (nova Narrativa, novo ciclo P001-P010), nunca uma edição do anterior. O histórico de Casos anteriores permanece consultável pela pessoa e pela equipe (continuidade, `docs/PRODUCT_PRINCIPLES.md`, princípio 15).

**Ponto em aberto, a decidir antes de implementar**: cadência exata dos check-ins, e se o Concierge é um produto pago (assinatura/plano) ou parte do valor de todos os cadastros — isso é decisão de negócio do responsável pelo produto, não uma decisão de arquitetura.

---

## 13. Estados do paciente

Estado da relação da pessoa com o produto (não confundir com estado de sessão/autenticação):

```
Visitante
   │ (inicia "sua história" OU busca direta)
   ▼
Cadastrado (sem caso ativo)
   │ (envia "sua história")
   ▼
Em Acolhimento
   │ (história completa e confirmada)
   ▼
Em Curadoria
   │ (Curadoria Final entregue)
   ▼
Curadoria Recebida — Decidindo
   │ (solicitou contato)
   ▼
Conectado
   │ (dentro dos 12 meses)
   ▼
Em Acompanhamento (Concierge ativo)
   │ (fim do ciclo / decisão da pessoa)
   ▼
Encerrado / Renovado / Novo Caso Aberto
```

Uma pessoa pode estar, simultaneamente, "Conectado" via Busca Direta em paralelo a um Concierge ativo — os dois caminhos não são mutuamente exclusivos.

**Estado real de implementação (2026-07-15, nota atualizada na mesma data — ADR-027):** o `paciente/page.tsx` hoje deriva um estado de Home a partir de sinais reais (`no_story`, `draft`, `submitted_without_case`, `case_available` — `src/modules/paciente/home-state.ts`), sem tentar reclassificar localmente o `statusLabel` do Caso. Esse modelo de implementação é deliberadamente mais simples que o diagrama conceitual acima — ainda não distingue "Curadoria Recebida-Decidindo" de "Conectado" de "Em Acompanhamento". Para "Conectado", a causa não é mais ausência do módulo — `connection` está implementado (`src/modules/connection`) — e sim que `home-state.ts` ainda não consome `connection_records` para essa distinção (achado registrado, correção fora do escopo desta nota factual). Para "Em Acompanhamento", a causa permanece a original: o módulo `relationship` não existe. O diagrama acima permanece o modelo-alvo; a implementação de hoje só alcança até "Em Curadoria"/"Curadoria Recebida".

---

## 14. Estados do caso

**Atualizado em 2026-07-15 contra a implementação real** (`src/modules/cases/state-machine.ts`) — a versão anterior desta seção propunha nomes de estado (Aberto/Enviado/Em Processamento/Validado/Rejeitado) que não correspondem 1:1 ao que foi implementado. Os nove estados reais e as transições permitidas entre eles:

```
NEW ──▶ IN_REVIEW ──▶ READY_FOR_CURATION ──▶ IN_CURATION ──▶ HUMAN_REVIEW ──▶ DELIVERED ──▶ CLOSED
  │         │                                     │                │
  │         ▼                                     ▼                ▼
  │  WAITING_FOR_INFORMATION ◀────────────────────┴────────────────┘
  │         │
  │         ▼ (retorna)
  │      IN_REVIEW
  └──▶ CANCELLED (a partir de qualquer estado não-terminal)
```

- `NEW` — Caso recém-criado pela equipe (ação manual, seção 4.2 passo 3), história já enviada.
- `IN_REVIEW` — equipe avaliando a história antes de iniciar a curadoria.
- `WAITING_FOR_INFORMATION` — estado de bloqueio compartilhado, alcançável tanto de `IN_CURATION` (quando a Auditoria do Caso, P003, retorna `BLOCKED` por informação insuficiente) quanto de `HUMAN_REVIEW` (quando o Curador Médico pede mais informação) — volta para `IN_REVIEW` quando resolvido.
- `READY_FOR_CURATION` — pronto para o pipeline automático começar.
- `IN_CURATION` — pipeline ACE P001-P008 em execução (`orchestrator.ts`).
- `HUMAN_REVIEW` — Shortlist (P008) pronta, aguardando ou em decisão do Curador Médico (P009, ação manual separada do pipeline automático).
- `DELIVERED` — Curadoria Final (P010) entregue — também uma ação manual separada, nunca automática.
- `CLOSED` / `CANCELLED` — estados terminais.

Diferente da proposta anterior, não existem estados de produto distintos para "Bloqueado — Poucas Opções" e "Bloqueado — Composição Ambígua" (os dois tipos de `Shortlist BLOCKED` levam o Caso a `HUMAN_REVIEW` mesmo assim, para decisão humana), nem um estado `REJECTED` próprio do Caso — uma rejeição do Curador Médico fica registrada no histórico de `HumanReviewResult` (append-only, ADR-025), não como um estado do Caso em si.

Um caso bloqueado (`WAITING_FOR_INFORMATION`) ou uma revisão rejeitada **nunca é apresentado ao paciente como falha silenciosa** — princípio de produto mantido (Princípio 7, confiança construída lentamente), independentemente do nome exato do estado técnico.

---

## 15. Estados da curadoria

Reaproveita diretamente o vocabulário já definido no ACE (`docs/ace/02-ontology/ontology.md`) — este documento não redefine, apenas mapeia para a experiência de produto:

- **Shortlist**: `COMPOSED` (três profissionais propostos) ou `BLOCKED` (`INSUFFICIENT_OPTIONS` | `INSUFFICIENT_EVIDENCE` | `AMBIGUOUS_COMPOSITION`).
- **HumanReviewResult**: `VALIDATED` (por `APPROVE` ou `ADJUST`), `REJECTED`, ou `INFORMATION_REQUESTED`.
- **FinalCuradoria**: existe se e somente se `HumanReviewResult.reviewStatus === VALIDATED` — é sempre o estado final e não-decisório (`decisional: false`, ADR-016) da curadoria entregue ao paciente.

---

## 16. Regras de acesso

Estende o modelo já decidido (`docs/ENGINEERING_PLAN.md`, seção 8: RLS como fronteira real, papéis via catálogo N:N, ADR-006):

- **Paciente**: lê e escreve apenas seus próprios Casos, sua própria Curadoria Final, seu próprio perfil e suas próprias solicitações de conexão. Nunca vê o Caso, a Shortlist ou a Matriz de Compatibilidade de outra pessoa.
- **Profissional**: lê e escreve apenas seu próprio perfil profissional; lê apenas as solicitações de conexão recebidas por ele. Nunca vê a Matriz de Compatibilidade, a Shortlist ou qualquer artefato interno do ACE de nenhum caso.
- **Curador Médico**: lê os Casos na fila de revisão (Shortlist + Matriz de Compatibilidade completa) atribuídos a ele ou disponíveis na fila geral; escreve apenas o `HumanReviewResult` da própria revisão que conduz. Não edita o Caso, a Shortlist ou qualquer artefato de análise diretamente — só registra sua decisão.
- **Administrador**: modera cadastro de profissionais; acesso a métricas agregadas. Acesso a Casos individuais **não é automático** só por ser Administrador — precisa também do papel de Curador Médico para revisar curadorias (papéis são cumulativos, não hierárquicos, ADR-006).
- **Público (sem sessão)**: perfis públicos de profissionais verificados (campos de vitrine, nunca a tabela inteira); a intake pública de "sua história" (sem exigir login até a confirmação final).

---

## 17. Papéis do sistema

Papéis já decididos (ADR-006): **Administrador**, **Profissional**, **Paciente**.

**Papel oficialmente adotado nesta fase: Curador Médico.** Necessário porque o P009 (Human Review) exige um julgamento qualificado e uma trilha de auditoria própria (`reviewerId`), distinto de moderação administrativa genérica. É um **papel operacional do produto** — vive no catálogo extensível já decidido em ADR-006 (nova linha em `roles` + policies específicas), exatamente o tipo de adição que esse modelo foi desenhado para suportar sem reestruturação. **Não exige nenhuma alteração no ACE**: o Método já modela a autoridade humana do P009 de forma agnóstica a quem a exerce (`reviewerId` é uma string opaca) — "Curador Médico" é só o nome, no produto, de quem ocupa esse papel. Uma pessoa pode acumular Administrador e Curador Médico ao mesmo tempo (papéis cumulativos, não hierárquicos) — comum na operação inicial, sem exigir desenho de processo adicional.

---

## 18. Dependências externas

Herdadas de `docs/ENGINEERING_PLAN.md` (seção 10) — nenhuma nova dependência é decidida aqui, apenas organizadas em relação à jornada:

- **Supabase** (Postgres, Auth, Storage) — identidade, dados, sessão.
- **Vercel** — hospedagem/deploy.
- **E-mail transacional** (ponto de extensão, ainda não confirmado) — necessário para notificar entrega de Curadoria Final, resposta de conexão, check-ins de acompanhamento.
- **Notificação (push/WhatsApp)** (ponto de extensão, ainda não confirmado) — mesmo uso acima; especialmente relevante para os check-ins do Concierge ao longo de 12 meses.
- **Nenhum provedor de IA/LLM está confirmado nesta fase** — os protocolos do ACE que hoje aceitam conteúdo simulado de linguagem natural (P002-P004, P010) precisarão, em algum momento futuro, de uma implementação real de `prompt.md` contra um modelo — isso é uma decisão de infraestrutura própria, com ADR, fora do escopo desta sprint.

---

## 19. Riscos

- **Confusão de papel entre os dois caminhos de descoberta** — se a comunicação de produto não deixar claro que Busca Direta e Concierge são modos diferentes (não um "melhor" e um "pior"), a pessoa pode se sentir empurrada para o caminho mais caro/lento sem necessidade.
- **Carga operacional da Revisão Humana** — o P009 exige uma pessoa qualificada por caso; se o volume de Casos crescer mais rápido que a capacidade de Curadores Médicos, o gargalo vira uma fila que contradiz a promessa de cuidado (Princípio 7, confiança construída lentamente, nunca prometida e quebrada).
- **Ambiguidade sobre quem é "equipe Aliviar"** — Curador Médico, Administrador e Time de Relacionamento podem, na prática inicial, ser as mesmas 1-2 pessoas; desenhar papéis demais cedo demais pode criar processo sem necessidade (Princípio 10, simplicidade) — mitigado tratando os papéis como cumulativos, não hierárquicos.
- **Acompanhamento de 12 meses sem ferramenta dedicada** — se o módulo `relationship` não existir ainda quando o primeiro Concierge for entregue, o acompanhamento vira processo manual fora do sistema (planilha, WhatsApp) — arriscando perda de rastreabilidade justamente no ponto em que a continuidade é um valor central do produto.
- **`story` (intake) hoje só persiste em `localStorage`** — antes de conectar ao ACE em produção, é necessário decidir e implementar persistência real (dado sensível, exige RLS desde o primeiro dia, `docs/ENGINEERING_PLAN.md`).
- **Nenhum provedor de IA real ainda escolhido** — o ACE está pronto para orquestrar, mas P002-P004/P010 dependem de geração/interpretação de linguagem natural que hoje só existe simulada em testes.

---

## 20. Roadmap do Produto

Não substitui o roadmap técnico (`docs/ENGINEERING_PLAN.md`, seção 13) — organiza a mesma evolução pela ótica de experiência do paciente, agora que o ACE existe:

1. **Fase 2 (esta sprint) — Arquitetura do Produto.** Este documento. Sem código.
2. **Fase 3 — Fundação de conta e perfil.** `auth` + `profiles` (paciente e profissional), cadastro/login, verificação de profissional.
3. **Fase 4 — Busca Direta.** `discovery` + perfil público + `connection` — entrega o valor mais simples e rápido do produto primeiro.
4. **Fase 5 — Orquestração do Concierge.** Módulo `concierge`: conectar `story` (já existe) ao `ace` (já existe) de ponta a ponta, com persistência real de Caso.
5. **Fase 6 — Painel do Curador Médico.** Módulo `curation-desk`: interface de Revisão Humana (P009) — o primeiro lugar em que um humano realmente opera o ACE.
6. **Fase 7 — Entrega e acompanhamento.** Comunicação da Curadoria Final ao paciente (P010) + módulo `relationship` para os check-ins de 12 meses.
7. **Fase 8 — Painel Administrativo.** Moderação/verificação de profissionais, métricas agregadas.
8. **Fase 9+ — Expansão modular.** Comunidade, instituições, benefícios, programas, IA real, parceiros — cada um com ADR e planejamento próprio, sem antecipação (mesma disciplina do ACE).

**Critério de conclusão de cada fase**: mesmo já usado no ACE e no plano técnico — lint, typecheck, testes (unitários + e2e onde aplicável) passando, documentação atualizada, sem commit/push até aprovação explícita.

---

## 21. Correção de regra de negócio — Cadastro e acesso do paciente

Regra oficial e definitiva (substitui qualquer suposição anterior de autocadastro público de paciente, se houver): **a equipe Aliviar realiza o cadastro inicial do paciente.** O paciente nunca cria conta por fluxo público — não existe, e não deve existir, signup público, botão "Cadastre-se", auto-onboarding ou convite aberto.

Fluxo oficial:

```
Administrador
  → cria o paciente
  → sistema cria usuário, perfil e papel (Admin API, server-side)
  → Aliviar recebe as credenciais de acesso (exibidas uma única vez)
  → Aliviar entrega login e senha ao paciente, por canal seguro, fora do sistema
  → paciente acessa normalmente as funções autorizadas
```

Não há troca de senha obrigatória no primeiro acesso por padrão — nenhum documento aprovado previa essa etapa; se vier a ser necessária, é uma decisão de produto própria, não assumida aqui.

**Segurança das credenciais**: a criação da conta ocorre exclusivamente no servidor, via a service role key do Supabase Auth (`src/lib/supabase/admin.ts`, protegido pelo pacote `server-only` — nunca importável de código de cliente). A senha é sempre gerada pelo sistema (nunca digitada pelo administrador, para nunca depender de uma senha fraca escolhida ad hoc); não é armazenada em texto puro (o Supabase Auth só guarda hash); não é registrada em log; não aparece em URL; não é persistida em `audit_logs`; é exibida somente uma vez, no momento da criação (ou de uma redefinição), e nunca mais pode ser consultada depois — nem pelo próprio administrador que a criou.

## 22. Correção de regra de negócio — Visibilidade da Curadoria

Regra oficial e definitiva: **as capacidades, forças, limitações, justificativas e critérios comparativos dos três Care Providers só podem ser mostrados ao paciente no relatório final de curadoria** (`FinalCuradoria`, P010 — `docs/ace/`).

Antes da entrega do P010, o paciente não pode visualizar, em nenhuma hipótese: `CompetencyProfile`, `EligibleProviderSet`, `CompatibilityMatrix`, a Shortlist interna, notas internas, capacidades/limitações/justificativas de seleção dos providers, comparações entre eles, evidências do ACE, ou qualquer conteúdo da Revisão Humana (`HumanReviewResult`) do Curador Médico. Todos esses artefatos permanecem restritos à equipe Aliviar (Curador Médico e Administrador) — nunca ao paciente, nunca ao profissional.

Somente a `FinalCuradoria` **validada** (`reviewStatus: VALIDATED`) pode apresentar ao paciente: os três Care Providers selecionados, capacidades relevantes de cada um, por que cada um foi incluído, forças para o caso, limitações relevantes, diferenças úteis entre os três, e próximos passos — exatamente o que o P010 já foi desenhado para produzir (`docs/ace/04-specs/P010-final-curadoria-delivery/`). Nunca mostrar score, ranking, "primeiro/segundo/terceiro lugar", vencedor, ordem de preferência, notas internas, pesos do Método, ou o raciocínio interno do ACE — o P010 já impõe isso mecanicamente (`assertNoForbiddenLanguage`, `src/modules/ace/artifacts/final-curadoria.ts`). A escolha final continua sempre pertencendo ao paciente.

**Estado atual da implementação (honestidade de escopo):** nenhum artefato do ACE (incluindo `FinalCuradoria`) tem persistência em banco ainda, e nenhuma página do paciente lê ou expõe qualquer artefato do ACE hoje — o módulo `ace` continua sendo uma biblioteca pura, sem camada de aplicação ao redor (seção 8/9). Esta regra é, portanto, formalizada agora como **guardrail obrigatório para quando essa integração for construída** (Fase 5 do roadmap, seção 20) — não uma capacidade retirada de algo que já existia. Um teste de regressão (`tests/unit/patient-ace-isolation.test.ts`) verifica mecanicamente, a partir de hoje, que nenhuma página ou ação alcançável pelo paciente importa qualquer coisa de `src/modules/ace` — qualquer tentativa futura de conectar o Concierge à área do paciente sem antes desenhar a fronteira de acesso correta (RLS + Server Action) quebra esse teste imediatamente.

**Controle de acesso (quando a integração existir):** reforçado por RLS e por autorização server-side, nunca só pela interface — o paciente nunca lê artefatos internos do ACE; nunca consulta `CompatibilityMatrix` ou a Shortlist interna; só lê a `FinalCuradoria` vinculada ao próprio Caso; Curador Médico e Administrador têm acesso conforme seus papéis já definidos (seção 16/17); um profissional nunca acessa avaliações internas de outros providers.
