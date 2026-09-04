# Primeira Operação Real — Runbook e Ficha de Registro

> Documento operacional do PROMPT 12. Preenchido durante a primeira Curadoria
> real. Não é documento canônico; o domínio segue congelado (Modelo v1.0 §13).
> **Regra da missão: todo problema encontrado é registrado, nenhum é
> resolvido no ato. Nada de código muda durante a operação.**

## Pré-voo (verificado em 2026-07-27)

| Item | Estado |
|---|---|
| Profissionais reais na Rede | **0** — é o bloqueador de abertura |
| Perfis de demonstração | 6 (despublicados, isolados) |
| Case candidato | `61da4e7e` — Perfil **VALIDADO**, Curador responsável definido, 1 Consulta registrada |
| Exigências do Case | Ortopedia de coluna · SP · cuidado contínuo |
| Pesos do cruzamento (Modelo v1.0) | 0 — o Curador distribui na sessão (2×100) |
| Declarações de área / paciente | 0 — acontecem na sessão |

## Pré-voo — reverificado em 2026-08-27

A tabela de 27/07 acima fica como está: ela é o registro do que era verdade
naquela data, e o bloqueador que ela nomeia **caiu**. O estado atual:

| Item | Estado |
|---|---|
| Profissionais reais publicados na Rede | **3** — Guilher Rossoni · Salassie A. Mansur · Saul Dalla de Oliveira |
| Mapa do Profissional dos três | **Completo em produção** — 29/29 subcritérios, zero em "ainda não avaliado" (`SIM-31`, encerrado) |
| Motor | Alimentado: com Mapa preenchido saiu de *"0 altas · 0 médias · 23 lacunas"* para leitura com altas e médias |
| Perfis de demonstração | Fora da Rede publicada — **conferir no dia**, porque a ADR-057 fez "nenhum perfil de teste sem marcação" item de NO GO |
| Base de privacidade | **Ausente por decisão** — o Fundador determinou em 27/08 não publicar ainda. Ver o aviso abaixo |
| Gate de aceite | Não ligado (`SIM-60`): a guarda existe, não tem chamador, e aponta para `/aceites`, que não existe |

### O aviso que precisa estar aqui, e não em outro documento

Sem política publicada, **não há termos, não há consentimento colhido e não há
canal de encarregado** — e a primeira Curadoria trata dado de saúde de uma
pessoa real. O `GO_NO_GO_FINAL.md` marca isso como 🔴 NO-GO de privacidade, e
o critério de encerramento do `PRIV-01` prevê a saída: *"política publicada
**ou adiamento formal assinado pelo responsável por LGPD**"* — que é o próprio
Fundador (ADR-055).

**Enquanto o adiamento não estiver registrado, a lacuna não é decisão: é
lacuna.** Duas formas de abrir sem isso pendurado:

1. registrar o adiamento formal, com risco aceito e gatilho de revisitar; ou
2. a primeira Curadoria ser conduzida com **paciente da própria equipe**, e
   não com pessoa de fora — a exposição é outra e a publicação pode esperar.

Isto não bloqueia o runbook. Está aqui para que a escolha seja feita **antes**
da sessão, e não descoberta no meio dela.


## Pré-voo — reverificado em 2026-09-04

As duas tabelas acima ficam como estão: são o registro do que era verdade
naquelas datas. **O bloqueador de 27/07 caiu em 27/08, e o aviso de 27/08
deixou de estar pendurado em 04/09** — o adiamento formal existe.

Tudo abaixo foi medido contra o banco de produção nesta data, não lido de
documento.

### O alarme que NÃO foi dado, e por que ele fica escrito

Dois dos três profissionais têm **1 subcritério em `NAO_INFORMADO`**, contra o
*"29/29, zero em ainda não avaliado"* do pré-voo de 27/08. Parecia divergência.
**Não é:** o enum `subcriterion_status` tem exatamente três valores —
`CONFIRMADO | NAO_CONFIRMADO | NAO_INFORMADO` — e **"ainda não avaliado" não
existe como estado**. Os três têm os 29 subcritérios mapeados; `NAO_INFORMADO`
é uma **declaração** do profissional, não um buraco no Mapa.

Fica registrado porque um achado dissolvido na verificação vale tanto quanto um
achado confirmado: se eu tivesse reportado por impressão, alguém teria "corrigido"
um dado correto na véspera da sessão.

### O que está pronto

| Item | Estado em 04/09 |
|---|---|
| Profissionais reais na Rede | **3**, `publicado` + `regular` — Guilher Rossoni · Salassie A. Mansur · Saul Dalla de Oliveira |
| Mapa do Profissional | **29/29 mapeados nos três** |
| Perfis de demonstração | **6**, todos `nao_publicado` e com `is_demo` — a ADR-057 está cumprida |
| Case candidato `61da4e7e` | **Vivo.** `WAITING_FOR_INFORMATION`, com responsável e Curador definidos |
| Entrega de e-mail | **Sai.** Dois `mail.send` sem erro nos logs do Auth em 03/09 (`SIM-105`) — antes disso, o e-mail não saía para quem não fosse da equipe |
| Base de privacidade | **Adiamento formal registrado** — ADR-096, 27/08. O aviso acima dizia *"enquanto o adiamento não estiver registrado, a lacuna não é decisão: é lacuna"*. Agora é decisão, datada e assinada |

### O elenco — quem entra com qual conta

| Conta | Nome na tela | Papel | Último acesso |
|---|---|---|---|
| `barb***@gmail.com` | Administrador | `administrador` | 30/08 |
| `aten***@gmail.com` | Atendente Aliviar | `atendente` | 04/08 |
| `hhsc***@gmail.com` | Curador Aliviar | `curador_medico` | 30/08 |
| `hcas***@gmail.com` | Concierge Aliviar | `concierge` | 24/08 |
| `lary***@gmail.com` | Laryssa | `paciente` | 25/08 |
| `hhso***@gmail.com` | Henrique Teste Paciente | `paciente` | 28/07 |
| `padi***@gmail.com` | Paciente | `paciente` | 25/07 |

`demo@aliviar.demo` existe **sem papel nenhum** e nunca acessou. Conta morta.

### O que a sessão VAI esbarrar — registre, não conserte

A regra da missão vale mais aqui do que em qualquer outro ponto: **todo problema
encontrado é registrado, nenhum é resolvido no ato.** Os quatro abaixo já são
conhecidos, e estão aqui para não roubarem a atenção de um achado novo.

1. **`/aceites` não existe, e há link para lá.** `/paciente/documentos` oferece
   o caminho; a rota não foi criada. Porta pintada na área da assistida — ela
   vai clicar. É o `SIM-60`, e o gate de aceite continua desligado por decisão
   (ADR-096: o gate e a publicação entram juntos ou não entram).
2. **Os nomes das contas são os antigos.** "Atendente Aliviar" e "Concierge
   Aliviar" continuam no `display_name`, e a **ADR-112** renomeou o papel para
   **Supervisor de Jornada** em 04/09. A tela mostra o nome guardado no banco,
   não o do Método.
3. **O Supervisor precisa dos dois slugs para atravessar a jornada inteira.**
   `/acompanhamento` exige `concierge`; hoje são duas contas diferentes, e na
   operação real é **uma pessoa só** (ADR-106: "Concierge nomeia a função, não
   uma pessoa nova"). Ou se concede o segundo papel à conta do Supervisor antes
   de começar, ou a passagem do Curador para a logística trava no meio.
4. **A RLS não é o problema, e é bom saber disso antes.** `cases` concede por
   `responsible_id = auth.uid()`, não por papel — quem for o responsável
   enxerga o Case. O que restringe é a máquina de transições de
   `transfer_case_responsibility`, que só conhece
   `null → atendente → curador_medico → concierge`.

### A decisão que precede a sessão, e não é técnica

**Quem é a assistida.** A ADR-096 é explícita: **paciente da própria equipe** e
o adiamento se sustenta com folga; **pessoa de fora** e ele deixa de se
sustentar no mesmo instante — é o cenário que o `GO_NO_GO_FINAL.md` marca como
🔴 NO-GO de privacidade.

Com alguém da equipe, **a primeira Curadoria pode acontecer sem esperar o
advogado.** É a única porta aberta hoje, e ela está aberta.

---

## ETAPA 1 — Cadastro dos três profissionais reais

**O que a equipe precisa fornecer, por profissional** (política de fontes,
`docs/curadoria` + `fontes.ts` — encontrar não é verificar):

- [ ] Nome completo · CRM · UF
- [ ] **Registro**: consulta ao conselho (fonte oficial primária) — resultado, data, quem consultou
- [ ] **Área de atuação**: texto como a clínica/o profissional declara + endereço da fonte (institucional) — vira `raw_text` + tags
- [ ] **Formação**: título, tipo, instituição, período — fonte oficial ou documento
- [ ] **Experiência**: anos, casos predominantes, atuação atual — declaração com evidência
- [ ] **Histórico**: ao menos um vínculo verificável — instituição confirma
- [ ] **Perfil Assistencial**: cidades/UF, presencial/online, **cuidado contínuo por entrevista ou descrição operacional explícita** (consultório existir não prova), retornos, equipe; decisão compartilhada, participação familiar, idiomas, acessibilidade
- [ ] O que a fonte não disser fica `nao_localizado`; o que contradisser vira **divergência aberta** (as duas versões ficam)

**Quem verifica**: Administrador (só ele assina `verificado`, com fonte+data).
**Critério de saída**: `assessReadiness` = **Pronto para Curadoria** nos três
(exige registro regular verificado + área verificada + blocos verificados).
Publicação: o gatilho do banco recusa se faltar requisito.

Registro da etapa:

| Profissional | CRM/UF | Registro verificado | Área verificada | Prontidão | Divergências |
|---|---|---|---|---|---|
| | | | | | |
| | | | | | |
| | | | | | |

## ETAPA 2 — O primeiro Case

Case único: **`61da4e7e`** (já cumpre: Perfil validado, Consulta concluída,
Curador definido). Antes de abrir a sessão: paciente informado? ☐

## ETAPA 3 — Sessão do Curador (Mesa: `/coa/curadoria`)

Percurso sem atalho: pesos (2×100) → declaração de área por profissional →
avaliações de critério com evidência → comparação → seleção de três →
rascunho assistido → revisão → aprovação → emissão.

| Registro | Valor |
|---|---|
| Início / fim | |
| Dificuldades | |
| Campos ignorados | |
| Informações ausentes (viraram insuficiente?) | |

## ETAPA 4 — Sessão do Paciente (`/paciente`)

Não explicar a interface antes. Observar: Dashboard, linha do tempo, Perfil
(importâncias), Relatório, escolha.

| Registro | Valor |
|---|---|
| Dúvidas / perguntas espontâneas | |
| Interpretações incorretas (leu importância como nota? procurou ranking?) | |
| Dificuldades | |

## ETAPA 5 — Concierge (`/acompanhamento`)

- [ ] Escolha recebida  ☐ Connection criada  ☐ Acompanhamento iniciado
- [ ] Metade pós-Curadoria validada (responsável, próxima ação, último contato)

## ETAPAS 6–7 — Auditoria e métricas

| Métrica | Valor |
|---|---|
| Tempo da Consulta Inicial | (já ocorrida — recuperar do registro) |
| Tempo da Curadoria / do Relatório / da Escolha | |
| Tempo até o primeiro contato | |
| Informações insuficientes / divergências / verificações | |
| Profissionais elegíveis | |

Auditoria: o que atrasou · o que faltou · o que nunca foi usado · o que foi
usado o tempo inteiro. **Observações, nunca correções.**

## ETAPA 8 — Relatório Operacional

A Curadoria terminou? · O paciente compreendeu? · O Curador trabalhou com
facilidade? · O Concierge assumiu? · Dashboard ajudou? · Relatório ajudou? ·
O que mais atrasou? · Primeiro bloqueador operacional?

**Gate:** ☐ OPERAÇÃO REAL CONCLUÍDA · ☐ OPERAÇÃO PARCIAL · ☐ BLOQUEADA
