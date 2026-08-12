# 31 · Track C — fechamento

**Estado:** fechada para o **04 VERIFICADOR** · 2026-08-11
**Contrato que este documento fecha:** [30](30_TRACK_C_FALAR_COM_A_ALIVIAR.md)

> ### A paciente só conseguia pedir ajuda **depois** de já ter decidido.
>
> Havia um único ponto de contato, no estado decidido do painel de decisão. O
> momento em que ela lê três caminhos **médicos** e escolhe não tinha porta
> nenhuma. Agora tem — e mais seis.

---

## 1 · Fonte única do WhatsApp

`ALIVIAR_WHATSAPP = "5511979037133"`, em
[`whatsapp-contact.tsx`](../../src/components/curadoria/whatsapp-contact.tsx).
O literal aparece **uma única vez em `src/`**, e T-C-4 varre a árvore inteira
para garantir. Qualquer superfície que precise do número importa a constante —
nunca reescreve.

## 2 · As sete inserções

| # | Rota | Posição | `topic` |
|---|---|---|---|
| **C1** | `/paciente/curadoria` | faixa de material de consulta da Mesa, sob o link do PDF | `curadoria` |
| **C2** | `/paciente/curadoria` vazia | prop `action` do `PatientEmptyState` | `curadoria` |
| **C3** | `/paciente` | fim da página, **nos dois estados** | `jornada` |
| **C4** | `/paciente/linha-do-tempo` | fim da página | `jornada` |
| **C5** | `/paciente/documentos` | rodapé da central | `documento` |
| **C6** | `/paciente/perfil` | fim, fora do formulário | `jornada` |
| **C7** | `/paciente/documentos-e-consentimentos` | fim da página | `jornada` |

**C1 não fica abaixo da decisão.** `CaminhosPanel` reserva o espaço sob a
escolha como vazio deliberado — preencher ali é empurrar. T-C-6 prova a ordem
por `compareDocumentPosition`, não por leitura.

## 3 · Matriz de tópicos e mensagens

Rótulo **idêntico nos sete pontos**: `Falar com a Aliviar`, com o sufixo
`sr-only` *(abre o WhatsApp em nova aba)*. O assunto vive na **mensagem**,
nunca no texto do link.

| `topic` | Mensagem | Situação |
|---|---|---|
| `jornada` | `Oi! Gostaria de ajuda com a minha jornada na Aliviar.` | nova |
| `curadoria` | `Oi! Gostaria de conversar sobre a minha Curadoria.` | nova |
| `documento` | `Oi! Quero enviar um documento para a minha Curadoria.` | inalterada |
| `duvida` | `Oi! Tenho uma dúvida sobre a minha Curadoria.` | **congelada** — no ar e em EV-B3-003/004/005 |
| `curador` | `Oi! Gostaria de falar com meu Curador.` | existe, **não ligada** (GAP-C-3) |

O conjunto é **fechado**: T-C-2 compara as mensagens do mapa com a lista
aprovada, elemento a elemento. Mensagem nova, palavra a mais ou interpolação
mudam o conjunto e derrubam o teste.

## 4 · Sem SLA, por decisão

Nenhum horário de atendimento é declarado, e nenhum prazo é prometido.
Declarar horário cria compromisso que ninguém aprovou — a mesma doutrina que
`continuity-worklist.ts` já aplica. **O canal promete existir, nunca prometer
quando.**

No lugar do horário fica a frase institucional — `Sem pressa — responderemos.`
—, e ela aparece **só na C2**: é o único ponto com espaço de bloco. Nas seis
inserções discretas seria ruído ao lado de um link de PDF.

## 5 · Sem auditoria de clique, por decisão

**O clique não é registrado.** Nenhum `audit_logs`, nenhum evento, nenhuma
analítica. Registrá-lo criaria sinal de comportamento da paciente — o que
`continuity-worklist.ts` recusa: *a operação é o objeto da medição, ela nunca*.

Medido: a execução completa da suíte e2e não criou **um** evento de clique.

## 6 · Acessibilidade

- nome acessível completo — `Falar com a Aliviar (abre o WhatsApp em nova aba)`;
- o aviso de nova aba é dito **antes** do clique, por `sr-only`;
- alcançável e acionável **só pelo teclado**, com anel de `focus-visible`;
- compreensível **sem cor**: é texto, com sublinhado no foco/hover;
- alvo mínimo de **44px**, medido em pixels no navegador — nunca por classe.

> Um defeito real foi pego ainda na bancada: sem espaço explícito antes do
> `sr-only`, o JSX colava as partes e o leitor de tela anunciaria
> *"Aliviar(abre o WhatsApp…"*. Corrigido antes de qualquer inserção.

## 7 · Mobile — medido, nunca inferido

Sete superfícies em **390×844**, com a mesma regra de scroller validada na B3
(só conta como vazamento o que ultrapassa a viewport **sem** estar dentro de um
contêiner de rolagem própria):

| # | rota | `scrollWidth` | overflow | alvo | fora da viewport |
|---|---|---|---|---|---|
| C1 | `/paciente/curadoria` | 390 | **0** | 123×**44** | — |
| C2 | Curadoria vazia | 390 | **0** | **44** | — |
| C3 | `/paciente` | 390 | **0** | 123×**44** | — |
| C4 | `/paciente/linha-do-tempo` | 390 | **0** | 123×**44** | — |
| C5 | `/paciente/documentos` | 390 | **0** | 123×**44** | — |
| C6 | `/paciente/perfil` | 390 | **0** | 123×**44** | — |
| C7 | `/paciente/documentos-e-consentimentos` | 390 | **0** | 123×**44** | — |

`innerWidth === clientWidth === scrollWidth === 390` em todas.

## 8 · Segurança do `href`

**A mensagem diz o assunto, nunca o conteúdo.** A garantia é de **tipo**:
`whatsappHref` aceita somente `WhatsappTopic`, `ConciergeLink` só repassa o
tópico, e não existe prop de mensagem, texto ou telefone. Não há caminho para
texto livre.

T-C-9 confere, em cada inserção, que o `href` leva ao número oficial, carrega
**exatamente** a mensagem do tópico e **não contém** `caseId`,
`curatedSelectionId`, `patientProfileId`, e-mail nem nome de profissional.

**O WhatsApp nunca é aberto.** O destino é inspecionado por atributo; nenhum
request externo é feito por teste algum.

## 9 · Evidências

`evidencias/` é **gitignored** (`.gitignore:95`). Reproduzíveis com

```bash
CAPTURA=1 node scripts/with-local-supabase.mjs npx playwright test tests/e2e/track-c-falar-com-a-aliviar.spec.ts --workers=1
```

| evidência | viewport | o que prova |
|---|---|---|
| **EV-C-001** | 390×844 | Curadoria **antes de decidir** — três caminhos, a porta com anel de foco, e a decisão abaixo dela |
| **EV-C-002** | 390×844 | Home com a porta discreta no fim |
| **EV-C-003** | 1440×900 | Documentos com a porta no rodapé, fora do cartão |
| **EV-C-004** | 390×844 | Documentos em mobile |
| **EV-C-004b** | 390×844 | o estado vazio com a porta e a frase institucional |

Paciente **sintética**, pela fixture. Nenhum dado real.

## 10 · Provas de perda

| | Mutação | Caiu |
|---|---|---|
| **M-C1** | remover o JSX de uma inserção mantendo o import | 3 testes (composição C5, varredura das sete, alcançabilidade por rota) — executada na P2 |
| **M-C2** | rótulo vira *"WhatsApp"* | 4 testes de T-C-1 |
| **M-C3** | nome da paciente na mensagem | **T-C-2** |
| **M-C4** | número literal numa página | T-C-4 |
| **M-C5** | remover `ConciergeLink` de toda `src/app` | 2 testes de T-C-10 |
| **extra** | perda do `sr-only` (nome acessível) | 2 testes de T-C-1 |
| **extra** | tópico trocado em C5 | composição de C5 |
| **extra** | promessa de prazo na frase | 2 testes de T-C-1 |

> **M-C3 expôs uma guarda insuficiente, e isso é o valor da mutação.** A versão
> original de T-C-2 varria **vocabulário** proibido — e "Sou a Maria Silva" não
> casa com termo nenhum: a mutação passou. Nome próprio não tem lista. O que
> tem é o **conjunto**: T-C-2 passou a exigir que as mensagens sejam
> exatamente as aprovadas. Refeita a mutação, o teste caiu.

Nenhuma mutação permaneceu: `git status src/` vazio ao fim de cada uma.

## 11 · Regressão

| | |
|---|---|
| e2e da Track C (com captura) | **6/6** |
| componente + composição da Track C | **27/27** |
| suíte de componentes completa | **743/743** |
| suíte unitária completa | 2687 passed · **1 pré-existente** |
| alcançabilidade | 3/3 |
| typecheck · lint focado | limpos |
| `npm run build:local` | ok |
| ledger | **121/121** — inalterado |

**A falha unitária é pré-existente e comprovadamente alheia:**
`mecanismo-de-discordancia.test.ts` › *G-6* lê `supabase/migrations/*` e espera
a assinatura de `curadoria.decidir_proposta`. O delta inteiro da Track C
(`d8b0d31..HEAD`) **não tem um único arquivo SQL** — são seis rotas, dois
componentes e quatro arquivos de teste.

## 12 · Cleanup

| | antes | depois |
|---|---|---|
| `connection-e2e-admin-*` | 225 | **225** |
| `connection-e2e-patient-*` | 219 | **219** |
| cases · decisões · selections · connections · profissionais · documentos | 0 | **0** |
| `audit_logs` | 4689 | 4741 |

**Zero resíduo novo.** A auditoria cresceu por fatos legítimos das fixtures
(criação de contas, mudanças de estado do Case) — **nunca** por clique em
WhatsApp, que não gera evento nenhum.

## 13 · Órfãos preservados para o Bloco 3

| | Disposição |
|---|---|
| `sem-curadoria.tsx` | **não ligado.** A rota já tem `PatientEmptyState`; é código morto e sai no Bloco 3 |
| `WhatsappContact` | continua alcançando ninguém — seu único importador é o órfão acima. **Não removido nesta Track**: o mapa `TOPICS` e `whatsappHref` vivem no mesmo arquivo e são a fonte única |

Nada foi apagado. Remover é ato do Bloco 3, com desenho próprio.

## 14 · Gaps que permanecem

| Gap | Disposição |
|---|---|
| **GAP-C-1** — `SemCuradoria` órfão | registrado, sai no Bloco 3 |
| **GAP-C-2** — duas implementações do mesmo link | o painel de decisão fica **congelado** até a evidência da B3 ser superada. Consequência visível: no estado **decidido** a Curadoria mostra **dois** links "Falar com a Aliviar" — o da Mesa (`curadoria`) e o do painel (`duvida`). Distinguíveis pelo nome acessível; unificar é passagem própria |
| **GAP-C-3** — tópico `curador` sem uso | deliberado: tornar o Curador clicável prometeria acesso a uma pessoa específica |
| **D-5** — Pendência sem destinatário | ⛔ bloqueada; a sétima superfície de [09](09_CONCIERGE_WHATSAPP.md) não existe |
| `GAP-B3-COPY-ID` · D-10 · GAP-D12-C1 · A3b/A4 | intocados |
| `FOUNDATION_VERIFICATION.md` fora do Git | intocado, por instrução expressa |
| **dívida de ambiente** | 444 contas sintéticas locais de execuções anteriores — **não é resíduo desta Track** ([29 §16](29_B3_FECHAMENTO_TRACK_B.md)) |

## 15 · Commits da Track C

| commit | o que entregou |
|---|---|
| `eed79ed` | `ConciergeLink`, os dois tópicos novos, T-C-1..T-C-4 |
| `479ad51` | as sete inserções, T-C-5, T-C-6 e T-C-10 |
| *(este)* | e2e T-C-7..T-C-9, mutações, evidências e fechamento |

---

# TRACK C FECHADA — A PORTA EXISTE ANTES DA DECISÃO

**Zero migration, zero RLS, zero grant, zero action, zero tabela.** Um
componente novo, dois tópicos, sete linhas em seis rotas — e o resto é prova.
