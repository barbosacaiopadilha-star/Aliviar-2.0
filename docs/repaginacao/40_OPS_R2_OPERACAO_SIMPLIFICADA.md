# 40 · OPS-R2 — operação simplificada da Aliviar 2.0

| Campo | Valor |
|---|---|
| **Autor** | Agente 02 — Arquiteto |
| **Data** | 2026-08-12 |
| **Base** | HEAD = `origin/main` = `732d063` · ledger **121/121** · prod `dpl_FA6gLoNSRQCps2yXftATz9gNxXTi` |
| **Natureza** | arquitetura operacional. **Zero código, zero migration, zero escrita** |
| **Regularização** | nasceu como `37_…`, número já ocupado por [37 · Bloco 11 — fechamento](37_BLOCO_11_FECHAMENTO.md). Renumerado para **40** pelo `03 ENGENHEIRO` (OPS-R3 · Corte A0), com o conteúdo preservado e as correções de fato registradas em §12 |

---

## 1 · As sete premissas — medidas, não presumidas

| # | Premissa da OPS-R1 | Veredito |
|---|---|---|
| **1** | *"Minha História não tem consumidor no núcleo decisório"* | ⚠️ **PARCIALMENTE FALSA** — tem **um**: [`cases/repository.ts:156`](../../src/modules/cases/repository.ts:156) `getSourceStoryText`, consumido em [`[etapa]/page.tsx:82`](../../src/app/portal-curador/casos/[id]/[etapa]/page.tsx:82) **somente quando `stepId === "ACOLHER"`** |
| **2** | *"algum loader transforma a história em `case_needs`"* | ❌ **FALSO — FATO MEDIDO.** Nenhum. `case_needs` nasce do **Protocolo da Pessoa**, e a migration diz: *"quem a traduz em importância continua sendo o Curador"* |
| **3** | *"o que das sete etapas é usado fora do wizard"* | **Exatamente dois campos:** `historia` e `motivo`. **`informacoesImportantes` e `preferencias` não têm leitor algum** |
| **4** | writers afetados pela retirada | `patient_stories` · `patient_story_versions` · `story_attachments` · `cases.source_story_id` · `contrato-de-estado` (status) · `cos/repository:50` (**só `status`**) |
| **5** | *"retirada de profissional impede novas indicações"* | ✅ **DETERMINADO — corrigido em §12.1.** A elegibilidade da Mesa **filtra por `status`**, e por mais três predicados, além da blocklist NC-22 |
| **6** | obrigações que impedem desativação | **Nenhuma guarda existe.** É um toggle binário sem motivo, sem trilha, sem prévia de impacto — **A-04, A-05 e A-12 confirmados** |
| **7** | contratos que dependem de `CLOSED`/`CANCELLED`/`DELIVERED` | `DELIVERED` é **pré-condição da decisão** e portão do `loadPatientCuradoria`; `CLOSED`/`CANCELLED` alimentam `fatos-do-caso`. **A-03 confirmado: terminais sem rito** |

> ### 🔴 O achado que reordena a missão inteira
>
> **A simetria que o adendo pede já existe, construída e certificada.** Não é hipótese a validar — é `CatalogoOpcao.satisfiedBy`:
>
> > *"values do lado profissional que satisfazem esta opção da pessoa… **Comparação por identidade, nunca por rótulo**."*
>
> E o Motor Relacional (ADR-065) já cruza *"grau da PESSOA × estado derivado do PROFISSIONAL, por identidade de opção — nunca por rótulo"*.
>
> **O adendo não pede uma capacidade nova. Pede a superfície que falta a uma capacidade que existe.** É a quinta vez que este projeto encontra esse padrão.

## 2 · SIMETRIA PACIENTE × PROFISSIONAL

### 2.1 · O que já está pronto — e o vocabulário é o do adendo

| Requisito do adendo | Onde já vive |
|---|---|
| identificador canônico | `case_needs.subcriterion_code` + `catalog_version` |
| respostas permitidas | `case_needs.options text[]` — **códigos canônicos, nunca texto** |
| **intensidade** | **`NEED_DEGREES`** = `ESSENCIAL` · `PESA_MUITO` · `DESEJAVEL` · `SEM_PREFERENCIA` — **os quatro do adendo, já implementados** |
| atributo do profissional | `practice_evidence` (via `practice_protocol_drafts`) |
| **par simétrico** | **`CatalogoOpcao.satisfiedBy`** |
| fonte tipada | `case_needs.origin` = `DIRETO` · `TRADUCAO` · `DECLARACAO_CLINICA` |
| evidência exigida | `practice_evidence`, sempre `nao_verificado` na submissão (**P20**) |
| estados do cruzamento | os quatro do Motor + `AGUARDA_JUIZO_DO_CURADOR` |
| autoridade de registro × confirmação | `declared_by` × `acknowledgment` = `PENDENTE`·`RECONHECIDA`·`CORRIGIDA`·`RECUSADA` |
| correção | `case_needs.correction`, obrigatória se `CORRIGIDA` |
| escrita livre já eliminada | **`guided_text` só em P14** — *"o domínio recusa nos demais"* |
| contexto humano não pontuado | `cruzamento: "humano"` → **fora da escala de resultados** |
| proteção de escala | *"GRAU NUNCA É IMPORTÂNCIA… recusa em runtime qualquer valor fora de `NEED_DEGREES`"* |

### 2.2 · As três camadas do adendo, mapeadas ao que existe

| Camada | Onde vive | Autoridade | Elegibilidade? |
|---|---|---|---|
| **A · Elegibilidade técnica** | **filtros obrigatórios** (`mandatory-filters`, `priority_profile_filters`) | **Curador**, com motivo nas palavras dela | ✅ **elimina** |
| **B · Necessidades cruzáveis** | **`case_needs` × `practice_evidence`** por `satisfiedBy` | registra: Curador ou ela · **confirma: só ela** | ❌ **nunca elimina — explica** |
| **C · Contexto humano** | `flexibility` (≤280) · `guided_text` (P14, ≤500) · `proposed_reading` · `correction` | acolhimento propõe · **ela reconhece** | ❌ **nunca pontua** |

> **A separação A/B/C que o adendo pede é a fronteira que o Método já traçou.** O que falta é dizê-la na tela.

### 2.3 · O que **falta** — e é só isto

| Lacuna | Natureza |
|---|---|
| **L-1** | `ProtocoloPessoaPanel` vive **só no `portal-curador`**. **A paciente não tem superfície para responder o próprio protocolo** |
| **L-2** | **matriz de cobertura ausente**: nada prova que toda exigência dela tem atributo correspondente, nem que todo atributo tem fonte |
| **L-3** | as cinco saídas do adendo (`não sei`, `não se aplica`, `nenhuma destas`, `preciso conversar sobre isso`, `outro não contemplado`) **não estão garantidas por teste** |
| **L-4** | `GAP-B3-COPY-ID` (A-13) — comparação por **nome** onde deveria ser identificador |

## 3 · Decisão sobre "Minha História" — **Modelo C, e B não é necessário**

**Recomendo C, sem transição por B.** Motivo: B ("contexto mínimo") construiria um terceiro formulário para depois removê-lo — e o destino de C **já existe** (`case_needs` + Protocolo da Pessoa). B seria trabalho descartável.

| Passo do modelo C | Onde vive hoje |
|---|---|
| 1 contato | ❌ **não existe — é o Corte A** |
| 2 acolhimento humano | ✅ etapa `ACOLHER` |
| 3 documentos essenciais | ✅ Central de Documentos |
| 4 síntese estruturada | ✅ `case_needs` com `origin = TRADUCAO` + `proposed_reading` |
| 5 "O que importa para mim" | ✅ Protocolo da Pessoa — ⚠️ **sem superfície dela (L-1)** |
| 6 correção e confirmação | ✅ `acknowledgment` |
| 7 Perfil reconhecido | ✅ `acknowledge_priority_profile` |
| 8 Curadoria | ✅ certificada |

### 3.1 · Campos livres que permanecem — e por quê

| Campo | Decisão |
|---|---|
| `flexibility` (≤280) | **MANTER** — *"se não houver, serve?"* não é catalogável sem falsear |
| `guided_text` **só P14** | **MANTER** — restrição pessoal é o único lugar onde catalogar seria invasivo |
| `proposed_reading` / `correction` | **MANTER** — são a discordância; removê-los removeria o direito de discordar |
| `motivo` (2000) · `historia` (5000) · `informacoesImportantes` (2000) | 🔴 **ELIMINAR do fluxo obrigatório** |

### 3.2 · Matriz de cobertura dos campos atuais

| Campo | Leitor hoje | Decisão | Destino |
|---|---|---|---|
| `paraQuem` (enum) | nenhum | **converter** | opção canônica do protocolo |
| `motivo` (livre) | `getSourceStoryText` → ACOLHER | **mover para acolhimento** | síntese tipada em `case_needs` |
| `historia` (livre) | idem | **mover para acolhimento** | idem |
| `informacoesImportantes` | **nenhum** | **eliminar** | ⚠️ nada se perde: **nunca foi lido** |
| `preferencias` | **nenhum** | **converter** | `case_needs.options` |
| anexos | Central de Documentos | **manter documental** | inalterado |
| `status` da história | `contrato-de-estado`, `cos/repository:50` | **manter** até o Corte C migrar o gatilho | — |

**Prova de que nada indispensável some:** dos sete passos, **dois campos** têm leitor e **ambos** vão para o acolhimento com fonte tipada; **dois** não têm leitor nenhum; os demais viram opção canônica ou permanecem documentais.

### 3.3 · Os 54 registros históricos

⛔ **`patient_stories` não é apagada, e seus writers não saem antes da migração provada.** As rotas antigas ganham **redirect**, nunca 404. Cases em andamento continuam lendo `source_story_id` — o campo permanece. **Sem perda histórica, e sem reescrita de fato congelado.**

## 4 · CORTE A — porta de entrada (A-01, P0)

**Fluxo único:** Landing → *Solicitar atendimento* → `crm_contacts` → Atendimento → conta → convite → primeiro acesso → jornada.

| | |
|---|---|
| **CTA** | `Solicitar atendimento` — **um só na Landing**; ⛔ o `Falar com a Aliviar` continua **fora** da Landing (regra do Bloco 7) |
| **rota** | `/solicitar-atendimento`, pública |
| **dados mínimos** | nome · e-mail **ou** telefone · *"é para você ou para outra pessoa?"* · consentimento |
| ⛔ **proibido** | **qualquer conteúdo clínico na captação pública** — sem diagnóstico, sintoma, condição, especialidade ou documento |
| **idempotência** | mesmo e-mail/telefone em 24h → **mesmo contato**, sem duplicar |
| **abuso** | rate-limit por IP, honeypot, **sem CAPTCHA** |
| **estado** | `NOVO → EM_ATENDIMENTO → CONVERTIDO | ENCERRADO` |
| **já tem conta** | reconhece e **envia para o login**, sem revelar que a conta existe |
| **conversão** | Atendimento cria a conta e o Case, e **associa** o contato — nunca cadastro público automático |
| **falha** | a mensagem preserva o que foi digitado e oferece retomada |

**Copy final:** título `Fale com a Aliviar` · corpo `Conte só o essencial para a gente te procurar. Nada sobre saúde nesta página — isso a gente conversa depois, com uma pessoa.` · botão `Enviar pedido` · confirmação `Recebemos. Uma pessoa da Aliviar vai te procurar.` — ⛔ **sem prazo**.

## 5 · CORTE B — ciclo do profissional (A-04, A-05, A-12, P1)

**Quatro estados, nunca exclusão física:** `ATIVO` → `INDISPONIVEL_TEMPORARIO` → `RETIRADO_DA_REDE` → `REATIVADO`.

**Toda transição exige:** motivo (**lista canônica**, não texto livre) · autoria · data · trilha em `audit_logs` · **prévia de impacto antes de confirmar**.

| Situação | Regra |
|---|---|
| Connection ativa | **bloqueia** a retirada · exige rito de substituição |
| em Curadoria não entregue | **permite com aviso** + plano de substituição |
| em relatório emitido | **sempre preservado** — ⛔ histórico não muda |
| novas indicações | **impedidas** a partir de `RETIRADO_DA_REDE` |

**Alcançável na lista e no detalhe** (A-12), com rótulo operacional: `Retirar da rede ativa`, nunca "excluir".

## 6 · Cortes C–H — arquitetura e ordem

| | Corte | Decisão |
|---|---|---|
| **C** | História → acolhimento | Modelo C · **superfície do Protocolo para a paciente (L-1)** · matriz de cobertura (L-2) · as cinco saídas (L-3) · redirects |
| **D** | Case: errata, extensão, novo episódio | **errata** = nova versão do relatório, original imutável · **retorno** = Case relacionado · **novo episódio** = Case novo · **cancelamento indevido** = Case relacionado com motivo · ⛔ **nunca reabertura retroativa** |
| **E** | LGPD e sessões | fila de pedidos com responsável e registro de decisão · revogação de sessão **pela API do Supabase** (A-08) · ⛔ **nenhum prazo legal declarado sem validação jurídica** |
| **F** | redundâncias e duplicidades | tabela §7 · detecção → alerta → associação; **merge exige contrato próprio** |
| **G** | simulação integral | dez Casos simultâneos |
| **H** | limpeza sintética | **RESET-S5**, separado |

## 7 · Redundâncias — origem canônica por informação

| Redundância | Decisão | Origem canônica |
|---|---|---|
| História × acolhimento | **fundir** | acolhimento |
| História × documentos | **remover** da História | Central de Documentos |
| preferências × Perfil | **tornar derivado** | `case_needs` |
| dois "Falar com a Aliviar" (A-11) | **fundir** | `ConciergeLink` |
| Jornada × Fila | **manter** — públicos distintos | fatos, projetados dos dois lados |
| Perfil × Mesa | **manter para confirmação** | Perfil |
| estado × eventos | **manter para auditoria** | eventos |

## 8 · Testes falseáveis

| # | Cai quando |
|---|---|
| **T-A-1** | o CTA público sai da Landing |
| **T-A-2** | a solicitação não cria `crm_contacts` |
| **T-A-3** | ⛔ um campo clínico entra no formulário público |
| **T-A-4** | reenvio em 24h cria contato duplicado |
| **T-B-1** | retirada sem motivo é aceita |
| **T-B-2** | profissional com Connection ativa sai da elegibilidade sem rito |
| **T-B-3** | um relatório antigo muda após a retirada |
| **T-B-4** | a ação existe só no detalhe |
| **T-S-1** | **uma exigência da paciente não tem `satisfiedBy` correspondente** |
| **T-S-2** | **um atributo do profissional não tem fonte em `practice_evidence`** |
| **T-S-3** | `informação insuficiente` é tratada como compatível |
| **T-S-4** | uma preferência (camada B) vira bloqueio de elegibilidade |
| **T-S-5** | **texto livre entra no cruzamento** |
| **T-S-6** | uma pergunta não oferece as cinco saídas |
| **T-S-7** | **um identificador existe só de um lado do Catálogo** |
| **T-S-8** | **renomear uma `label` quebra o cruzamento** — prova de que é por identidade |
| **T-C-1** | substituir o wizard perde prioridade já confirmada |
| **T-E-1** | sessão revogada continua autorizando |

## 9 · Priorização

| Corte | Valor | Risco | Esforço | Migration | Reversível | Ordem |
|---|---|---|---|---|---|---|
| **A** | **altíssimo** — hoje ninguém entra | baixo | médio | **sim** (estado do contato) | sim | **1** |
| **B** | alto | **médio-alto** | médio | **sim** (estados + motivo + trilha) | sim | **2** |
| C | alto | **alto** — toca o Método | grande | sim | parcial | 3 |
| D | médio | alto | médio | sim | sim | 4 |
| E | médio | **jurídico** | médio | sim | sim | 5 |
| F | médio | médio | médio | talvez | não (merge) | 6 |
| G | verificação | baixo | médio | não | — | 7 |
| H | interno | baixo | baixo | não | **não** | 8 |

## 10 · Decisões pendentes do responsável

| # | Pergunta |
|---|---|
| **DP-1** | Eliminar os três campos livres de "Minha História" **muda o Método**? → **Guardião da Curadoria 2.0** antes do Corte C |
| **DP-2** | O Protocolo da Pessoa pode ser respondido **por ela**, sozinha, ou só no acolhimento? |
| **DP-3** | Prazo interno dos pedidos LGPD — **exige validação jurídica** |
| **DP-4** | Retirada de profissional com Curadoria entregue e sem decisão: bloqueia ou avisa? |

## 11 · Zero mutação

Somente leitura de repositório. **Nenhuma query de escrita, nenhum formulário, nenhum commit, nenhum deploy.** Ledger **121**. Árvore com os dois `??` pré-existentes, intocados. Este documento **não foi commitado**.

---

# OPS-R2 ARQUITETURA CONCLUÍDA — MODELO OPERACIONAL SIMPLIFICADO DEFINIDO, CONTRATOS DOS CORTES A E B FECHADOS E DEMAIS CORTES ORDENADOS, SEM ALTERAR PRODUÇÃO

**A hipótese do adendo estava certa, e chegou depois da obra:** a simetria por identificador canônico, os quatro graus, a fonte tipada, o reconhecimento com direito a correção e a recusa de texto livre no cruzamento **já existem** — `satisfiedBy`, `NEED_DEGREES`, `origin`, `acknowledgment`, `guided_text` só em P14.

**O que falta é a porta:** a paciente não tem superfície para responder o próprio protocolo, e ninguém provou que os dois lados do Catálogo se cobrem.

---

## 12 · Regularização OPS-R3 · Corte A0 — correções de fato

Registrado pelo `03 ENGENHEIRO`. **O conteúdo do Arquiteto foi preservado**; o que
segue corrige fatos medidos e fecha o contrato do Corte A. Nenhum outro documento
numerado foi sobrescrito: 37, 38 e 39 já existiam e permanecem intactos.

### 12.1 · A elegibilidade **filtra por status** — a premissa 5 estava errada

A premissa 5 afirmava *"não localizei filtro por `status` em nenhuma consulta de
elegibilidade da Mesa"*. **É falso, e a linha existe.** Medido em
[`mesa-cruzamento.ts:211-215`](../../src/modules/curadoria/mesa-cruzamento.ts:211):

```ts
.eq("status", "ativo")
.eq("is_demo", false)
.eq("is_test_fixture", isCertification)
.eq("publication_status", "publicado")
```

São **quatro filtros**, mais a **blocklist NC-22** aplicada logo em seguida por
[`listCriticalDivergenceBlocklist`](../../src/modules/curadoria/rede-policy.ts) —
a regra que existe porque a certificação dinâmica encontrou um profissional
publicado com divergência crítica aparecendo na Mesa e sumindo da Rede aprovada.
A mesma composição se repete em
[`repository.ts:220-223`](../../src/modules/curadoria/repository.ts:220).

**Consequência para o Corte B:** *"impedir novas indicações"* **já funciona** por
`status`. O que falta ao Corte B é o **rito** — motivo canônico, autoria, trilha e
prévia de impacto —, não o efeito. ⛔ Este corte não altera nada disso.

### 12.2 · A árvore FOI alterada pela criação documental

A §11 afirma *"árvore com os dois `??` pré-existentes, intocados"*. A criação deste
documento acrescentou um terceiro `??`. O trabalho de arquitetura permaneceu sem
escrita em banco, sem migration e sem deploy — mas **a árvore mudou**, e dizer o
contrário tornaria o pré-flight da missão seguinte falso. Ele foi renumerado e
commitado no Corte A0.

`AGENTS.md` e `foundation/FOUNDATION_VERIFICATION.md` seguem **intocados**.

### 12.3 · "Minha História" — o que fica confirmado

- **tem** consumidor, e é **um só**, restrito a `stepId === "ACOLHER"`;
- os campos lidos fora do wizard são **exatamente dois**: `historia` e `motivo`;
- **`informacoesImportantes` e `preferencias` não têm leitor encontrado**;
- ⛔ **não existe transformação automática História → `case_needs`**. `case_needs`
  nasce do Protocolo da Pessoa, e quem traduz importância continua sendo o Curador.

⛔ Este corte **não toca** rotas, writers, tabelas ou histórico de "Minha História".

### 12.4 · A simetria já existe — nenhum motor novo

`CatalogoOpcao.satisfiedBy`, comparação por identificador, `NEED_DEGREES`,
`origin`, `acknowledgment` e `AGUARDA_JUIZO_DO_CURADOR` **estão construídos**.
Qualquer corte futuro **reutiliza**; ⛔ nenhum segundo motor é autorizado.

### 12.5 · Corte C permanece bloqueado

Depende do **Guardião da CURADORIA 2.0** (DP-1). ⛔ Não iniciar.

**DP-1, DP-2, DP-3 e DP-4 permanecem abertas**, sem reclassificação.

### 12.6 · Contrato final autocontido do Corte A

O que o Corte A **é**, sem depender de outro documento:

| | |
|---|---|
| **rota** | `/solicitar-atendimento`, pública |
| **CTA canônico** | `Solicitar atendimento` — header público, hero da Landing, `/sua-historia` e `/login`, todos para a **mesma rota e o mesmo writer** |
| **título** | `Fale com a Aliviar` |
| **orientação** | `Conte só o essencial para a gente te procurar. Nada sobre saúde nesta página — isso a gente conversa depois, com uma pessoa.` |
| **campos** | conjunto **fechado**: nome · e-mail **ou** telefone · *"É para você ou para outra pessoa?"* · consentimento **não pré-marcado** · honeypot invisível |
| ⛔ **proibido** | diagnóstico · sintoma · condição · especialidade · exame · documento · anexo · história · texto clínico · **qualquer campo narrativo livre** |
| **destino** | `crm_contacts`, estado inicial canônico, **sem responsável**, origem pública identificável, consentimento com versão e data |
| **idempotência** | mesmo contato normalizado em 24 h → **um só**, com resposta pública indistinguível |
| **antiabuso** | honeypot + rate-limit compatível com serverless. ⛔ sem CAPTCHA, sem IP bruto exposto, sem segredo no cliente |
| **sucesso** | `Recebemos. Uma pessoa da Aliviar vai procurar você.` — ⛔ **sem prazo** |
| **erro** | preserva o digitado, `role="alert"`, permite nova tentativa **sem duplicar** |
| **conversão** | ⛔ **nenhuma conta e nenhum Case nascem da solicitação pública**. Quem converte é o Atendimento, por ação interna autorizada |

**Divergência de copy, declarada:** a §4 registra a confirmação como *"vai te
procurar"*; o contrato de execução da OPS-R3 fixa **"vai procurar você"**. Vale a
segunda, por ser a instrução mais recente — e fica dito, em vez de silenciosamente
substituído.
