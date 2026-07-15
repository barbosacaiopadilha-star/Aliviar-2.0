# Arquitetura de Entrada do Paciente

Autoridade sobre a fronteira entre a experiência pública (Landing) e o produto autenticado — hoje distribuída entre `docs/PRODUCT_ARCHITECTURE.md` §4.2 e §21, `docs/LANDING_CREATIVE_DIRECTION.md`, `docs/CODEBASE_MAP.md` e o código real, sem nenhum documento próprio. Este é esse documento. Não desenha interface, não altera a jornada existente, não corrige nada do que encontra — mapeia a transição tal como ela é hoje.

**Método**: leitura direta do código real (`src/app/(public)/sua-historia/`, `src/app/(auth)/login/`, `src/modules/auth/`, `src/modules/cases/actions.ts`, `src/app/admin/pacientes/novo/`) contra `docs/PRODUCT_ARCHITECTURE.md` §4.2, §21 e `docs/PATIENT_EXPERIENCE_BLUEPRINT.md` (que já mapeou parte adjacente desta fronteira, do lado do produto). Nenhum documento da Landing (`LANDING_*`) foi revisto ou alterado para produzir este documento — apenas referenciado onde relevante.

---

## Achado central, antes de qualquer estado

A pergunta 2 do pedido ("quando a pessoa deixa de ser visitante e passa a ser paciente?") pressupõe que isso acontece **na** jornada digital da pessoa. Não acontece. Por regra de negócio já definitiva (ADR-018, formalizada em `PRODUCT_ARCHITECTURE.md` §21): **não existe autocadastro público de paciente.** A conta — e com ela, o papel "paciente" no catálogo de papéis (ADR-006) — é criada por um Administrador, numa superfície autenticada do próprio Produto (`/admin/pacientes/novo`), **antes** de a pessoa ter qualquer interação digital com a Aliviar, e sem que a Landing saiba, em nenhum momento, se isso já aconteceu ou não.

Ou seja: a pessoa já é "paciente" no banco de dados antes de existir como "visitante" na Landing. A jornada que seções 3-6 abaixo mapeiam não é uma jornada de *conversão* (visitante → paciente) — é uma jornada de **ativação** de uma identidade já concedida por decisão humana anterior, fora de qualquer superfície documentada como parte desta fronteira.

---

## 1. O último momento da Landing

Conceitualmente, a Landing termina no **convite** — o clique num CTA ("Contar minha história" → `/sua-historia`, ou "Entrar" → `/login`). Não termina numa página específica: `LANDING_CREATIVE_DIRECTION.md` §6 define 12 seções, e nenhuma delas é `sua-historia`. A raiz pública de `sua-historia` (`src/app/(public)/sua-historia/page.tsx`) vive, por estrutura de pasta, dentro do mesmo route group `(public)` da Landing (`docs/CODEBASE_MAP.md`) — mas não é uma das 12 seções, não segue o Motor do Portal, e não é regida por nenhum dos seis documentos canônicos da Landing. Ela é, na prática, uma **terceira zona**: nem Landing (não é filosofia/direção criativa), nem Produto autenticado (não exige login para ser vista) — só o portão entre os dois. Ver auditoria, item 1.

## 2. O primeiro momento do produto

Duas respostas honestas, porque a estrutura real não decide isso sozinha:

- **Por estrutura de papel** (ADR-009: áreas por papel são segmentos reais): o Produto começa em `/paciente/*` — a primeira tela genuinamente exclusiva de quem já está autenticado com papel "paciente".
- **Por comportamento real**: o wizard de `sua-historia/(wizard)/*` já exige autenticação e papel "paciente" (`docs/CODEBASE_MAP.md`) — funcionalmente, já é Produto, mesmo vivendo na pasta `(public)`. A pessoa "entra no Produto" no instante em que a sessão é validada, não no instante em que a URL muda para `/paciente`.

Este documento adota a segunda leitura (comportamento real) como a que importa para a máquina de estados abaixo, e registra a primeira como uma divergência estrutural (auditoria, item 1).

## 3-4. Estados reais e suas transições

Não são os estados sugeridos no pedido (Visitante → Interessado → Início da Jornada → Cadastro → Conta criada → Primeiro acesso → Primeira História → Paciente ativo) — a investigação real encontrou uma sequência diferente, em três camadas, porque a criação de conta não pertence à mesma linha do tempo da jornada da pessoa.

### Camada 0 — Fora da jornada digital da pessoa (responsabilidade: Produto/Admin)

| Estado | S0 → S1 | S1 → S2 |
|---|---|---|
| **De → Para** | Pessoa identificada pela equipe → Conta criada | Conta criada → Credencial entregue |
| **Objetivo** | Formalizar, no sistema, uma pessoa que a equipe já decidiu atender | Colocar a credencial em posse da pessoa |
| **Gatilho** | Decisão humana da equipe Aliviar, por canal não documentado nesta arquitetura | Conclusão do cadastro administrativo |
| **Informação produzida** | Usuário Supabase Auth + `profiles` + `patient_profiles` + papel "paciente" (`user_roles`) | Senha temporária, gerada pelo sistema, exibida uma única vez |
| **Informação consumida** | Dados básicos de identificação, obtidos fora deste fluxo | Nenhuma nova |
| **Decisão humana** | Administrador decide criar a conta | Administrador decide o canal de entrega |
| **Decisão automática** | Nenhuma — toda a etapa é acionada por ação humana explícita (`createPatientAction` equivalente) | Nenhuma |
| **Critério de conclusão** | Registro completo nas três tabelas, papel associado | Credencial nas mãos da pessoa — **não verificável pelo sistema** (ver auditoria, item 3) |

### Camada 1 — Jornada digital da pessoa, pré-autenticada (responsabilidade: Landing → portão)

| Estado | S3 → S4 | S4 → S5 |
|---|---|---|
| **De → Para** | Visitante na Landing → Chegada em `sua-historia` (raiz pública) | `sua-historia` (raiz) → Login |
| **Objetivo** | Converter atenção em intenção de começar | Autenticar quem já tem credencial |
| **Gatilho** | Clique em "Contar minha história" (Hero ou CTA Final) | Clique em "Começar" (só existe se a pessoa já tem conta) |
| **Informação produzida** | Nenhuma (navegação) | Nenhuma ainda |
| **Informação consumida** | Nenhuma | Credencial (e-mail/senha) |
| **Decisão humana** | Da pessoa: continuar ou não | Da pessoa: entrar ou desistir |
| **Decisão automática** | Nenhuma | Validação de credencial pelo Supabase Auth |
| **Critério de conclusão** | Página `sua-historia` carregada | Sessão autenticada válida |

**Ramo sem transição documentada** (a partir de S4): se a pessoa **não** tem conta, `sua-historia` (raiz) só explica que é preciso "entrar em contato com a nossa equipe" — sem link, número ou formulário funcional específico para isso na própria tela. Não há uma transição S4→S1 (visitante genuíno → identificado pela equipe) documentada em lugar nenhum. Ver auditoria, itens 3 e 4.

### Camada 2 — Autenticado, ainda sem história (responsabilidade: Produto)

| Estado | S5 → S6 | S6 → S7 | S7 → S8/S9 |
|---|---|---|---|
| **De → Para** | Login → Redirecionamento por papel | Redirecionamento → Home do paciente | Home → Wizard (se `no_story`) → Rascunho |
| **Objetivo** | Levar a pessoa à sua área correta | Mostrar o estado real da relação dela com o produto | Iniciar a coleta da história |
| **Gatilho** | Autenticação bem-sucedida | Carregamento de `/paciente` | Ação da pessoa: "Contar minha história" a partir da Home |
| **Informação produzida** | Nenhuma | Estado derivado (`no_story`/`draft`/`submitted_without_case`/`case_available`) | `PatientStory` (`status: rascunho`), primeiro artefato persistente de conteúdo |
| **Informação consumida** | Papel do usuário (`user_roles`) | Histórico de `PatientStory` + `patient_case_overview` da pessoa | Nenhuma externa |
| **Decisão humana** | Nenhuma | Nenhuma | Da pessoa: começar a escrever |
| **Decisão automática** | `role-home` decide o destino por papel | `derivePatientHomeState` calcula o estado | Autosave a cada 600ms, sem decisão da pessoa |
| **Critério de conclusão** | Chegada em `/paciente` | Home renderizada com o estado correto | Primeira escrita salva no servidor |

### Camada 3 — Produto pós-história, pré-ACE (responsabilidade: Produto)

| Estado | S9 → S10 | S10 → S11 → S12 |
|---|---|---|
| **De → Para** | Rascunho → História enviada | Enviada → Aguardando Caso → Caso criado |
| **Objetivo** | Marcar a história como pronta para a equipe | Transformar a história num Caso rastreável |
| **Gatilho** | Ação da pessoa: "Enviar minha história" | Ação humana: Administrador aciona `createCaseAction` |
| **Informação produzida** | `PatientStory.status: enviada`, `submittedAt` | Registro em `cases` (`status: NEW`) |
| **Informação consumida** | Rascunho completo | `PatientStory` com `status: enviada` (pré-requisito verificado) |
| **Decisão humana** | Da pessoa: confirmar o envio | Do Administrador: decidir abrir o Caso, e quando |
| **Decisão automática** | Nenhuma | Nenhuma — **não existe automação que abra um Caso ao enviar a história** |
| **Critério de conclusão** | Status `enviada` persistido | Caso existente vinculado à história |

### Camada 4 — ACE (responsabilidade: Método, `src/modules/ace`/`concierge`)

| Estado | S12 → S13 |
|---|---|
| **De → Para** | Caso criado (`NEW`) → Pipeline iniciado (`READY_FOR_CURATION`/`IN_CURATION`) |
| **Objetivo** | Iniciar a análise automatizada |
| **Gatilho** | Ação humana (equipe move o Caso para processamento) |
| **Informação produzida** | `Narrative` (P001) — construída deterministicamente da história, sem modelo de linguagem |
| **Informação consumida** | Texto da `PatientStory` já enviada |
| **Decisão humana** | Da equipe: iniciar a curadoria |
| **Decisão automática** | A partir daqui, P001→P008 rodam sem intervenção (`orchestrator.ts`) |
| **Critério de conclusão** | Primeiro artefato do ACE (`Narrative`) persistido |

---

## 5. Onde cada responsabilidade termina e começa

- **Landing termina**: no clique do CTA — conceitualmente, não fisicamente (ver seção 1). Nenhuma seção da Landing sabe se a pessoa que clicou já tem conta.
- **O portão** (`sua-historia`, raiz pública) **começa e termina** sem pertencer, com autoridade documental própria, nem à Landing nem ao Produto — só existe hoje na prosa de `PRODUCT_ARCHITECTURE.md` §4.2, passo 1.
- **Produto começa**: na sessão autenticada (S5→S6), independente de a URL ainda estar sob `(public)` (o wizard) ou já sob `/paciente`.
- **Artefatos persistentes começam em dois momentos distintos, não um**: (a) identidade/papel — na criação da conta pelo Administrador (S0→S1), antes de qualquer jornada digital da pessoa; (b) conteúdo — no primeiro autosave do rascunho (S8→S9).
- **Protocolos do ACE começam**: só em S12→S13, quando o Caso (já criado por ação humana separada) é movido para processamento — nunca automaticamente a partir do envio da história, nunca automaticamente a partir da criação do Caso.

---

## 6. Máquina de estados completa

```
[Camada 0 — fora da jornada digital, responsabilidade Admin/Produto]
S0 Pessoa identificada pela equipe (canal não documentado)
  │ (decisão humana: Administrador)
  ▼
S1 Conta criada (profiles + patient_profiles + papel "paciente")
  │ (decisão humana: canal de entrega, não documentado)
  ▼
S2 Credencial entregue (fora do sistema — não verificável digitalmente)

[Camada 1 — jornada digital pré-autenticada, responsabilidade Landing → portão]
S3 Visitante navega a Landing
  │ (clique em CTA)
  ▼
S4 Chegada em `sua-historia` (raiz pública, "o portão")
  ├──(sem credencial)──▶ [SEM TRANSIÇÃO DOCUMENTADA — ver auditoria]
  └──(com credencial, S2 já ocorreu)──▶
  ▼
S5 Login

[Camada 2 — autenticado, responsabilidade Produto]
S5 ──(autenticação válida)──▶ S6 Redirecionamento por papel
S6 ──▶ S7 Home do paciente (no_story | draft | submitted_without_case | case_available)
S7 ──(se no_story, ação da pessoa)──▶ S8 Wizard `sua-historia` (autenticado)
S8 ──(primeira escrita)──▶ S9 Rascunho (`patient_stories`, status rascunho)
S9 ──(ação da pessoa: enviar)──▶ S10 História enviada (status enviada)

[Camada 3 — pré-ACE, responsabilidade Produto]
S10 ──▶ S11 Aguardando abertura de Caso (sem prazo, sem automação)
S11 ──(ação humana: Administrador)──▶ S12 Caso criado (status NEW)

[Camada 4 — ACE, responsabilidade Método]
S12 ──(ação humana: iniciar curadoria)──▶ S13 Pipeline iniciado (Narrative/P001 persistida)
```

Nenhum ramo de retorno é automático em nenhum ponto desta máquina — cada avanço depende de uma ação explícita (da pessoa ou da equipe), nunca de um temporizador ou evento implícito.

---

## 7. Auditoria

Só registro — nenhuma correção proposta.

1. **Zona cinzenta confirmada — o "portão" (`sua-historia`, raiz pública)**: fisicamente dentro da pasta `(public)` (mesma árvore da Landing), funcionalmente nem Landing (não é uma das 12 seções, não segue nenhum dos seis documentos canônicos da Landing) nem Produto autenticado (não exige login para ser vista). Nenhum documento reivindica autoridade explícita sobre esta tela especificamente — ela é mencionada de passagem em `PRODUCT_ARCHITECTURE.md` §4.2, passo 1, mas não tem seção própria em nenhum lugar.

2. **Zona cinzenta confirmada — o wizard vive fisicamente na Landing, funcionalmente no Produto**: `sua-historia/(wizard)/*` está na mesma pasta `(public)` da Landing, mas exige autenticação e papel "paciente" — a fronteira de pasta (ADR-009 trata áreas por papel como segmentos reais, exceto aqui) não coincide com a fronteira de responsabilidade real.

3. **Decisão sem dono confirmada — canal de identificação de um visitante genuíno — investigação completa (LAND DO PACIENTE, Fase 11, `docs/DECISIONS.md` sem ADR — bloqueio registrado, nenhuma decisão tomada)**: não existe, em nenhum documento lido, a especificação de como uma pessoa que nunca teve contato com a Aliviar consegue, de fato, chegar a S0 (ser identificada pela equipe). A tela de `sua-historia` (raiz) diz "entre em contato com a nossa equipe" sem apontar um canal funcional. Até a Fase 10, o único candidato natural (o botão de WhatsApp da Landing) já estava registrado como um link placeholder não funcional — na Fase 10 (Decisão 1) esse botão foi removido por não existir destino real para conectar.
   - **Busca exaustiva realizada na Fase 11** (código, docs, `.env.example`, schemas, migrations, server actions, testes, config de deploy) por qualquer canal ou infraestrutura já existente: nenhum provedor de e-mail/SMS/mensageria (nenhuma dependência de `resend`/`sendgrid`/`nodemailer`/`postmark`/`mailgun`/`twilio`/WhatsApp Business API em `package.json`); nenhuma variável de ambiente de contato/notificação (`docs/ENVIRONMENT_VARIABLES.md` lista só 6 variáveis: Supabase URL/anon/service-role, `CLAUDE_API_KEY`, `ANTHROPIC_MODEL`, `NODE_ENV`); nenhuma tabela de lead/convite/solicitação de contato em nenhuma das 28 migrations (`supabase/migrations/`); nenhum `mailto:` em `src/`; `docs/CREDENTIALS.md` lista só duas credenciais (contas de teste locais, `CLAUDE_API_KEY`) — nenhuma de contato. O fluxo oficial de `PRODUCT_ARCHITECTURE.md` §21 começa em "Administrador → cria o paciente" — a etapa anterior (como o Administrador fica sabendo que deve criar aquela pessoa) nunca foi modelada em nenhum documento.
   - **Classificação formal**: **Cenário C — nenhum canal real existe.** Nem infraestrutura técnica (sem provedor de notificação, sem persistência de solicitação), nem processo operacional (sem responsável nomeado, sem SLA, sem política de dados/retenção/spam) sustentam uma implementação real. Por instrução explícita desta fase, nenhum código foi escrito — nenhum formulário, nenhum `mailto:`, nenhum canal inventado.
   - **Decisões que precisam de autoridade de Produto/Operação antes de qualquer implementação futura**: quem recebe a solicitação; por qual canal a equipe a recebe; SLA de resposta; horário de atendimento; dados obrigatórios a coletar; quem cria a conta a partir disso; retenção de dados; base legal/consentimento; tratamento de spam/abuso. Nenhuma foi definida em nenhum documento deste repositório.

4. **Decisão sem dono confirmada — o canal de entrega da credencial (S1→S2)**: `PRODUCT_ARCHITECTURE.md` §21 diz explicitamente "por canal seguro, fora do sistema", sem nomear qual canal, quem é responsável por garantir a entrega, ou o que fazer se a credencial se perder antes de chegar à pessoa. Nenhum documento lido nesta auditoria assume essa responsabilidade.

5. **Etapa sem autoridade documental confirmada — a Home do paciente como primeira resposta real do Produto**: `docs/PATIENT_EXPERIENCE_BLUEPRINT.md` já descreve os quatro estados da Home (Etapa 4), mas nenhum documento a trata explicitamente como "o primeiro momento do Produto" — ela é descrita como parte da jornada geral, sem ser nomeada como fronteira.

6. **Nenhuma responsabilidade duplicada foi encontrada.** Onde mais de um documento toca o mesmo ponto (ex.: `PRODUCT_ARCHITECTURE.md` §21 e o código de `admin/pacientes/novo` sobre criação de conta), as descrições são consistentes entre si, não conflitantes — um resultado válido de auditoria, não uma omissão.

7. **Nenhuma decisão automática indevida foi encontrada** — em nenhum ponto desta máquina de estados o sistema avança uma pessoa de um estado para o outro sem uma ação humana explícita (da pessoa ou da equipe), o que é consistente com o princípio de não-paternalismo já estabelecido (`docs/PRODUCT_PRINCIPLES.md`, princípio 14) e com o achado equivalente já registrado para o restante da jornada em `docs/PATIENT_EXPERIENCE_BLUEPRINT.md`.

---

**Como usar este documento**: é a referência para qualquer pergunta sobre "de quem é essa decisão" na fronteira Landing↔Produto — antes de propor uma mudança em `sua-historia` (raiz ou wizard), no fluxo de criação de conta, ou em qualquer tela entre o clique na Landing e a primeira tela de `/paciente`, este documento diz qual camada e qual responsável já existe hoje, e onde a autoridade documental ainda não existe.
