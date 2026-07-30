# Patient Experience Blueprint — Aliviar Curadoria Médica

Mapeamento de serviço (service design) da jornada do paciente, do primeiro acesso à Landing até o encerramento do relacionamento. Complementa `docs/PRODUCT_ARCHITECTURE.md` (que narra a jornada em prosa contínua) com o nível de detalhe de um blueprint de serviço: por etapa, o que o paciente busca, o que o sistema faz, que dado entra e sai, quem decide, qual protocolo do ACE participa, em que estado o Caso está, onde a experiência pode doer, e o que já foi observado como oportunidade futura — sem desenhar nada disso.

**Este documento não propõe.** Não há redesenho de UX, novas funcionalidades, telas, componentes ou código aqui — apenas a leitura mais precisa possível do que já existe, verificada diretamente contra `src/app/`, `src/modules/`, `supabase/migrations/` em 2026-07-15. Cada etapa é marcada como **[IMPLEMENTADO]** (existe e opera hoje), **[MODELO]** (só existe como modelagem de produto — `docs/PRODUCT_ARCHITECTURE.md` — sem código correspondente) ou **[DESCONTINUADO]** (existiu e opera apenas como histórico legível, sem caminho para novos Casos). Fontes primárias: `docs/PRODUCT_ARCHITECTURE.md` (auditado nesta mesma data), `src/modules/story`, `src/modules/cases`, `src/modules/concierge`, `src/app/(public)/sua-historia/`, `src/app/paciente/`, `src/app/curador/`, `src/app/admin/`, `supabase/migrations/20260712150000_final_curadoria_delivery.sql` (view `patient_case_overview`).

**Atualização 2026-07-26 (ADR-035 / ADR-036 / ADR-037)**: a Curadoria passou a ter uma única autoridade decisória — o Curador, na Mesa —, e o ACE deixou de ser motor de Curadoria. O fluxo canônico é `Curador → Relatório → Entrega → paciente escolhe → Connection → Concierge → Relationship`. As Etapas 7 e 8 abaixo descrevem a cadeia P009/P010, cujas superfícies (rotas de revisão, `HumanReviewForm`, `FinalCuradoriaDeliveryPanel` e as Server Actions correspondentes) foram descontinuadas e cujos escritores foram removidos do código: os dados permanecem íntegros e legíveis, mas **nenhum Caso novo percorre esse caminho**. As etapas foram remarcadas, não reescritas — o que elas descrevem continua sendo a leitura correta do histórico.

**Como ler**: os protocolos citados (P001–P010) são o ACE (`docs/ace/`); a coluna "Caso" usa os nove estados reais de `src/modules/cases/state-machine.ts` (`NEW, IN_REVIEW, WAITING_FOR_INFORMATION, READY_FOR_CURATION, IN_CURATION, HUMAN_REVIEW, DELIVERED, CLOSED, CANCELLED`), não os nomes conceituais antigos do documento pré-implementação.

---

## 1. Mapa completo da jornada

### Etapa 0 — Descoberta (Landing) `[IMPLEMENTADO]`

- **Objetivo do paciente**: entender, sem se comprometer, se a Aliviar é um lugar confiável para pedir ajuda.
- **Objetivo do sistema**: comunicar a promessa central (curadoria humana, nunca lista fria) e oferecer um único convite claro — contar a história.
- **Informações produzidas**: nenhuma (navegação anônima).
- **Informações consumidas**: nenhuma.
- **Decisões humanas existentes**: nenhuma — puramente editorial/institucional.
- **Protocolos envolvidos**: nenhum (fora do ACE).
- **Estados do Caso**: não aplicável — não existe paciente nem Caso ainda.
- **Pontos de atrito possíveis**: a Landing (`PortalExperience`, `src/components/landing/portal-experience.tsx`) é uma experiência de scroll contínuo sem seções ancoráveis tradicionais — alguém procurando informação específica rapidamente (preço, cobertura, como funciona em 3 linhas) precisa rolar a experiência inteira. **[RESOLVIDO — LAND DO PACIENTE, Fase 10, Decisão 1]**: o CTA secundário do WhatsApp (`final-actions.tsx:24`), que apontava para um link placeholder (`wa.me/message`, sem número real), foi removido — nenhum destino real existia para conectar. `FinalActions` passa a ter uma única ação.
- **Oportunidades futuras** _(apenas registro)_: nenhuma observada nesta etapa além do ponto de atrito de navegação acima (não corrigido, fora do escopo desta Fase). A remoção do CTA de WhatsApp aprofunda um achado já registrado em `docs/PATIENT_ENTRY_ARCHITECTURE.md` (item 3) — ver lá.

### Etapa 1 — Cadastro do paciente pela equipe `[IMPLEMENTADO]`

- **Objetivo do paciente**: nenhum — esta etapa acontece fora da experiência dele, antes de qualquer acesso ao produto (ADR mencionada em `PRODUCT_ARCHITECTURE.md` §21).
- **Objetivo do sistema**: garantir que toda conta de paciente nasça de uma ação humana da equipe Aliviar, nunca de autocadastro público.
- **Informações produzidas**: usuário Supabase Auth + perfil (`profiles`) + papel "paciente"; credencial temporária exibida uma única vez ao Administrador.
- **Informações consumidas**: dados básicos de identificação fornecidos por um canal externo ao produto (fora do escopo deste blueprint).
- **Decisões humanas existentes**: Administrador decide criar a conta (`src/app/admin/pacientes/novo/page.tsx`) e entrega login/senha por canal seguro fora do sistema.
- **Protocolos envolvidos**: nenhum (pré-ACE).
- **Estados do Caso**: não aplicável — Caso ainda não existe.
- **Pontos de atrito possíveis**: dependência total de um canal humano fora do produto para a pessoa sequer conseguir começar — sem autocadastro, o primeiro contato é sempre mediado, o que é uma escolha deliberada (não um bug), mas é também um gargalo operacional explícito (`PRODUCT_ARCHITECTURE.md` §19).
- **Oportunidades futuras** _(apenas registro)_: nenhuma nova além da já registrada no documento-fonte.

### Etapa 2 — Primeiro acesso / Login `[IMPLEMENTADO]`

- **Objetivo do paciente**: entrar com a credencial recebida e continuar de onde a Aliviar disse que ele poderia continuar.
- **Objetivo do sistema**: autenticar e direcionar corretamente por papel (`requireRole`, `src/modules/auth/guard.ts`); a raiz pública `sua-historia` explicitamente não permite preenchimento sem login — só explica e orienta a entrar (`src/app/(public)/sua-historia/page.tsx`).
- **Informações produzidas**: sessão autenticada.
- **Informações consumidas**: credenciais.
- **Decisões humanas existentes**: nenhuma (fluxo determinístico).
- **Protocolos envolvidos**: nenhum.
- **Estados do Caso**: não aplicável.
- **Pontos de atrito possíveis**: não observado neste blueprint (fora do escopo desta auditoria — autenticação em si não foi reexaminada linha a linha).
- **Oportunidades futuras** _(apenas registro)_: nenhuma observada.

### Etapa 3 — Acolhimento: "Sua História" (wizard) `[IMPLEMENTADO]`

- **Objetivo do paciente**: contar, no seu tempo, o que o trouxe até ali — com a segurança de poder parar e retomar depois.
- **Objetivo do sistema**: coletar, em 6 etapas (`para-quem → motivo → história → informações → preferências → revisão`), a matéria-prima da futura Narrativa (P001), sem perder nada entre sessões/dispositivos.
- **Informações produzidas**: `PatientStory` (`patient_stories`) — para quem é o cuidado, motivo (opcional), história (obrigatória), informações adicionais + anexos (opcional), preferência de modalidade (obrigatória), revisão final.
- **Informações consumidas**: nenhuma externa — cada etapa só lê o próprio rascunho anterior.
- **Decisões humanas existentes**: nenhuma humana da equipe; a única "decisão" é do próprio paciente, campo a campo.
- **Protocolos envolvidos**: nenhum ainda — este dado só vira Narrativa (P001) depois do envio, quando um Caso é aberto (Etapa 5).
- **Estados do Caso**: não aplicável — Caso ainda não existe; o que existe é `PatientStory.status: "rascunho"`.
- **Pontos de atrito possíveis**: o autosave debounced (600ms) com bloqueio de concorrência otimista (`use-story-draft.tsx`) previne perda de dado, mas por definição também pode rejeitar uma escrita como "conflito" se duas abas/dispositivos editarem quase simultaneamente — o comportamento visível ao paciente nesse cenário específico não foi verificado nesta auditoria; a etapa `historia` é a única obrigatoriamente de texto livre longo, o que pode ser difícil para quem está em sofrimento agudo (observação, não um defeito de implementação).
- **Oportunidades futuras** _(apenas registro)_: o passo `preferencias` (hoje um único campo binário/ternário de modalidade) é, estruturalmente, o único ponto de todo o wizard onde uma preferência é _declarada_ em vez de _inferida_ — registrado aqui apenas como fato observado, sem propor ampliação.

### Etapa 4 — História enviada, aguardando abertura de Caso `[IMPLEMENTADO]`

- **Objetivo do paciente**: saber que foi recebido e que alguém vai cuidar disso a partir daqui.
- **Objetivo do sistema**: confirmar o recebimento (`revisao/page.tsx`, "Recebemos sua história") e aguardar ação humana da equipe.
- **Informações produzidas**: `PatientStory.status: "enviada"`, `submittedAt` preenchido.
- **Informações consumidas**: nenhuma.
- **Decisões humanas existentes**: nenhuma ainda — este é exatamente o intervalo entre "paciente terminou" e "equipe começou".
- **Protocolos envolvidos**: nenhum.
- **Estados do Caso**: nenhum — **este é o intervalo em que não existe Caso**, apenas uma história enviada sem Caso associado (`patient-home-state.ts` chama isso de `submitted_without_case`).
- **Pontos de atrito possíveis**: **este é o único ponto de toda a jornada implementada em que o paciente não tem nenhum sinal de prazo ou fila** — a tela mostra "sua história já está conosco" sem qualquer expectativa de tempo, porque não existe, hoje, nenhuma automação que abra o Caso; depende inteiramente de uma ação manual da equipe (Etapa 5).
- **Oportunidades futuras** _(apenas registro)_: nenhuma proposta — apenas o registro do ponto de atrito acima.

### Etapa 5 — Abertura do Caso `[IMPLEMENTADO]`

- **Objetivo do paciente**: nenhum diretamente — invisível a ele.
- **Objetivo do sistema**: transformar uma história enviada em um Caso rastreável, sob responsabilidade de alguém da equipe.
- **Informações produzidas**: registro em `cases` (status inicial `NEW`), vinculado à `PatientStory` de origem.
- **Informações consumidas**: `PatientStory` com `status: "enviada"` (pré-requisito verificado por `createCase`, que recusa abrir um segundo Caso ativo para a mesma história).
- **Decisões humanas existentes**: Administrador aciona `createCaseAction` (`StartCaseButton`, `src/app/admin/pacientes/[id]/page.tsx`).
- **Protocolos envolvidos**: nenhum ainda (pré-P001).
- **Estados do Caso**: `NEW`.
- **Pontos de atrito possíveis**: nenhuma automação ou notificação observada que force esta etapa a acontecer em um prazo — depende de a equipe revisitar a lista de pacientes.
- **Oportunidades futuras** _(apenas registro)_: nenhuma.

### Etapa 6 — Curadoria automática em processamento `[IMPLEMENTADO]` (ACE P001–P008)

- **Objetivo do paciente**: esperar, confiando que algo está de fato acontecendo.
- **Objetivo do sistema**: estruturar a história em um Caso de decisão completo, avaliar todos os profissionais elegíveis e propor uma composição — sem intervenção humana nesta fase.
- **Informações produzidas, em sequência** (`src/modules/concierge/orchestrator.ts`): Narrativa (P001, construída deterministicamente da história, sem chamada a modelo de linguagem) → Caso de Decisão (P002) → Auditoria do Caso (P003) → Contexto de Decisão (P004) → Perfil de Competência (P005) → Conjunto de Profissionais Elegíveis (P006) → Matriz de Compatibilidade (P007) → Shortlist (P008).
- **Informações consumidas**: a Narrativa/história do paciente; perfis de profissionais via `ProviderRepository`/`ProviderProfileRepository` (implementados por `profiles`, nunca acessados diretamente pelo ACE).
- **Decisões humanas existentes**: nenhuma — automatizado ponta a ponta.
- **Protocolos envolvidos**: P001–P008.
- **Estados do Caso**: `READY_FOR_CURATION` → `IN_CURATION`.
- **Pontos de atrito possíveis**: para o paciente, o rótulo visível não distingue "processamento automático" de "revisão humana" com granularidade — `patient_case_overview` mostra "Sua curadoria está sendo preparada." (`READY_FOR_CURATION`) e depois "Sua curadoria está em andamento." (`IN_CURATION`), textos parecidos e sem indicação de tempo estimado.
- **Oportunidades futuras** _(apenas registro)_: nenhuma além do ponto de atrito já registrado.

### Etapa 6a — Ramo: bloqueio por informação insuficiente `[IMPLEMENTADO]`

- **Objetivo do paciente**: entender, se perguntado, o que falta — mas hoje ele não é ativamente notificado nesta transição específica (não verificado nesta auditoria se há notificação automática).
- **Objetivo do sistema**: nunca prosseguir com uma base de decisão incompleta (Kernel §2, ADR-024).
- **Informações produzidas**: resultado `BLOCKED` da Auditoria do Caso (P003).
- **Informações consumidas**: a mesma Narrativa/Caso de Decisão já produzidos.
- **Decisões humanas existentes**: nenhuma automática nesta transição — é o próprio P003 que decide bloquear; a retomada de `WAITING_FOR_INFORMATION` de volta a `IN_REVIEW` é que depende de ação humana.
- **Protocolos envolvidos**: P003.
- **Estados do Caso**: `IN_CURATION` → `WAITING_FOR_INFORMATION`.
- **Pontos de atrito possíveis**: o rótulo visível ao paciente ("Precisamos de uma informação adicional.") não diz _qual_ informação — o pedido específico, se existir, acontece fora do produto (mesmo gargalo de canal humano da Etapa 1).
- **Oportunidades futuras** _(apenas registro)_: nenhuma além do ponto de atrito.

### Etapa 7 — Revisão Humana `[DESCONTINUADO — ADR-036]` (ACE P009)

- **Objetivo do paciente**: nenhum diretamente — invisível.
- **Objetivo do sistema**: garantir que nenhuma decisão de cuidado saia da Aliviar sem julgamento humano qualificado (Constituição do ACE, Princípio 9).
- **Informações produzidas**: `HumanReviewResult` (append-only, ADR-025) — decisão + justificativa do Curador.
- **Informações consumidas**: Narrativa, Contexto de Decisão, Matriz de Compatibilidade completa, Shortlist proposta — tudo já organizado pelo ACE (`curador/casos/[id]/revisao`).
- **Decisões humanas existentes** _(histórico)_: o Curador Médico decidia `APPROVE`, `ADJUST`, `REJECT` ou `REQUEST_MORE_INFORMATION` por uma ação server-side própria, nunca disparada pelo orquestrador automático. Essa superfície e o escritor correspondente não existem mais; hoje a decisão do Curador acontece na Mesa e produz o Relatório.
- **Protocolos envolvidos**: P009.
- **Estados do Caso**: `HUMAN_REVIEW` (mantido em `APPROVE`/`ADJUST` até a entrega; retorna a `WAITING_FOR_INFORMATION` em `REQUEST_MORE_INFORMATION`).
- **Pontos de atrito possíveis**: no máximo um `HumanReviewResult` `VALIDATED` por Caso (ADR-025) — se uma primeira revisão rejeitar e uma segunda, mais tarde, validar, o histórico completo permanece (nunca apagado), o que é correto para auditoria mas significa que "quantas vezes isso foi revisado" nunca é mostrado ao paciente hoje.
- **Oportunidades futuras** _(apenas registro)_: nenhuma além do já registrado.

### Etapa 8 — Entrega da Curadoria Final `[DESCONTINUADO — ADR-036]` (ACE P010)

- **Objetivo do paciente**: finalmente ver o resultado — três profissionais, com porquês, sem hierarquia.
- **Objetivo do sistema**: materializar e comunicar a curadoria validada, nunca antes disso (`PRODUCT_ARCHITECTURE.md` §22 — nenhum artefato interno do ACE é visível ao paciente antes da entrega).
- **Informações produzidas**: `FinalCuradoria` — três Care Providers, capacidades relevantes, porquê de cada um, forças, limitações, diferenças úteis, próximos passos; nunca score, ranking ou "primeiro/segundo/terceiro" (mecanicamente garantido por `assertNoForbiddenLanguage`).
- **Informações consumidas**: o `HumanReviewResult` `VALIDATED`.
- **Decisões humanas existentes** _(histórico)_: Curador/Administrador acionava a entrega explicitamente — "nunca automático", mesmo após validação. Essa superfície e o escritor correspondente não existem mais; hoje a entrega canônica é a do Método (Relatório entregue sobre seleção entregue), reconhecida pelo contrato em `src/modules/curadoria/delivery-contract.ts`.
- **Protocolos envolvidos**: P010.
- **Estados do Caso**: `HUMAN_REVIEW` → `DELIVERED`.
- **Pontos de atrito possíveis**: existe um intervalo entre "revisão validada" e "entrega efetivamente acionada" (duas ações humanas distintas, não uma) — o rótulo do paciente ("Sua curadoria está em revisão final.") não muda até a entrega de fato ocorrer, então esse intervalo é invisível a ele.
- **Oportunidades futuras** _(apenas registro)_: nenhuma além do ponto de atrito.

### Etapa 9 — Decisão e primeiro contato `[IMPLEMENTADO — docs/DECISIONS.md ADR-027]`

**Histórico (preservado)**: até 2026-07-15 esta etapa era `[MODELO — não implementado]`, com o texto abaixo (mantido por rastreabilidade, nunca apagado): _"Objetivo do paciente (modelado): escolher um dos três profissionais e solicitar contato. Objetivo do sistema (modelado): mediar a solicitação via módulo `connection`. Informações produzidas/consumidas: nenhuma — não há campo, tabela ou ação no código atual. Decisões humanas existentes: hoje, nenhuma no produto — a decisão do paciente acontece inteiramente fora do sistema. Estados do Caso: `DELIVERED` permanece o estado técnico — não há transição de Caso associada a "solicitar contato" hoje. Pontos de atrito possíveis: este é o primeiro ponto da jornada em que a modelagem de produto e a implementação real divergem por completo... Oportunidades futuras: `connection` já existe como pasta reservada e vazia."_ No mesmo dia, esta etapa passou por um segundo estado intermediário, `[IMPLEMENTAÇÃO EM AUDITORIA]`, antes desta promoção — ver ADR-027 para o relato completo.

Estado atual, verificado contra `src/modules/connection` e validado por 14 testes de integração contra Supabase local (Fase 4, 2026-07-15 — criação, transições, RLS, concorrência otimista de criação e de transição, append-only, atomicidade):

- **Objetivo do paciente**: escolher um dos três profissionais apresentados na Curadoria (`ConnectionChoicePanel`), revisar antes de confirmar, corrigir enquanto a escolha não avançar; depois, registrar intenção de contato, confirmar primeiro atendimento, ou encerrar sem relacionamento (`ConnectionProgressPanel`).
- **Objetivo do sistema**: `modules/connection/actions.ts` (5 Server Actions) medeia cada uma dessas decisões, sempre exigindo papel "paciente" e posse do Caso.
- **Informações produzidas/consumidas**: `connection_records`/`connection_events` (Postgres, RLS) — estado atual + histórico append-only de eventos.
- **Decisões humanas existentes**: todas as transições exigem ação explícita do próprio paciente (nunca automática); nenhuma delas é verificada externamente (declaração do paciente, sem integração de telefonia/WhatsApp/agenda).
- **Protocolos envolvidos**: nenhum (fora do ACE por definição, `PRODUCT_ARCHITECTURE.md` §11) — `connection` só lê `FinalCuradoriaDelivery` já entregue, nunca escreve em artefato do ACE.
- **Estados do Caso**: `cases.status` não é alterado por `connection` — a máquina de estados de `ConnectionRecord` é própria e independente (`DECISAO_REGISTRADA` → `CONTATO_INICIADO` → `PRIMEIRO_ATENDIMENTO_REALIZADO`/`ENCERRADO_SEM_RELACIONAMENTO`).
- **Pontos de atrito possíveis**: nenhum novo identificado nesta atualização — auditoria técnica completa registrada no relatório da fase que produziu esta correção.
- **Oportunidades futuras** _(apenas registro)_: `PRIMEIRO_ATENDIMENTO_REALIZADO` é, desde 2026-07-15 (`docs/DECISIONS.md` ADR-028), o marco real de nascimento atômico de um `Relationship` (ver Etapa 11) — não mais apenas identificado no domínio, já implementado. O acompanhamento contínuo (Etapa 10) permanece não implementado.

### Etapa 10 — Acompanhamento (12 meses) `[MODELO — não implementado]`

- **Objetivo do paciente/sistema** _(modelado)_: check-ins periódicos conduzidos pelo Time de Relacionamento; ver `PRODUCT_ARCHITECTURE.md` §12.
- **Informações produzidas/consumidas**: nenhuma — nenhum dado estruturado existe para isso hoje.
- **Decisões humanas existentes**: nenhuma no produto.
- **Protocolos envolvidos**: nenhum — explicitamente fora do ACE (§11: "o ACE não monitora o paciente").
- **Estados do Caso**: nenhum estado de Caso cobre esta fase — `DELIVERED`/`CLOSED` não distinguem "em acompanhamento ativo" de "encerrado sem acompanhamento".
- **Pontos de atrito possíveis**: não aplicável — não implementado.
- **Oportunidades futuras** _(apenas registro)_: nenhum placeholder de módulo existe no repositório para isto (diferente de `connection`/`discovery`) — fato já registrado em `PRODUCT_ARCHITECTURE.md` §8.

### Etapa 11 — Encerramento e reabertura `[IMPLEMENTAÇÃO EM AUDITORIA — docs/DECISIONS.md ADR-028]`

**Histórico (preservado)**: até 2026-07-15 esta etapa era `[MODELO — não implementado]`, nomeada "Encerramento, renovação ou reabertura", com o texto abaixo (mantido por rastreabilidade, nunca apagado): _"Objetivo do paciente/sistema (modelado): encerrar, renovar, ou abrir um novo Caso do zero (nunca editar o anterior). Informações produzidas/consumidas: nenhuma — `CLOSED` existe como estado técnico do Caso, mas nenhum fluxo de produto o aciona hoje fora de uma transição manual direta. Decisões humanas existentes: nenhuma modelada em código. Protocolos envolvidos: nenhum. Estados do Caso: `DELIVERED → CLOSED` é uma transição válida na máquina de estados, mas sem UI/ação de produto observada que a dispare com o significado de "ciclo de 12 meses encerrado" especificamente. Pontos de atrito possíveis: não aplicável — não implementado."_ **Achado, registrado sem inventar resolução**: "renovação" nunca existiu como conceito na teoria formal do domínio Relationship (`docs/architecture/DOMAIN_RELATIONSHIP.md`, Veredito A) — a teoria testou e rejeitou explicitamente qualquer noção de ciclo temporal fixo; reabertura é sempre um Caso/Connection/Relationship inteiramente novos, nunca uma renovação do registro anterior. O nome da etapa foi ajustado para não sugerir uma capacidade que a teoria aprovada não prevê.

Estado atual, verificado contra `src/modules/relationship` e validado por 37 testes de integração contra Supabase local (Fase 6.1/6.2, 2026-07-15):

- **Objetivo do paciente**: registrar o encerramento planejado ou a interrupção de um Relationship ATIVO (`RelationshipStatusPanel`); reabertura observada é registrada pela equipe (Curador/Administrador), nunca pelo paciente diretamente — gera sempre um Caso novo, nunca reabre o Relationship encerrado.
- **Objetivo do sistema**: `modules/relationship/actions.ts` medeia encerramento/interrupção, sempre exigindo autoria do próprio paciente; `register_relationship_reopening` (RPC) exige Relationship terminal e um Caso novo real.
- **Informações produzidas/consumidas**: `relationship_records`/`relationship_events` (Postgres, RLS) — estado atual (ATIVO/ENCERRADO) + histórico append-only de eventos, incluindo `REABERTURA_OBSERVADA`.
- **Decisões humanas existentes**: encerramento/interrupção são sempre declaração explícita do paciente; reabertura é sempre declaração explícita da equipe, nunca inferida de tempo decorrido ou silêncio.
- **Protocolos envolvidos**: nenhum (fora do ACE por definição) — abrir o novo Caso decorrente de uma reabertura é responsabilidade da Jornada/ACE, não deste domínio.
- **Estados do Caso**: não alterados por Relationship — `cases.status` permanece de responsabilidade exclusiva da Jornada/Curadoria.
- **Pontos de atrito possíveis**: nenhum novo identificado nesta atualização.
- **Oportunidades futuras** _(apenas registro)_: Correção de Registro, Contestação, Resolução de Efeito Operacional, Provenance completo, Encerramento por Falecimento e Troca de Profissional são previstos pela arquitetura técnica aprovada mas ainda não implementados — ver `docs/DECISIONS.md` ADR-028 para a matriz de capacidades completa.

---

## 2. Blueprint da experiência (linha de visibilidade)

| Etapa                   | Ação do paciente (front stage)                                                           | Interface visível                                                         | — Linha de visibilidade — | Processo automático (backstage/sistema)                                                 | Processo humano (backstage/equipe)                         |
| ----------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 0. Descoberta           | Navega a Landing                                                                         | `PortalExperience`, `FaqBookSection`                                      |                           | —                                                                                       | —                                                          |
| 1. Cadastro             | (nenhuma — fora do produto)                                                              | —                                                                         |                           | criação de usuário/perfil via Admin API server-side                                     | Administrador cria a conta                                 |
| 2. Login                | Faz login                                                                                | `/login`                                                                  |                           | validação de sessão (`requireRole`)                                                     | —                                                          |
| 3. Acolhimento          | Preenche o wizard em 6 etapas                                                            | `sua-historia/(wizard)/*`                                                 |                           | autosave a cada 600ms, concorrência otimista                                            | —                                                          |
| 4. Aguardando           | Vê "sua história já está conosco"                                                        | `PatientHomeState: submitted_without_case`                                |                           | nenhum                                                                                  | equipe ainda não revisitou a lista de pacientes            |
| 5. Abertura do Caso     | (nenhuma)                                                                                | —                                                                         |                           | criação do registro `cases`                                                             | Administrador aciona `createCaseAction`                    |
| 6. Curadoria automática | Vê "sua curadoria está sendo preparada/em andamento"                                     | `patient_case_overview` (`READY_FOR_CURATION`/`IN_CURATION`)              |                           | P001→P008 via `orchestrator.ts`                                                         | —                                                          |
| 6a. Bloqueio            | Vê "precisamos de uma informação adicional"                                              | `patient_case_overview` (`WAITING_FOR_INFORMATION`)                       |                           | P003 retorna `BLOCKED`                                                                  | equipe entra em contato fora do produto                    |
| 7. Revisão Humana _(descontinuado)_ | Vê "sua curadoria está em revisão final"                                     | `patient_case_overview` (`HUMAN_REVIEW`)                                  |                           | nenhum                                                                                  | Curador decide na Mesa (a superfície P009 não existe mais) |
| 8. Entrega _(descontinuado)_ | Vê "sua Curadoria está pronta!" e a página `paciente/curadoria`                 | `FinalCuradoriaView`                                                      |                           | nenhum                                                                                  | entrega canônica do Método (a superfície P010 não existe mais) |
| 9. Decisão/contato      | Escolhe profissional, revisa, confirma; depois registra contato/atendimento/encerramento | `ConnectionChoicePanel`, `ConnectionProgressPanel` (`paciente/curadoria`) |                           | 5 Server Actions (`modules/connection/actions.ts`), RLS + triggers de transição atômica | —                                                          |
| 10. Acompanhamento      | _(modelo)_                                                                               | _(inexistente)_                                                           |                           | _(inexistente)_                                                                         | _(inexistente)_                                            |
| 11. Encerramento        | _(modelo)_                                                                               | _(inexistente)_                                                           |                           | _(inexistente)_                                                                         | _(inexistente)_                                            |

A "linha de visibilidade" clássica de service blueprint (o que o paciente vê vs. o que só a equipe/sistema vê) coincide quase exatamente, hoje, com a fronteira que `PRODUCT_ARCHITECTURE.md` §22 já formaliza como regra de negócio: nada do ACE (Narrativa, Contexto, Perfil de Competência, Conjunto Elegível, Matriz de Compatibilidade, Shortlist, `HumanReviewResult`) cruza essa linha antes da etapa 8 — o paciente só recebe o `status_label` textual da view `patient_case_overview`, nunca um artefato interno.

---

## 3. Fluxo de dados entre módulos

```
story ──(PatientStory: enviada)──▶ [ação manual: Administrador]
                                          │
                                          ▼
cases ◀────────────────(createCase)──────┘
  │
  │ (Case NEW/READY_FOR_CURATION)
  ▼
concierge ──executa P001→P008──▶ ace (puro)
  │                                  │
  │                          (lê perfis via portas)
  │                                  ▼
  │                        profiles (ProviderRepository /
  │                        ProviderProfileRepository)
  │
  ├─(Shortlist pronta)──▶ Case: HUMAN_REVIEW
  │                             │
  │                    [ação humana: Curador — P009]
  │                             ▼
  │                    HumanReviewResult (append-only)
  │                             │
  │                    [ação humana: Curador/Admin — P010]
  │                             ▼
  └─(FinalCuradoria)──▶ Case: DELIVERED
                              │
                              ▼
                    patient_case_overview (view)
                              │
                              ▼
                    paciente/curadoria, paciente/page.tsx
                    (home-state.ts deriva no_story/draft/
                     submitted_without_case/case_available)

  ✂── linha de visibilidade do paciente ──✂
  (nada acima desta linha, exceto o status_label textual
   e a FinalCuradoria já validada, é lido pelo paciente)

connection, relationship ── módulos consumidores futuros,
  hoje sem produtor de dado real (MODELO).
```

Nenhum módulo lê o dado de outro diretamente fora deste fluxo — `concierge` é o único que conhece `ace` como dependência direta; `ace` nunca acessa a tabela de profissionais, só as portas implementadas por `profiles` (`PRODUCT_ARCHITECTURE.md` §9, confirmado no código).

---

## 4. Linha do tempo do paciente

Sequência exata do que o paciente pode ler, palavra por palavra (`patient_case_overview`, `supabase/migrations/20260712150000_final_curadoria_delivery.sql:90-107`, combinada com os estados de `PatientHomeState`, `src/modules/paciente/home-state.ts`):

| Momento                                 | O que o paciente vê                                                                           | Origem do texto                                |
| --------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Antes de qualquer história              | "Este espaço começa com a sua história."                                                      | `PatientHomeState: no_story`                   |
| Rascunho iniciado, não enviado          | "Sua história continua aqui."                                                                 | `PatientHomeState: draft`                      |
| História enviada, Caso ainda não aberto | "Sua história já está conosco."                                                               | `PatientHomeState: submitted_without_case`     |
| Caso `NEW`                              | "Recebemos sua história."                                                                     | `patient_case_overview`                        |
| Caso `IN_REVIEW`                        | "Nossa equipe está organizando as informações."                                               | `patient_case_overview`                        |
| Caso `WAITING_FOR_INFORMATION`          | "Precisamos de uma informação adicional."                                                     | `patient_case_overview`                        |
| Caso `READY_FOR_CURATION`               | "Sua curadoria está sendo preparada."                                                         | `patient_case_overview`                        |
| Caso `IN_CURATION`                      | "Sua curadoria está em andamento."                                                            | `patient_case_overview`                        |
| Caso `HUMAN_REVIEW`                     | "Sua curadoria está em revisão final."                                                        | `patient_case_overview`                        |
| Caso `DELIVERED`                        | "Sua Curadoria está pronta!" + `FinalCuradoriaView` (3 profissionais)                         | `patient_case_overview` + `paciente/curadoria` |
| Caso `CLOSED`                           | "Seu acompanhamento foi encerrado."                                                           | `patient_case_overview`                        |
| Caso `CANCELLED`                        | "Não conseguimos avançar com esta curadoria no momento — nossa equipe vai entrar em contato." | `patient_case_overview`                        |

Nove textos distintos cobrem os nove estados técnicos do Caso — a jornada visível é, ponto a ponto, mais granular e mais cuidadosamente redigida do que os diagramas conceituais de `PRODUCT_ARCHITECTURE.md` §13 sugeriam antes desta auditoria.

---

## 5. Linha do tempo operacional da equipe

1. **Administrador** cria o profissional (mesmo padrão do paciente — "criado e mantido pela equipe, nunca por autocadastro", `src/app/admin/profissionais/page.tsx:27-28`) — pré-condição para qualquer profissional ser elegível em P006. _(Observação: `PRODUCT_ARCHITECTURE.md` §6 descreve uma etapa de "verificação" por Administrador distinta do cadastro; não foi encontrado, nesta auditoria, um campo de status de verificação separado no módulo `profiles` — pode ser que cadastro e verificação sejam, na prática, o mesmo ato hoje. Registrado como divergência não totalmente resolvida, não corrigida no documento-fonte por falta de confirmação suficiente.)_
2. **Administrador** cria o paciente (Etapa 1 do mapa acima).
3. _(paciente conta sua história — fora da linha do tempo da equipe)_
4. **Administrador** abre o Caso a partir de uma história `enviada` (`StartCaseButton`).
5. **Sistema** roda P001–P008 automaticamente — nenhuma ação de equipe durante esta janela.
6. **Curador Médico** monitora a fila (`curador/page.tsx`: casos atribuídos, contagem "aguardando informação", contagem "pronto para curadoria"; `curador/casos/page.tsx`: lista completa).
7. **Curador Médico** conduz a Curadoria na Mesa (`/coa/curadoria/casos/[id]/…`): critérios, comparação e seleção humana de exatamente três profissionais. _(Até 2026-07-26 esta etapa era a revisão P009 em `curador/casos/[id]/revisao`, descontinuada pela ADR-036.)_
8. **Curador Médico** emite e entrega o Relatório — a entrega canônica, reconhecida por `curadoria.case_has_delivered_curadoria`. _(Até 2026-07-26 era a entrega P010 pelo `FinalCuradoriaDeliveryPanel`, descontinuado pela ADR-036.)_
9. **Administrador** acompanha, em paralelo a todo o resto, a observabilidade cross-Caso do ACE (`admin/ace`: health check, métricas, execuções) — não é uma etapa sequencial, é um painel contínuo.
10. **Curador Médico ou Administrador** registra reabertura observada contra um Relationship terminal, vinculada a um Caso novo real (`register_relationship_reopening`, `docs/DECISIONS.md` ADR-028, 2026-07-15) — implementado, sem UI dedicada (via RPC/repository; nenhuma tela de equipe para isso ainda). _(modelo, não implementado)_ check-ins periódicos de acompanhamento continuam sem nenhuma tela, ação ou tabela.

---

## 6. Pontos onde futuramente poderão nascer novos domínios (observação arquitetural)

Registro factual de onde a arquitetura atual já deixa uma fronteira aberta — nenhuma proposta de solução:

- **`connection`** — **[IMPLEMENTADO, 2026-07-15, ADR-027]** deixou de ser pasta reservada vazia; implementa "decisão e primeiro contato" (Etapa 9) para o caminho Concierge, validado por testes de integração contra banco real (Fase 4). **Achado, registrado sem resolver**: este documento e `PRODUCT_ARCHITECTURE.md` descrevem `connection` como convergência das duas portas de entrada (Concierge e Busca Direta), "a origem é só um metadado, nunca uma ramificação de lógica" — mas o schema implementado (`connection_records.final_curadoria_delivery_id uuid not null`) exige uma `FinalCuradoriaDelivery`, que só o caminho Concierge produz; Busca Direta/`discovery` não existe, então hoje não há como o módulo servir os dois caminhos como projetado. Nenhum dos dois documentos foi alterado para resolver essa divergência — decisão de produto/arquitetura própria, fora do escopo desta correção factual.
- **`relationship`** — **[IMPLEMENTAÇÃO EM AUDITORIA, 2026-07-15, ADR-028]** deixou de ser inexistente; implementa encerramento e reabertura (Etapa 11), validado por 37 testes de integração contra banco real. O acompanhamento contínuo/cadência de check-in (Etapa 10) segue sem nenhum artefato.
- **`discovery`** — pasta reservada, vazia. Fora do escopo da jornada Concierge mapeada aqui (é a porta "Busca Direta", `docs/DISCOVERY_ENGINE.md`), mas compartilha o mesmo `connection` como ponto de convergência.
- **Compatibility Intelligence (CI)** — já avaliado conceitualmente e formalmente congelado (ver decisão de 2026-07-15, registrada fora deste documento). Fica apenas registrado aqui, sem retomar o desenho: os pontos de sinal identificados nesse trabalho anterior — declaração de preferência (hoje só o campo `preferencias` do wizard) e experiência vivida (hoje inexistente, dependeria de `relationship`) — coincidem exatamente com as duas lacunas de módulo acima. Isso não é uma recomendação de sequência, apenas uma coincidência estrutural observada.

---

**Escopo não coberto por este documento**: jornada completa do profissional parceiro além do que intersecta a jornada do paciente (cadastro, elegibilidade a P006); autenticação em detalhe; qualquer coisa da porta "Busca Direta" (`discovery`/`connection` como MVP original, `docs/DISCOVERY_ENGINE.md`) além de citá-la como módulo reservado.
