# 21 · Decisões necessárias — DT-01

**Oito.** Nenhuma foi resolvida silenciosamente. Cada uma diz **o que trava** e
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
| **D-1** | Bloco 7 | A | ✅ espinha visual |
| **D-6** | parte do 11 | C | ✅ verificar antes |
| **D-4** | Bloco 10 | C/D | — jurídico |
| **D-7** | Bloco 13 | varia | — produto |
| **D-2** | decisão | A/C/D | — regra de negócio |
| **D-5** | pendência | C/D | — produto |
| **D-8** | teto | C/D | ❌ não agora |

> **Os blocos 2, 3, 4 e 5 não dependem de nenhuma delas e podem começar hoje.**
