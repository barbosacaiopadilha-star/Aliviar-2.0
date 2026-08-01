# RC1 — Playbook Operacional do Go Live

> Documento de operação. **Não descreve arquitetura, não registra backlog, não fala de versões futuras.** É o que a equipe precisa para colocar a Aliviar no ar e atender a primeira paciente real.
> **Data:** 2026-08-01 · **Ambiente:** produção (`awdlmeykminwyifnygkm`)

---

# 1 · Checklist de Go Live

## 1.1 · Engenharia

| | Item | Estado | Evidência |
|---|---|---|---|
| ✅ | Build de produção | **verde** | `next build` compila todas as rotas |
| ✅ | Migrations aplicadas | **verde** | 10 aplicadas em 2026-08-01, sem erro |
| ✅ | Ledger em paridade | **verde** | 64 pares local↔remoto, 0 pendentes, 0 remote-only |
| ✅ | Guarda NC-23 | **verde** | 64 de 64 |
| ✅ | Deriva de versão | **encerrada** | reparada e validada |
| ✅ | RLS | **verde** | 7 policies críticas com predicado idêntico ao validado por 383 testes |
| ✅ | Advisors de segurança | **zero ERROR** | o `security_definer_view` saiu |
| ✅ | Testes | **verde** | 1.676 unitários · 383 componentes · 383 integração |
| ✅ | Autenticação | **funcional** | 4 papéis com conta ativa |
| 🔴 | **Deploy do código atual** | **PENDENTE** | produção roda 41 commits atrás |
| ⚠️ | **Backup / PITR** | **NÃO VERIFICADO** | confirmar no painel antes de abrir |
| ⚠️ | Variáveis de ambiente na Vercel | **NÃO VERIFICADO** | conferir antes do deploy |
| ⚠️ | Rotação de credenciais expostas | **PENDENTE** | senha do banco e access token apareceram em log de sessão |

## 1.2 · Operação

| | Item | Estado |
|---|---|---|
| 🔴 | **3 profissionais reais publicados** | **0 hoje** — bloqueador |
| 🔴 | CRM verificado com proveniência | nenhum |
| 🔴 | Área de atuação verificada | nenhuma |
| 🔴 | Mapa do Profissional (26 subcritérios) | nenhum preenchido |
| ✅ | Curador com acesso | 1 — *Curador Aliviar* |
| ✅ | Concierge com acesso | 1 — *Concierge Aliviar* |
| ✅ | Atendente com acesso | 1 — *Atendente Aliviar* |
| ✅ | Administrador | 1 |
| ⚠️ | Contas de teste em produção | 3 pacientes, sendo ao menos 2 de teste — decidir se ficam |

**O que a operação precisa levantar por profissional, antes de publicar:**

- [ ] Nome e identificador
- [ ] **CRM e UF**
- [ ] **Consulta ao conselho**: fonte, data e quem verificou — o banco exige os três juntos
- [ ] **Área de atuação verificada**
- [ ] Nenhuma divergência crítica em aberto
- [ ] **Mapa dos 26 subcritérios preenchido**

Sem os três completos, **nenhum Relatório pode ser emitido** — o banco exige exatamente três opções.

## 1.3 · Produto

| | Superfície | Estado |
|---|---|---|
| ✅ | Portal da paciente — história, Perfil, Relatório, escolha | pronto |
| ✅ | Escolha, correção da escolha, modo de contato | pronto |
| ✅ | Declaração de contato e primeiro atendimento | pronto |
| ✅ | Workspace do Curador — Consulta, Perfil, Mapa, Seleção, Relatório | pronto |
| ✅ | Painel do Concierge — CRM e continuidade pós-decisão | pronto |
| ✅ | Connection — decisão até primeiro contato | pronto |
| ✅ | Relationship — nasce no primeiro atendimento | pronto |
| ✅ | Dashboards de administração | prontos |

---

# 2 · O primeiro dia

**Regra que vale o dia inteiro: a primeira Curadoria é acompanhada de perto por uma pessoa, do começo ao fim.** Nada roda sozinho no dia um.

| Quando | Quem | O quê |
|---|---|---|
| **Antes de abrir** | Engenharia | Deploy do código atual. Confirma que o site sobe e que os quatro papéis entram |
| | Administrador | Confirma backup/PITR ativo e variáveis de ambiente |
| | Operação | Publica os três profissionais e preenche os Mapas |
| | Administrador | Roda o smoke test da §4, ponta a ponta |
| **Abertura** | Direção | Decide GO com base na tabela da §7 |
| **Primeira paciente** | Atendente | Recebe o contato e abre o Case |
| | Curador | Assume, conduz a Consulta Inicial, monta o Perfil |
| | Paciente | Reconhece o Perfil como dela — **a Curadoria não abre sem isso** |
| | Curador | Preenche o Mapa, seleciona os três, escreve e emite o Relatório |
| | Curador | Entrega — **a entrega é humana, nunca uma notificação com anexo** |
| | Paciente | Lê, escolhe, e diz como quer começar |
| | Curador | Transfere a responsabilidade ao Concierge, com motivo |
| | Concierge | Assume e acompanha até o primeiro atendimento |
| **Fim do dia** | Administrador | Revisa logs, erros e a tabela de métricas da §6 |
| | Direção | Decide se abre para a segunda paciente |

**Quem decide:** Direção abre e fecha a operação. **Quem observa:** Administrador, o dia inteiro. **Quem acompanha a paciente:** Curador até a decisão, Concierge depois.

---

# 3 · A primeira Curadoria real

| # | Etapa | Responsável | Confirmação | Evidência | Risco |
|---|---|---|---|---|---|
| 1 | Contato inicial | **Atendente** | Case aberto no sistema | Case com responsável e história vinculada | Contato chega por canal não monitorado |
| 2 | Passagem ao Curador | **Atendente** | Transferência com motivo | Registro no histórico de responsabilidade | Ninguém assume; o Case fica parado |
| 3 | Consulta Inicial | **Curador** | Compreensão confirmada com a paciente | Registro da consulta e contexto clínico | Entender errado o que ela precisa |
| 4 | Perfil de Prioridades | **Curador** | Perfil validado | Perfil no estado validado | Prioridade traduzida com palavra que não é dela |
| 5 | **Reconhecimento pela paciente** | **Paciente** | Ela confirma que o Perfil é dela | Registro do reconhecimento | **Sem isso a Curadoria não avança — e é assim que deve ser** |
| 6 | Mapa do Profissional | **Curador** | 26 subcritérios tratados por profissional | Mapa preenchido | Mapa incompleto: o Motor devolve lacuna em tudo |
| 7 | Seleção dos três | **Curador** | Exatamente três | Seleção entregue | **Menos de três elegíveis: o banco recusa** |
| 8 | Relatório | **Curador** | Aprovado e emitido | Relatório com autoria e data | Emitir antes de aprovar — o banco recusa |
| 9 | Entrega | **Curador** | Conversa com a paciente | Relatório entregue | Entregar por notificação, sem pessoa |
| 10 | Leitura e escolha | **Paciente** | Escolha registrada | Registro da decisão | Ela não se reconhece em nenhum — **"nenhum dos três" é resposta legítima** |
| 11 | Modo de contato | **Paciente** | Modo registrado | Modo gravado com autoria | Escolher por ela |
| 12 | Passagem ao Concierge | **Curador** | Transferência com motivo | Registro auditado | Passagem feita pelo sistema, sem nome |
| 13 | Acompanhamento | **Concierge** | Caso visível no painel dele | Case na Continuidade Pós-Decisão | Ninguém olhar o painel |
| 14 | Primeiro atendimento | **Paciente** | Ela declara que aconteceu | Relationship criado | Declarar por ela |

**Duas coisas que não podem ser ditas à paciente no dia um, porque não são verdade:** qualquer prazo de resposta, e que o profissional foi avisado. A Aliviar ainda não contata o profissional — **quem contata é ela**, e o Concierge acompanha.

---

# 4 · Smoke test

*Para alguém da operação executar antes de abrir. Cada item termina em OK ou FALHOU.*

**Acesso**
1. Abrir o site. A página inicial carrega? ⬜ OK ⬜ FALHOU
2. Entrar como **Curador**. O workspace aparece? ⬜ OK ⬜ FALHOU
3. Entrar como **Concierge**. O painel aparece, com a seção de Continuidade? ⬜ OK ⬜ FALHOU
4. Entrar como **Atendente**. Consegue abrir um Case? ⬜ OK ⬜ FALHOU
5. Entrar como **paciente de teste**. O portal dela aparece? ⬜ OK ⬜ FALHOU

**Rede**
6. Na lista de profissionais, aparecem **pelo menos três reais publicados**? ⬜ OK ⬜ FALHOU
7. Algum profissional com "DEMO" no nome aparece como publicado? *(deve ser NÃO)* ⬜ OK ⬜ FALHOU

**Curadoria ponta a ponta, com Case de teste**
8. Abrir um Case novo e passar ao Curador. ⬜ OK ⬜ FALHOU
9. Registrar a Consulta Inicial e montar o Perfil. ⬜ OK ⬜ FALHOU
10. Entrar como a paciente e reconhecer o Perfil. ⬜ OK ⬜ FALHOU
11. Preencher o Mapa e selecionar três profissionais. ⬜ OK ⬜ FALHOU
12. Escrever, aprovar, emitir e entregar o Relatório. ⬜ OK ⬜ FALHOU
13. Como paciente, ver os três e escolher um. ⬜ OK ⬜ FALHOU
14. Trocar a escolha por outro dos três. Funciona? ⬜ OK ⬜ FALHOU
15. Dizer como quer começar (modo de contato). ⬜ OK ⬜ FALHOU
16. Transferir ao Concierge. O Case aparece no painel dele? ⬜ OK ⬜ FALHOU
17. Como paciente, declarar que iniciou o contato. ⬜ OK ⬜ FALHOU
18. Confirmar o primeiro atendimento. ⬜ OK ⬜ FALHOU

**Isolamento** *(o mais importante — se falhar, não abra)*
19. Entrar como paciente A e tentar ver o Case da paciente B. **Não deve conseguir.** ⬜ OK ⬜ FALHOU
20. Entrar como um Concierge **sem** o Case e tentar ver a decisão dela. **Não deve conseguir.** ⬜ OK ⬜ FALHOU

**Linguagem**
21. Nenhuma tela promete prazo ("responderemos em..."), nem diz que o Curador foi avisado, nem que a consulta está marcada. ⬜ OK ⬜ FALHOU

**Limpeza**
22. Descartar o Case de teste pelo caminho administrativo. ⬜ OK ⬜ FALHOU

---

# 5 · Incidentes prováveis no primeiro dia

| Incidente | Sintoma | Causa provável | Primeira ação | Quando escalar |
|---|---|---|---|---|
| **Menos de três elegíveis** | Curador não consegue emitir o Relatório | Profissional despublicado, inativo ou sem verificação | Conferir status, publicação e área verificada dos três | Se não houver terceiro real: **pausar a Curadoria e avisar a paciente que ainda estamos procurando** |
| **Profissional indisponível** | Ela liga e ele não atende mais | Informação envelheceu | Concierge assume: a falha é nossa, não dela. Reconferir e voltar a falar com ela | Se nenhum dos três estiver disponível, devolver ao Curador |
| **Paciente não entra** | Login falha | Conta não criada ou papel ausente | Administrador confere conta e papel | Se for erro de autenticação do sistema: engenharia, imediato |
| **Curador ou Concierge sem acesso** | Tela vazia ou "acesso negado" | Papel não atribuído, ou Case não transferido | Administrador confere papel e responsável do Case | Se o papel estiver certo e ainda faltar acesso: engenharia |
| **Case parado sem dono** | Ninguém assumiu depois da decisão | Transferência não feita | Administrador transfere ao Concierge, com motivo | Se repetir, revisar quem olha o painel |
| **CRM divergente** | Conselho não confirma o registro | Dado errado ou desatualizado | **Não publicar.** Registrar divergência | Direção decide se o profissional entra ou não |
| **Erro ao publicar** | Banco recusa a publicação | Falta CRM, UF, verificação, área ou há divergência crítica | Ler a mensagem: ela diz o que falta | Só escalar se a mensagem não corresponder ao dado |
| **Ela diz "nenhum dos três"** | Escolha não acontece | Perfil pode ter sido lido errado | **Não é incidente. É resposta legítima.** Perguntar o que faltou e voltar ao Curador | Nunca — é fluxo normal |
| **Piora clínica** | Ela relata que piorou | — | **Contato humano imediato. A Curadoria não atende urgência** — dizer isso e encaminhar a uma pessoa | Direção, na hora |

---

# 6 · Métricas do primeiro dia

**Só o que importa para saber se funcionou. Nada de conversão.**

| Métrica | Como saber | Por que importa |
|---|---|---|
| **Primeira Curadoria entregue** | sim ou não | é o objetivo do dia |
| Tempo do Case até o Relatório entregue | horas | dimensiona a carga real do Curador |
| Reconhecimento do Perfil pela paciente | aconteceu? | sem ele nada avança |
| Escolha concluída | sim, não, ou "nenhum dos três" | **os três desfechos são legítimos** |
| Modo de contato registrado | sim ou não | mede se a pergunta ficou clara |
| Primeiro atendimento declarado | sim ou não | fecha o ciclo |
| **Erros críticos** | contagem | qualquer um acima de zero exige revisão |
| Contatos de suporte | contagem e assunto | mostra onde a experiência confundiu |
| Casos parados sem responsável | contagem | **deve ser zero** |

**Não medir:** quanto tempo ela levou para decidir, quantas vezes voltou, se abriu a Mesa. **A operação é o objeto da medição; a paciente nunca é.**

---

# 7 · GO / NO GO

## GO — precisa ser verdade

| Item | Motivo | Responsável | Evidência |
|---|---|---|---|
| Build e deploy do código atual em produção | O código publicado está 41 commits atrás | Engenharia | Deploy concluído sem erro |
| Banco em paridade com o repositório | Sem isso o código quebra | Engenharia | ✅ 64 pares, 0 pendentes |
| Zero ERROR de segurança | Dado clínico exposto é inaceitável | Engenharia | ✅ advisors sem ERROR |
| Isolamento entre pacientes comprovado | | Administrador | Itens 19 e 20 do smoke test |
| **3 profissionais reais publicados** | Sem três, nenhum Relatório é emitido | Operação | Lista de publicados sem DEMO |
| CRM verificado com proveniência | Ninguém entra na rede sem conferência | Operação | Fonte, data e responsável registrados |
| Mapa dos 26 preenchido nos três | Sem ele o Motor só devolve lacuna | Curador | Mapa completo |
| Curador e Concierge com acesso | | Administrador | ✅ um de cada, ativos |
| Backup ou PITR ativo | Primeiro dia com dado real | Administrador | Confirmação no painel |
| Smoke test com 22 OK | | Administrador | Checklist assinado |
| Credenciais expostas rotacionadas | Senha e token vazaram em log | Administrador | Rotação confirmada |

## NO GO — impede abrir

| Item | Motivo |
|---|---|
| **Menos de 3 profissionais reais publicados** | A Curadoria não consegue entregar. A paciente percorreria tudo para não receber nada |
| **Código atual não publicado** | Produção rodaria versão antiga contra banco novo |
| Qualquer ERROR de segurança | Risco de uma paciente ver dado de outra |
| Itens 19 ou 20 do smoke test FALHOU | Isolamento quebrado |
| Sem backup confirmado | Primeiro dia real sem ponto de retorno |
| Algum DEMO publicado | Paciente real receberia profissional fictício |

---

# 8 · Estamos prontos para abrir a operação?

## **NÃO.**

**Falta exatamente isto:**

1. **Três profissionais reais publicados** — hoje são zero. Precisam de CRM, UF, verificação no conselho com fonte/data/responsável, área verificada e o Mapa dos 26 preenchido. *(Operação)*

2. **Publicar o código atual** — produção roda 41 commits atrás. *(Engenharia)*

3. **Confirmar backup ou PITR ativo.** *(Administrador)*

4. **Rotacionar a senha do banco e o access token** expostos em log. *(Administrador)*

5. **Executar o smoke test da §4 e obter 22 OK** — em especial os itens 19 e 20. *(Administrador)*

**Nada além disso.** O banco está pronto, a segurança está verde, o código está pronto e testado. **O que falta não é software: é a rede de profissionais e três passos de operação.**

---

> **O item 1 é o único que ninguém consegue apressar. Os outros quatro cabem numa manhã.**
