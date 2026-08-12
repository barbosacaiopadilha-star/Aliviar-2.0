# 21 · Decisões necessárias — DT-01

**Onze** — oito da repaginação, duas do [adendo dos dois encontros](23_ADENDO_DOIS_ENCONTROS.md) e a [D-11](24_D11_ORDEM_DO_PRIMEIRO_ENCONTRO.md). Nenhuma foi resolvida silenciosamente. Cada uma diz **o que trava** e
**o que muda conforme a resposta**.

---

## D-1 · A referência da Landing substitui a página, ou é a espinha dela?

**Trava:** Bloco 7.
A referência mostra sete blocos; a landing viva tem oito, e **quatro não
aparecem na imagem** (Problema, Respiro, FAQ, Convite).
**Recomendo:** espinha visual — os quatro permanecem.
**Detalhe:** [plano da Landing](../PLANO_ATUALIZACAO_LANDING_2026_08.md) §B.1.

## D-2 · A paciente **decide** ou **sinaliza preferência**?

**Trava:** o bloco da decisão — hoje sem número, de propósito.
**O fato:** dois cliques, `connection_records = 0`, nenhuma mensagem (B2-1). E a
jornada diz que a etapa é **"Conversa"**, com o Curador apresentando as opções
pessoalmente; a etapa 4 dele chama-se **"Registrar a decisão do paciente"**.

| | Desenho | Custo |
|---|---|---|
| **A** | sinaliza preferência; o Curador registra | **A/C** |
| **B** | decide, e persiste | **C/D** |
| **C** | não há ato online; conduz à conversa | **A** |

**Não recomendo** — é regra de negócio, não UX. **Mas o estado atual não pode
ficar:** um botão que não muda nada viola **P2**.

## D-3 · Concierge: número, horário e o que dizer fora dele

**Trava:** Bloco 1 — **o de maior impacto humano e menor custo técnico**.
Sem isso o link existe e a promessa não.
**Precisa:** número de destino · horário de atendimento · **frase para quando
ninguém puder responder agora**.

## D-4 · O PDF da história é cópia de conveniência ou documento de registro?

**Trava:** Bloco 10.
Muda cabeçalho, identificação, retenção e possivelmente versionamento.
**Provavelmente exige o jurídico.**

## D-5 · A pendência tem destinatário?

**Trava:** o bloco da pendência — também sem número.
**O fato:** *"A pendência do Acolhimento existe só na tela do Curador. **Não há
superfície** para a paciente responder"* (B2-3).
**É ausência no produto, não defeito de tela.** Criar o canal é **C/D**.

> **É a lacuna de maior consequência humana das três de [§06](06_HANDOFFS.md):**
> o Curador registra que falta um exame, e a paciente não tem como saber.

## D-6 · Persistir a seleção dos três caminhos

**Trava:** parte do Bloco 11.
**O fato:** *"Marcar os três e navegar para outra pergunta perde a seleção"* (C2).
**Provavelmente C** (action) — **verificar antes**: pode já haver onde gravar.
**Único item da Mesa com risco de backend.**

## D-7 · Como uma pessoa nova entra na Aliviar?

**Trava:** Bloco 13.
O CTA público convida a começar, e **não existe cadastro público equivalente**.
Opções: contato com Concierge · solicitação de acesso · onboarding controlado ·
convite · WhatsApp.
**Não desenho cadastro aberto por conta própria** — é decisão de produto e de
risco.

## D-8 · Conversa dentro da plataforma?

**Trava:** nada hoje; define o teto do Concierge.
Se sim, **C/D** e missão própria. Se não, o WhatsApp continua sendo o canal.
**Recomendo: não agora.**

---

## Resumo

| # | Trava | Custo se aprovada | Recomendo? |
|---|---|---|---|
| **D-3** | **Bloco 1** | **A** | ✅ **decidir primeiro** |
| **D-1** | Bloco 7 | A | ✅ **RESOLVIDA — espinha visual** ([34 §3.1](34_BLOCO_7_LANDING_D1.md)). A prova é um ato: a Track D apagou 23 arquivos de landing e **blindou `editorial/**` por escrito**, preservando os quatro blocos. Problema, Respiro, FAQ e Convite **ficam** |
| **D-6** | parte do 11 | ~~C~~ → **A** | ✅ **RESOLVIDA — não é backend** ([36 §3](36_BLOCOS_11_12_D6_CASOS_REAIS.md)). `curated_selections` já existe e **deve continuar recusando rascunho** (exatamente três · rationale não-vazio · autoria nomeada). A perda vem de `mesa-shell.tsx:199`, que monta só a etapa corrente e **desmonta** o reducer. Correção: elevar o estado acima do que desmonta. ⛔ sem `localStorage` — os rascunhos são juízo clínico |
| **D-4** | Bloco 10 | C/D | — jurídico |
| **D-7** | Bloco 13 | varia | — produto |
| **D-2** | decisão | A/C/D | — regra de negócio |
| **D-5** | pendência | C/D | — produto |
| **D-8** | teto | C/D | ❌ não agora |
| **D-9** | migration do Encontro 1 — [adendo 23](23_ADENDO_DOIS_ENCONTROS.md) | **E, mínima** | ✅ **FORMALMENTE CERTIFICADA E ENCERRADA** (2026-08-10, HEAD `996f109`) — `meeting_held_at` aditiva, nullable, sem default, sem backfill, sem trigger inferencial; writer com gate de Curador, idempotente e com guarda de corrida; a Jornada passa a concluir a Consulta Inicial pelo **fato do encontro**, não pelo produto |
| **D-10** | agendamento do Encontro 2 | E | ❌ **PENDENTE — fora de escopo desta sequência**; nenhum mecanismo novo criado. `devolutiva.presentedAt` permanece o fato de realização |
| **D-11A** | eliminação do bypass de validação do Perfil | correção | ✅ **FORMALMENTE CERTIFICADA E ENCERRADA** (2026-08-10, HEAD `996f109`) — `validatePriorityProfile` saiu de `src/` (**0 chamadores de produção**); substituído por `tests/apoio/fixture-perfil.ts :: fixtureValidarPerfil`, fora do runtime; via oficial preservada (paciente → ReconhecerPerfil → `acknowledge_priority_profile`) |
| **D-11** (residual) | orquestração UX do Primeiro Encontro — [24](24_D11_ORDEM_DO_PRIMEIRO_ENCONTRO.md) | produto/UX | ⚠️ **AINDA PENDENTE** — o bypass de fixture/seed está **resolvido** (D-11A); o que resta é orquestração de experiência, **não defeito técnico**. **ADR-042 intacta**: nenhum gate `meetingHeldAt != null` foi criado para a paciente reconhecer o Perfil |
| **D-12** | Central de Documentos — [25](25_D12_CENTRAL_DE_DOCUMENTOS.md) | **E, duas policies** | ✅ **APTO** — reutiliza tabela e bucket; origem derivada de `uploaded_by <> profile_id`, sem coluna nova |
| **GAP-D12-2** | a paciente pode apagar documento que **recebeu** da Aliviar? | produto | ⚠️ **ABERTO** — a policy de DELETE atual permite, e isso só passa a importar quando existirem documentos da Aliviar |
| **GAP-A6-Q1** | textos das perguntas de Sua História sem fonte única | refactor | ⚠️ **ABERTO** — impede versão **em branco** imprimível; a história **enviada** não depende disso |
| ~~**GAP-B3-2**~~ (antigo) | a decisão **persistia sem feedback** — [26](26_B3A_DECISAO_SEGUNDO_ENCONTRO_HANDOFF.md) §E | UX | ✅ **FECHADO em `603c4f5`** — hipótese confirmada: **B2-1 se reclassifica** de "não persiste" para "persistia sem avisar". A etiqueta foi reatribuída, ver linha seguinte |
| **GAP-B3-2** | **superfície canônica órfã** — [27](27_B3R_SUPERFICIE_ALCANCAVEL.md) | rota | 🔴 **BLOQUEANTE** — `CuradoriaDecisionPanel` não é importado por nenhuma superfície; a paciente **não tem caminho navegável** até o fato canônico. Contrato pronto: arquitetura **E**, **um só arquivo de produção** |
| **GAP-B3-1** | decisão sem trilha de auditoria | C | ⚠️ **ABERTO** — assimetria com `profile_recognized`; recomendo fazer junto de B3 |
| **GAP-B3-3** | `presentedAt` acumula *apresentação* e *encontro realizado* | domínio | ⚠️ **ABERTO, não bloqueante** — mesma classe da D-9, sem simetria artificial |
| **GAP-A1** | `meeting_scheduled_at` continua sem writer | produto/UX | ⚠️ **ABERTO** — não reprova D-9 nem pertence a D-11A; volta ao planejamento como pendência de UX/operação do Primeiro Encontro |

> **Os blocos 2, 3, 4 e 5 não dependem de nenhuma delas e podem começar hoje.**
