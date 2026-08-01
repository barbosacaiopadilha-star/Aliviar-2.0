# Contrato Operacional da Decisão — Fase 9B

> **Objetivo:** responder, com autoridade verificável, **o que acontece no mundo da Aliviar quando uma paciente confirma uma decisão** — e marcar como bloqueado, sem fingir fechamento, tudo o que não tem autoridade.
> **Fontes de autoridade, em ordem:** (1) a **arquitetura operacional congelada** — migrations e domínio implementados, que são fato verificável; (2) os documentos de experiência [A_DECISAO.md](./A_DECISAO.md), [A_MESA.md](./A_MESA.md), [A_SALA_DA_DECISAO.md](./A_SALA_DA_DECISAO.md); (3) decisões de domínio ainda não tomadas — registradas como pendências.
> **Não faz:** redesenhar a Mesa ou a Sala · criar tela, layout ou código · alterar Motor, pesos ou critérios · criar protocolo clínico · emitir conclusão jurídica · inventar prazo · alterar documentos anteriores (§17 propõe patches; não os aplica).
> **Data:** 2026-08-01 · **Atualizado na Fase 9D** (reconciliação documental)

---

# 0-A · Estado deste Contrato após as Fases 9C e 9C.1

*Acrescentado na reconciliação. **O corpo do documento é preservado como registro histórico** — é ele que torna a divergência inteligível. Esta seção diz o que mudou desde então.*

**A divergência D1 permanece registrada, e seu estado mudou: `DIREÇÃO RESOLVIDA · IMPLEMENTAÇÃO PENDENTE`.** A [ADR-043](../DECISIONS.md) decidiu que a Aliviar passará a intermediar a transição entre a decisão e o primeiro contato. **O modelo de auto-serviço encontrado não foi apagado nem declarado inválido** — é o que está implementado hoje, e continua descrito no §0.2 como foi verificado.

| Questão | Estado após 9C/9C.1 |
|---|---|
| **Q1 · reversibilidade** | **parcialmente decidida pelo domínio vigente** (correção direta até a declaração de contato, garantida por *trigger*) e **ampliada pela ADR-043** (alteração mediada depois da janela, ainda não implementada) |
| **Q3 · reserva** | **inexistente no domínio atual.** Nenhuma decisão futura torna emitíveis as frases de garantia sem antes criar o evento que as sustente |
| **Q4 · autoridade de correção direta** | **a paciente** |
| **Q6 · acesso à formulação** | **paciente, Curador do caso e administrador**, conforme as políticas vigentes. Transmissão ao profissional não autorizada; acesso do Concierge inexistente. **A decisão de privacidade permanece `BLOQUEADA`** |
| **Q-C8 · quando o Concierge assume** | **RESOLVIDA** pela distinção entre **responsabilidade organizacional** (nasce no registro da decisão) e **responsabilidade pessoal** (nasce na transferência auditada). Entre as duas, responde o **Curador** |
| **Q-C4 · canais e prazos** | **parcialmente resolvida.** Canais inventariados, nenhum novo pressuposto; **nenhum prazo assumido**. Permanece aberto o canal para o profissional |
| **Q-C9 · urgência** | **delimitada e mantida `BLOQUEADA`** — mínimo não clínico autorizado; toda instrução depende de validação clínica |

**A distinção que este Contrato mantém, e que a reconciliação não pode borrar:** o que é **constatação do domínio vigente**, o que é **decisão da ADR-043** e o que é **capacidade ainda não implementada** são três coisas diferentes. **Nenhuma capacidade futura é descrita aqui em tempo presente.**

---

# 0 · A descoberta que reenquadra esta fase

*Antes do inventário, o achado que muda o que as Q1–Q10 significam.*

A Fase 9 tratou dez questões como abertas. **Ao confrontá-las com a arquitetura operacional congelada, verifiquei que várias já estão decididas — e que a decisão implementada contradiz o modelo que as Fases 7 a 9 descrevem.** Isto não é detalhe de implementação: é a diferença entre dois serviços distintos.

## 0.1 · Os fatos verificáveis (F1–F9)

Constatados no código e nas migrations, não inferidos:

| # | Fato | Onde |
|---|---|---|
| **F1** | O desfecho da decisão é `outcome in ('CHOSEN','NONE_OF_THEM')` — **"nenhum dos três" é desfecho de primeira classe no banco**, não exceção | `20260724022540_…metodo_curadoria_compartilhada.sql:173` |
| **F2** | O ciclo pós-decisão é `connection_records.status` ∈ `DECISAO_REGISTRADA` · `CONTATO_INICIADO` · `PRIMEIRO_ATENDIMENTO_REALIZADO` · `ENCERRADO_SEM_RELACIONAMENTO` | `20260723164933_…stage5_connection_relationship.sql:12` |
| **F3** | Transições válidas: `DECISAO_REGISTRADA` → os outros três; `CONTATO_INICIADO` → os dois finais; **os dois finais são terminais** | mesma migration, `assert_connection_valid_transition` |
| **F4** | **A correção da escolha só é permitida enquanto `status = DECISAO_REGISTRADA`** — garantido por *trigger*, não por convenção | idem, e `connection/commands.ts:135` |
| **F5** | A correção **nunca sobrescreve** a escolha original: gera evento `CORRECAO_ESCOLHA` em sequência temporal | `connection/commands.ts:127` |
| **F6** | **Só a paciente age.** RLS e `assertOwner` restringem criação, correção e transições ao próprio paciente; Curador e administrador têm **apenas leitura** | políticas `connection_records_*`, `connection_events_insert_own_patient` |
| **F7** | O profissional escolhido **precisa estar na entrega** — *trigger* `assert_connection_professional_in_delivery` impede escolher fora dos três | idem |
| **F8** | **`CONTATO_INICIADO` é *"sempre uma declaração do paciente, nunca verificada externamente"*** — e a superfície diz *"Você registrou que iniciou o contato com [nome]"* | `connection/commands.ts:167`; `connection-progress-panel.tsx:190` |
| **F9** | **Não existe no domínio nenhuma tabela, campo ou evento de agenda, horário, reserva ou disponibilidade.** `PRIMEIRO_ATENDIMENTO_REALIZADO` é registro *a posteriori*, também declarado por ela | busca em `supabase/migrations/` |

## 0.2 · DIVERGÊNCIA D1 — dois serviços diferentes

**O modelo implementado é de auto-serviço acompanhado.** A paciente decide; **a paciente contata o profissional**; a paciente informa que contatou; a paciente informa que foi atendida. A Aliviar entende, cura, apresenta e registra — **e não intermedia o contato.**

**O modelo descrito nas Fases 7 a 9 é mediado.** [A_DECISAO §5.2](./A_DECISAO.md) diz que ela sabe *"que o Curador foi avisado e o que ele fará em seguida"*; [A_SALA_DA_DECISAO §8.1](./A_SALA_DA_DECISAO.md) modela seis eventos, entre eles **`profissional_contatado`** com autoridade de *"pessoa da Aliviar"*, `disponibilidade_confirmada` e `encaminhamento_iniciado`.

**Nenhum desses três eventos existe no domínio, e o único que se aproxima significa o contrário do que o documento supõe** (F8: quem contata é ela).

**O impacto.** Três consequências, e todas graves:

**Primeira — a Sala da Decisão, como escrita, promete um serviço que a Aliviar não presta hoje.** Se a paciente sair da Sala esperando que alguém ligue para o profissional, ninguém ligará. Isso é pior que uma promessa vaga: é uma expectativa concreta e verificável de falha.

**Segunda — a reversibilidade já está decidida, mas por um marco diferente do que a Fase 9 supôs.** A Fase 9 argumentou que a fronteira moralmente relevante é *"o profissional foi contatado pela Aliviar"* (fronteira B). **O sistema usa a mesma fronteira com outro sujeito: até ela declarar que contatou.** É coerente com o auto-serviço — e torna a janela reversível **inteiramente controlada por ela**, o que é arquitetonicamente superior ao que a Fase 9 propôs.

**Terceira — o Concierge não tem nenhuma autoridade de escrita no domínio pós-decisão** (F6). O acompanhamento descrito nas Fases 7 e 9 não tem, hoje, nenhuma representação operacional.

**O que este Contrato faz com D1.** Não a resolve — **não tem autoridade para escolher entre prestar um serviço mediado ou manter o auto-serviço.** É a decisão de maior alcance de toda a fase (§16, **Q-D1**). O que o Contrato faz é: (a) registrar o modelo implementado como a verdade operacional de hoje; (b) derivar dele tudo o que **pode** ser prometido agora; (c) marcar como bloqueada toda promessa que dependa do modelo mediado; (d) propor os patches mínimos (§17) para que os documentos parem de prometer o que não existe.

---

# 1 · Inventário das questões abertas (Q1–Q10)

*Recuperadas de [A_SALA_DA_DECISAO §16](./A_SALA_DA_DECISAO.md), com o estado revisto à luz de §0.*

### Q1 · Até quando a escolha pode ser revista, e o que significa "comunicada"?
**Por que existe:** nenhum documento de experiência definiu "comunicada"; e A_DECISAO §8 autoriza o Concierge a dizer que a decisão é reversível.
**Afeta:** A_DECISAO §8 · A_MESA §2 · A_SALA §5.1, §6, §17.4 · SD-N5, SD-O1.
**Promessas bloqueadas:** *"até [marco], nada está fechado"*; *"a decisão é reversível"*.
**Risco de experiência:** promessa quebrada no ponto de maior fragilidade.
**Risco operacional:** pedidos de mudança sem regra.
**Autoridade:** Direção + Curadoria.
> **ESTADO REVISTO: majoritariamente DECIDIDA pela arquitetura congelada** (F4). A correção é possível enquanto `DECISAO_REGISTRADA` e impossível depois — *trigger*, não convenção. Resta apenas a decisão de linguagem (§3.5) e o efeito de D1.

### Q2 · Em que momento o profissional é contatado?
**Por que existe:** define a duração real da janela reversível e o que ela vê depois de confirmar.
**Afeta:** A_SALA §8.1, §8.2, E10 · SD-N3.
**Promessas bloqueadas:** qualquer frase sobre contato feito pela Aliviar.
**Risco de experiência:** ela supor um contato que ninguém fará.
**Autoridade:** Operação da Curadoria.
> **ESTADO REVISTO: a pergunta está mal formulada para o modelo atual.** Hoje a Aliviar **não contata** (F8). A pergunta verdadeira é **Q-D1**: a Aliviar deve passar a contatar?

### Q3 · Existe reserva de agenda, expectativa ou compromisso?
**Afeta:** A_SALA §6.2 (fronteira C), §8.1, §9 deste Contrato.
**Risco jurídico:** criar compromisso material sem que ninguém tenha decidido criá-lo.
**Autoridade:** Direção + Jurídico.
> **ESTADO REVISTO: DECIDIDA por ausência — não existe reserva** (F9). Nada no domínio representa agenda, horário ou disponibilidade. **A fronteira C não existe hoje.**

### Q4 · Quem tem autoridade para alterar uma escolha já comunicada?
**Afeta:** A_SALA §6.3, §6.4, §17.4.
**Promessa bloqueada:** *"se mudar de ideia, [nome] cuida disso com você"*.
**Autoridade:** Operação.
> **ESTADO REVISTO: DECIDIDA — a paciente, e só ela** (F6). Nem Curador nem Concierge podem executar. Resta decidir se **devem** poder (Q-D1).

### Q5 · Qual é o prazo humano comprometido — dúvida, conversa, contato?
**Afeta:** A_SALA §8.2, §10.2, §11.1, E10 · toda a linguagem de "quando".
**Risco:** ou prometer prazo que não se cumpre, ou o silêncio parecer abandono.
**Autoridade:** Operação.
> **ESTADO: PENDENTE DE OPERAÇÃO, integralmente.** Nada no domínio expressa prazo ou canal. **É a maior lacuna remanescente depois de D1.**

### Q6 · A formulação do trade-off é visível ao Curador e ao Concierge?
**Por que existe:** decisão de privacidade, não de design.
**Afeta:** A_SALA §3, §7.2, SD-N7 · A_DECISAO §6.
**Risco de privacidade:** ela escrever supondo intimidade e ser lida por terceiros.
**Autoridade:** Direção + Privacidade.
> **ESTADO REVISTO: parcialmente DECIDIDA — e contra a suposição do documento.** A nota da decisão (`note`) é legível pelo paciente, **pelo Curador do caso e pelo administrador** (política `patient_decisions_select_own_or_team`). **Não é privada.** Ver §12 e patch P-7.

### Q7 · Política de urgência.
**Por que não se inventa:** é matéria clínica.
**Afeta:** A_SALA §12, §17.4.
**Risco clínico:** o único risco desta lista que não é de experiência — **é de segurança de uma pessoa**.
**Autoridade:** Direção + responsabilidade técnica clínica.
> **ESTADO: PENDENTE CLÍNICA, integralmente.** Nada mudou.

### Q8 · Efeitos jurídicos da confirmação.
**Afeta:** A_SALA §5.1, §14.2 · toda a linguagem do ato.
**Autoridade:** Jurídico.
> **ESTADO: PENDENTE JURÍDICA.** Ver §15 — e note-se que **D1 altera radicalmente a pergunta**: um serviço que intermedia contato tem exposição diferente de um que não intermedia.

### Q9 · Quando o Concierge assume, formalmente?
**Afeta:** A_DECISAO §7, §8 · A_MESA O5 · A_SALA §11, SD-O10 · conflito 0.2.
**Risco:** o pedido de conversa cair no vazio.
**Autoridade:** Operação.
> **ESTADO: PENDENTE DE OPERAÇÃO**, agravado: o Concierge **não tem autoridade de escrita nenhuma** no pós-decisão (F6). Ver §13.

### Q10 · O que a equipe vê quando alguém pede conversa.
**Afeta:** A_SALA §11.1, SD-N6 · P5.
**Risco:** reintroduzir, pelo lado da equipe, a classificação emocional que P5 proíbe.
**Autoridade:** Operação + Privacidade.
> **ESTADO: PENDENTE.** E hoje não existe no domínio nenhum canal de "pedido de conversa" — a porta da Mesa e da Sala **não tem destino implementado**.

### Q-D1 · **(NOVA — a de maior alcance)** A Aliviar intermedia o contato com o profissional?
**Por que existe:** §0.2. O domínio implementa auto-serviço; as Fases 7–9 descrevem mediação.
**Afeta:** A_DECISAO §5.2, §7, §8 · A_SALA §2, §6, §8 inteira, §13-E10/E11/E12, §14.2, §16-Q1..Q5 · SD-N3, SD-O3, SD-O8, SD-O10.
**Promessas bloqueadas:** **todas as relativas a contato, disponibilidade, encaminhamento e acompanhamento.**
**Risco de experiência:** a paciente esperar uma ligação que ninguém fará.
**Risco operacional:** decidir por mediação cria carga humana hoje inexistente e a exigência de Q5.
**Risco jurídico:** intermediar contato altera o papel da Aliviar na relação (§15).
**Autoridade:** **Direção**, ouvidas Curadoria, Jurídico e Privacidade.

---

# 2 · Ordem de dependência

**Regra geral: nenhuma decisão sobre linguagem pode ser tomada antes da decisão sobre o mundo que a linguagem descreve.**

```
Q-D1  a Aliviar intermedia o contato?
  │   (governa tudo abaixo; nenhuma das seguintes é decidível sem ela)
  ├── Q2  quando o profissional é contatado
  │     └── Q3  existe reserva?           [hoje: NÃO — F9]
  │           └── (só então) promessa de disponibilidade
  ├── Q1  "comunicada" + reversibilidade   [hoje: RESOLVIDA por F4]
  │     └── Q4  quem altera                [hoje: RESOLVIDA por F6]
  │           └── linguagem da janela (§3.5)
  ├── Q9  quando o Concierge assume
  │     └── Q10 contexto transmitido
  │           └── Q5  prazos e canais
  │                 └── toda frase com "quando"
  ├── Q6  quem lê a formulação             [parcialmente resolvida — §12]
  └── Q8  efeitos jurídicos                [depende de Q-D1: o papel muda]

Q7  urgência  ──── independente das demais; bloqueia apenas §14
```

**As cinco impossibilidades lógicas, explicitadas:**

**Não é possível definir reversibilidade sem definir o evento que a limita.** *Resolvido:* o evento é `CONTATO_INICIADO` (F4) — **mas seu significado depende de Q-D1**, porque hoje ele quer dizer "ela contatou" e num modelo mediado significaria "nós contatamos". **A regra sobrevive a D1; a frase que a explica, não.**

**Não é possível prometer disponibilidade sem definir contato e reserva.** *Resolvido negativamente:* não há reserva (F9), logo **nenhuma promessa de disponibilidade é emitível hoje**, por ninguém.

**Não é possível informar prazo sem definir responsável e canal.** Q5 depende de Q9 e Q10; e todos dependem de Q-D1, porque um modelo de auto-serviço tem pouquíssimos prazos a comprometer, e um mediado tem muitos.

**Não é possível decidir o que a equipe recebe sem decidir o que a equipe faz.** Q10 depois de Q9.

**Não é possível redigir termos sem saber o papel da Aliviar na relação.** Q8 depois de Q-D1 — **e este é o argumento mais forte para tratar Q-D1 como urgente**: a exposição jurídica de intermediar é diferente da de não intermediar, e a operação hoje pode estar entre as duas por omissão, não por decisão.

**Q7 (urgência) não depende de nenhuma.** Pode e **deve** ser decidida em paralelo — é a única com risco à segurança de uma pessoa.

---

# 3 · A definição de "comunicada"

## 3.1 · As sete candidatas, avaliadas

| # | Candidata | Verificável? | Reversível depois? | Expectativa criada | Impacto humano | Impacto técnico | Falhas possíveis | Linguagem honesta possível |
|---|---|---|---|---|---|---|---|---|
| **C1** | sistema **despacha** | **sim, plenamente** — é ato do próprio sistema | totalmente | nenhuma | nenhum | nenhum (já existe o registro) | fila, retry | *"o aviso saiu às [hora] para [nome]"* |
| **C2** | equipe **recebe** | sim, se houver acuse técnico | totalmente | nenhuma — ninguém leu | nenhum | requer canal com confirmação | entrega silenciosamente falha | *"chegou à caixa de [nome]"* — **fraca: não significa nada para ela** |
| **C3** | uma pessoa **lê** | **só por declaração humana** | ainda sim | mínima | alguém sabe | requer marcação manual | ninguém marca; marcação falsa | *"[nome] já viu"* |
| **C4** | **profissional é contatado** | por declaração de quem contatou | **não sem explicação a terceiro** | **alta — há alguém sabendo** | **máximo: nasce uma expectativa** | não existe hoje (D1) | ninguém contata; contato sem registro | *"falamos com ele em [data]"* |
| **C5** | profissional **recebe** | não, fora do nosso alcance | idem | alta | máximo | inalcançável | indistinguível de C4 | **nenhuma — não afirmável** |
| **C6** | profissional **responde** | sim, quando responde | idem | alta e recíproca | máximo | não existe hoje | ele não responde | *"ele respondeu"* |
| **C7** | **a paciente é informada** de que houve contato | sim | idem | alta | máximo | depende de C4 | descompasso com o fato | *"avisamos você em [data]"* — **circular: informa sobre informar** |

## 3.2 · A candidata que o domínio já implementa

**Nenhuma das sete, exatamente.** O sistema implementa **C4 com o sujeito invertido**: `CONTATO_INICIADO` é *"sempre uma declaração do paciente"* (F8) — **ela** contatou.

Chamemos essa oitava de **C4′ — contato declarado pela paciente**. Avaliada nos mesmos eixos:

**Verificabilidade:** por declaração dela, e **o código o assume explicitamente** ("nunca verificada externamente"). É honesto: não finge verificar o que não pode.
**Reversibilidade depois:** **não** — o *trigger* proíbe correção (F4).
**Expectativa criada:** alta e **real**, porque há de fato alguém do outro lado — mas criada **por ela**, não por nós.
**Impacto humano:** máximo, e **inteiramente sob controle dela**.
**Impacto técnico:** zero — está implementado.
**Falhas:** ela contatar e não declarar (fica reversível quando já não deveria); declarar sem contatar (perde a janela sem motivo).
**Linguagem honesta:** *"você registrou que iniciou o contato com [nome]"* — **que é literalmente o texto em produção hoje.**

## 3.3 · A definição vigente

> **DECIDIDA POR ARQUITETURA CONGELADA.** No modelo operacional de hoje, **"comunicada" = `CONTATO_INICIADO` = a paciente declarou que iniciou o contato com o profissional.**
> **Autoridade:** a arquitetura implementada e congelada (F2, F4, F8) — não é escolha deste documento.
> **Consequência:** a janela reversível vai da confirmação até essa declaração, e **é ela quem a fecha**.

## 3.4 · Por que esta definição é boa — e por que ainda assim é frágil

**É arquitetonicamente melhor do que a fronteira B proposta na Fase 9**, por três razões:

**A paciente controla o próprio ponto de não-retorno.** Nenhum ato nosso encurta a janela dela. É a expressão mais literal possível de **P1** (a decisão pertence a ela).

**Não finge verificar o inverificável.** O código diz que não verifica; a interface diz "você registrou". **Nenhuma mentira em nenhum ponto.**

**A irreversibilidade é consequência material pura, nunca punição** (SD-P5): depois que ela falou com alguém, desfazer envolve uma terceira pessoa — e isso é verdade do mundo, não regra nossa.

**E é frágil por uma razão só:** **depende de Q-D1.** Se a Aliviar passar a intermediar, o sujeito de `CONTATO_INICIADO` muda, e com ele muda quem fecha a janela — de ela para nós. **Seria uma perda de autonomia**, e a decisão precisa ser tomada sabendo disso.

## 3.5 · O que fica pendente

**Apenas a linguagem da janela, e apenas por causa de Q-D1.** Enquanto D1 não for decidida, a Sala não pode explicar a janela em termos de "até falarmos com ele" (falso hoje) nem se comprometer com o modelo atual como se fosse definitivo. **Formulação honesta emitível hoje:** *"enquanto você não tiver falado com [nome], pode trocar aqui mesmo."* — verdadeira, verificável, e com dono (a própria paciente).

---

# 4 · Reversibilidade

## 4.1 · O que está decidido

| Antes de `CONTATO_INICIADO` | Depois |
|---|---|
| **A escolha pode ser trocada por outro dos três** — evento `CORRECAO_ESCOLHA`, executado por ela (F4, F5, F6) | **A troca é impossível no sistema** — *trigger* bloqueia |
| A escolha original **não é apagada**: fica na sequência de eventos (F5) | idem — o histórico é imutável |
| Nenhum terceiro precisa ser informado | **Há uma pessoa que já foi procurada** |
| Não requer mediação humana | **Requer mediação humana — e ela não está definida** (Q-D1, Q4, Q5) |

**Limite absoluto (F7):** a troca só pode recair sobre **um dos três da entrega**. Escolher fora dos três é impossível — e é assim que deve ser: fora dos três não é correção, é **nova Curadoria**.

## 4.2 · Os seis atos, deliberadamente distintos

| Ato | O que é | Possível hoje? | Quem executa | Marco limitante |
|---|---|---|---|---|
| **Mudar de preferência** | mudar de ideia internamente | sempre — não é evento | ela | nenhum |
| **Corrigir a escolha** | trocar por outro dos três | **sim**, até `CONTATO_INICIADO` | **ela** (F6) | F4 |
| **Cancelar o encaminhamento** | desfazer o que foi posto em marcha | **não existe** — não há encaminhamento no domínio (F9) | — | **bloqueado por Q-D1** |
| **Substituir o profissional** *fora dos três* | trocar por alguém não curado | **não** (F7) | — | é reabertura, não correção |
| **Voltar à Mesa** | rever a comparação | sim, sempre | ela | nenhum |
| **Reabrir a Curadoria** | novo entendimento, nova busca | sim — via `NONE_OF_THEM` ou por conversa | ela + Curador | §10 |
| **Desfazer uma comunicação recebida** | fazer com que alguém desconheça | **impossível, por natureza** | — | — |

**A última linha é a mais importante do Contrato.** Uma comunicação recebida **não é desfazível por nenhum sistema**. O que existe depois dela é **explicação a uma pessoa** — e isso é trabalho humano, não funcionalidade. **Qualquer promessa de "desfazer" depois de C4′ é falsa por natureza, não por limitação técnica.**

## 4.3 · O que a paciente vê

**Antes:** que pode trocar ali mesmo, sem falar com ninguém, sem justificar. **A interface atual já oferece isso** — e **não pergunta "tem certeza?"** (coerente com SD-N2).
**Depois:** **não** *"não é mais possível"*. E aqui está a lacuna: a Fase 9 (§6.3) exige dizer **o que passa a ser necessário** — mas **quem trata disso não está definido** (Q4 para o modelo mediado, Q5 para o prazo). **Hoje, honestamente: nada pode ser prometido além de que existe uma pessoa a quem escrever** — e enquanto Q9/Q5 estiverem abertas, nem o nome dela é afirmável.

## 4.4 · Como a outra pessoa afetada é tratada

**Questão sem dono, e é uma lacuna real.** Se a paciente corrige a escolha **depois** de ter contatado, alguém foi procurado e depois preterido. O domínio não representa isso (F9 — não há nada do lado do profissional). **A pergunta — se o profissional preterido é informado, por quem, e com que palavras — pertence a Q-D1 e à Operação.** Não é inventável aqui, e **é uma questão de dignidade profissional, não de UX.**

> **A frase "a decisão é reversível" permanece PROIBIDA sem condição explícita.** A única formulação verdadeira hoje é condicional e nomeia o marco: ***"enquanto você não tiver falado com [nome], pode trocar aqui mesmo."***

---

# 5 · Escolha e autorização

## 5.1 · Validação da decisão da Fase 9

A Fase 9 (§3, SD-P3) decidiu **manter escolha e autorização num único ato**, para não produzir segunda confirmação.

> **VALIDADA — e reforçada pelo domínio.** No modelo implementado, **o ato autoriza notavelmente pouco**: registra a escolha e cria o vínculo. Não dispara contato, não toca agenda, não transmite nada a terceiros. **Um ato tão contido não justifica ser fatiado em dois** — e a Fase 9 acertou por razão de experiência aquilo que o domínio já garantia por escassez de efeitos.
> **Ressalva:** se Q-D1 decidir pela mediação, **o ato passará a autorizar contato com um terceiro em nome dela**, e a validação precisa ser reexaminada — porque aí ele deixa de ser contido.

## 5.2 · O que o ato autoriza, item por item

| Autorização | Hoje | Fundamento |
|---|---|---|
| **registrar a escolha** | ✅ **sim** | é o próprio ato (F1, F2) |
| **avisar o Curador** | ⚠️ **não há aviso; há visibilidade** | o Curador **lê** por RLS (F6). **Ninguém é notificado** — é acesso, não notificação |
| **avisar o Concierge** | ⛔ **não** | nenhuma autoridade nem canal (F6) — **Q9** |
| **contatar o profissional** | ⛔ **não** | a Aliviar não contata (F8) — **Q-D1** |
| **transmitir dados da paciente** a terceiro | ⛔ **não** | nada sai do sistema hoje |
| **transmitir a formulação do trade-off** ao profissional | ⛔ **não** — e §12 recomenda que continue assim | **Q6** |
| **consultar disponibilidade** | ⛔ **não existe** | F9 |
| **reservar horário** | ⛔ **não existe** | F9 |
| **iniciar acompanhamento** | ⛔ **não existe** | F6, F9 — **Q9** |

**A conclusão desta seção, e é forte:** **o ato de confirmar autoriza, hoje, exatamente duas coisas — registrar a escolha e tornar essa escolha legível ao Curador do caso.** Tudo o mais que os documentos de experiência descrevem **não está autorizado porque não existe.**

**Sobre a distinção aviso × visibilidade.** O Curador **não é avisado**: ele **pode ver**. A diferença é operacionalmente enorme — visibilidade sem notificação significa que **ninguém necessariamente saberá que ela decidiu** até olhar. Isto invalida diretamente a frase de A_DECISAO §5.2 (*"o Curador foi avisado"*) — não por imprecisão de linguagem, como a Fase 9 supôs, **mas porque não há aviso algum.** Ver patch **P-1**.

## 5.3 · Consentimento e privacidade — perguntas, não conclusões

**Nenhuma conclusão jurídica é emitida aqui.** As perguntas que a confirmação levanta:

**A confirmação constitui autorização para contato com terceiro?** Hoje é vazia (nada sai). Sob mediação, deixa de ser — e provavelmente exige consentimento **específico e informado**, não presumido. **Q8.**
**A leitura da nota pelo Curador foi informada a ela?** A nota é legível pelo Curador e pelo administrador (Q6) — e **a Fase 9 §3 afirmou que a frase existe "para ela, e só ela"**. **Há divergência entre o que o documento diz e o que o sistema faz.** Ver §12 e **P-7**.
**Que dados poderiam ser transmitidos ao profissional, sob mediação?** Minimização (§12) — mas **a decisão é de Privacidade.**

---

# 6 · Eventos e estados operacionais

## 6.1 · Legenda de existência

**[E]** existe no domínio · **[P]** parcial · **[N]** não existe — depende de decisão

## 6.2 · O catálogo

### `decisao_confirmada` **[E]**
**Produz:** a paciente. **Quando:** ato deliberado na Sala. **Pré:** entrega final publicada; ela é a paciente do caso (RLS). **Dados:** caso, seleção curada, `outcome` (`CHOSEN`|`NONE_OF_THEM`), opção escolhida, nota opcional. **Efeitos:** nenhum externo. **Seguinte:** `decisao_registrada`. **Falhas:** conflito de unicidade — **tratado com idempotência** (retry seguro, `repository.ts:481`). **Pode afirmar:** *"sua decisão está registrada"*. **Não pode:** nada sobre terceiros.

### `decisao_registrada` **[E]**
**Produz:** o sistema. **Quando:** imediatamente. **Efeitos:** cria `connection_records` em `DECISAO_REGISTRADA` e o evento correspondente, **numa transação** (`create_connection_with_event`). **Seguinte:** `contato_declarado_pela_paciente` · `alteracao_executada` · terminais. **Pode afirmar:** que está guardado, e **que ela pode trocar enquanto não tiver falado com o profissional**. **Não pode:** que alguém saiba.

### `aviso_despachado` **[N]** · `aviso_recebido` **[N]** · `aviso_lido` **[N]**
**Nenhum existe.** Há **visibilidade por RLS**, não notificação (§5.2). **Conceitualmente distintos e não fundíveis**: despachar é ato do sistema; receber é do canal; ler é de uma pessoa — e **só o terceiro significa algo para a paciente**. **Nada pode ser afirmado sobre nenhum deles.** Bloqueados por **Q-D1/Q5**.

### `contato_profissional_solicitado` **[N]** · `profissional_contatado` **[N]**
**Não existem.** No modelo atual, quem contata é ela. Bloqueados por **Q-D1**. *(Renomeio proposto no modelo atual: veja o próximo.)*

### `contato_declarado_pela_paciente` **[E]** — hoje `CONTATO_INICIADO`
**Produz:** **a paciente**, por declaração (F8). **Pré:** `DECISAO_REGISTRADA`. **Efeitos:** **fecha a janela de correção** (F4) — é o evento mais consequente de todo o ciclo. **Seguinte:** `PRIMEIRO_ATENDIMENTO_REALIZADO` · `ENCERRADO_SEM_RELACIONAMENTO`. **Falhas:** contatar sem declarar; declarar sem contatar. **Pode afirmar:** *"você registrou que iniciou o contato"*. **Não pode:** que o profissional soube, respondeu ou está disponível.
> **Nome inadequado.** `CONTATO_INICIADO` não diz **por quem**, e essa omissão é exatamente a que produziu a divergência D1 na leitura dos documentos. **Renomeio conceitual proposto: `CONTATO_DECLARADO_PELA_PACIENTE`.** *(Proposta documental; renomear em banco é decisão de engenharia fora desta fase.)*

### `disponibilidade_confirmada` **[N]** · `profissional_indisponivel` **[N]**
**Não existem** (F9). **Consequência dura:** o cenário de indisponibilidade posterior — modelado em detalhe em A_SALA §8.3 e E11 — **não tem nenhuma representação operacional.** Ver §10. Bloqueados por **Q-D1/Q3**.

### `encaminhamento_autorizado` **[P]** · `encaminhamento_iniciado` **[N]**
O primeiro **é** a confirmação, no sentido restrito de §5.2 — **e nada mais**. O segundo não existe. **Nunca afirmar encaminhamento.**

### `alteracao_solicitada` **[N]** · `alteracao_executada` **[E]** — `CORRECAO_ESCOLHA`
Não há **solicitação** porque não há mediação: **ela executa diretamente** (F6). Sob mediação (Q-D1), os dois passam a ser necessários e distintos. **Pré:** `DECISAO_REGISTRADA` **e** o novo profissional pertencer aos três (F7). **Efeitos:** troca o profissional **sem apagar a escolha anterior** (F5). **Pode afirmar:** que a troca foi feita. **Não pode:** que alguém foi informado da troca.

### `retorno_curadoria_solicitado` **[P]**
Existe como **desfecho** (`NONE_OF_THEM`, F1), **não como fluxo**: nada notifica o Curador nem abre nova rodada. **Ver §10 e SD-O9.**

### `acompanhamento_assumido` **[N]**
**Não existe** — nenhuma autoridade, nenhum canal, nenhum registro do Concierge no pós-decisão (F6). **Nunca afirmar que o acompanhamento começou.** Bloqueado por **Q9**.

### `ENCERRADO_SEM_RELACIONAMENTO` **[E]** *(existe no domínio e nenhum documento de experiência o menciona)*
**Produz:** a paciente (*"o contato não avançou"*). **Efeito:** terminal. **Achado documental:** as Fases 7–9 **não preveem este desfecho** — a possibilidade de a conexão simplesmente não vingar. **É um desfecho legítimo e implementado, sem tratamento de experiência.** Ver patch **P-8**.

---

# 7 · Matriz de autoridade

**Legenda:** **D** decide · **X** executa · **I** informado · **A** pode alterar · **R** responde por falha · **P** pode prometer · **—** nenhum papel · **⛔** não existe hoje

| Evento / decisão | Sistema | Curador | Concierge | Profissional | Operação | Direção | Clínico | Jurídico/Priv. | **Paciente** |
|---|---|---|---|---|---|---|---|---|---|
| Confirmar a escolha | X | — | — | — | — | — | — | — | **D, A, P** |
| Registrar a decisão | **X, R, P** | — | — | — | — | — | — | — | I |
| Ver que ela decidiu | X | **I** (por leitura) | ⛔ | — | — | — | — | — | — |
| Corrigir a escolha | X | I | — | — | — | — | — | — | **D, X, A** |
| Declarar contato iniciado | X | I | — | — | — | — | — | — | **D, X** |
| Declarar 1º atendimento | X | I | — | — | — | — | — | — | **D, X** |
| Encerrar sem relacionamento | X | I | — | — | — | — | — | — | **D, X** |
| **Contatar o profissional** | ⛔ | ⛔ | ⛔ | — | ⛔ | **D (Q-D1)** | — | I | **X, hoje** |
| **Reservar horário** | ⛔ | ⛔ | ⛔ | **D** | ⛔ | D (Q3) | — | I | — |
| **Responder dúvida sobre eles** | — | **X, R, P** | — | — | D (Q5) | — | — | — | D (pergunta) |
| **Conversar / companhia** | — | — | **X, R** | — | **D (Q9,Q5)** | — | — | — | D (pede) |
| **Assumir acompanhamento** | ⛔ | — | X (Q9) | — | **D** | — | — | — | I |
| **Comprometer prazo** | — | — | — | — | **D, R, P (Q5)** | I | — | — | I |
| Reabrir a Curadoria | ⛔ | **X** | — | — | D | — | — | — | **D (pede)** |
| **Urgência / piora** | — | — | I | — | I | D | **D, R, P (Q7)** | I | D (declara) |
| **Efeitos jurídicos** | — | — | — | I | I | D | — | **D, R (Q8)** | I |
| **Ler a formulação dela** | X | **I hoje** | ⛔ | ⛔ | — | — | — | **D (Q6)** | **D (escreve)** |

**Três leituras que a matriz torna visíveis:**

**A coluna da paciente é a mais preenchida do pós-decisão.** Ela decide **e executa** quase tudo. Isso é fidelidade a **P1** levada às últimas consequências — **ou** é ausência de serviço. **Qual das duas é a pergunta Q-D1.**

**A coluna do Concierge está vazia.** Ele não decide, não executa, não é informado, não pode prometer. **O papel mais presente nas Fases 7 a 9 é o único sem nenhuma autoridade operacional.**

**A coluna "Operação" só aparece em linhas pendentes.** Toda promessa de prazo, conversa e acompanhamento depende de um papel que ainda não tem definição — o que confirma **Q5 como a maior lacuna depois de D1**.

---

# 8 · Contato com o profissional

## 8.1 · As alternativas, avaliadas

| Alternativa | Privacidade | Velocidade | Expectativa | Reversibilidade | Carga operacional | Risco de indisponibilidade | Honestidade possível |
|---|---|---|---|---|---|---|---|
| **A1 — antes da escolha** (sondar os três) | ⛔ **pior**: expõe que ela está escolhendo, a três pessoas | alta na decisão | cria expectativa em **dois que não serão escolhidos** | alta | 3× por caso | **mínimo** — sabe-se antes | *"confirmamos com os três"* |
| **A2 — após a confirmação, automático** | boa | alta | alta e imediata | **encurta a janela dela** | alta e não modulável | médio | *"falamos com ele"* |
| **A3 — após revisão humana** | boa | média | alta | preserva janela maior | média, com fila | médio | *"vamos falar com ele"* — **exige Q5** |
| **A4 — só com autorização adicional** | **melhor** | baixa | controlada | **máxima** | média | alto (demora) | honesta, mas **exige 2º ato** — colide com SD-P3 |
| **A5 — consulta sem identificar a paciente** | **melhor** | média | **nenhuma no profissional** | máxima | média | médio | *"checamos disponibilidade, sem dizer quem"* |
| **A6 — contato já identificado** | menor | alta | máxima | mínima | alta | médio | *"falamos com ele sobre você"* — **exige consentimento (Q8)** |
| **A0 — a paciente contata** *(vigente)* | **máxima**: nada sai | depende dela | criada **por ela** | **máxima — ela controla** | **nenhuma** | descoberto por ela, sozinha | *"você registrou que iniciou o contato"* |

## 8.2 · Leitura, sem escolher

**Não escolho, e registro por quê: escolher aqui seria decidir Q-D1**, que é da Direção, e seria exatamente o que a §RESTRIÇÕES proíbe — não escolher silenciosamente a alternativa mais conveniente para o software.

**O que a análise mostra, honestamente:**

**A0 (vigente) é a melhor em privacidade, reversibilidade e carga — e a pior em cuidado.** Ela descobre sozinha se o profissional não atende mais, sem ninguém ao lado. **É exatamente o cenário que A_DECISAO §10 diz que nunca deve acontecer** (*"avisa imediatamente, assume como falha nossa"*). **Este é o argumento mais forte a favor de mudar D1** — não é preferência de produto, é um princípio já escrito sendo violado pela operação atual.

**A5 é a única que reduz indisponibilidade sem criar expectativa nem expor a paciente**, e merece exame prioritário se D1 caminhar para mediação.

**A4 colide com SD-P3** (uma decisão, um ato) e reintroduziria a segunda confirmação que a Fase 9 rejeitou.

**A1 deve ser descartada por princípio, não por operação:** sondar três para escolher um cria expectativa em duas pessoas que serão preteridas, e trata profissionais como recurso a consultar. **Incompatível com a dignidade que o Método atribui a eles.**

---

# 9 · Reserva e disponibilidade

## 9.1 · Os sete graus, e o que existe hoje

| Grau | Significado | Existe hoje? |
|---|---|---|
| **listado como disponível** | o profissional está publicado e é elegível | **✅ sim** — via publicação e entrega (F7) |
| **disponibilidade informada anteriormente** | ele **declarou** prática de acesso/agenda, com data | **✅ sim** — Base de Evidências, com proveniência e validade |
| **disponibilidade consultada** | alguém perguntou a ele, agora | ⛔ **não** |
| **disponibilidade confirmada** | ele respondeu que sim, para este caso | ⛔ **não** |
| **horário sugerido** | uma data foi proposta | ⛔ **não** |
| **horário reservado** | uma data está segurada para ela | ⛔ **não** |
| **consulta marcada** | há compromisso das duas partes | ⛔ **não** |

**Existem os dois primeiros. Os cinco últimos não existem** (F9).

**E há uma distinção que a Sala precisa saber:** o segundo grau é **declaração datada e possivelmente vencida**, não disponibilidade atual. A Política de Fontes trata acesso/agenda como **volátil, com revisão de três meses** — por isso **O9** existe. *"Ele atende de manhã"* é sempre *"ele declarou, em [data], que atende de manhã"*.

## 9.2 · A regra

> **Proibido, com autoridade deste Contrato e sem depender de nenhuma pendência:** *"seu profissional está garantido"* · *"sua consulta está reservada"* · *"está tudo certo"* · *"ele está te esperando"* · qualquer verbo de garantia sobre agenda.
> **Fundamento:** não existe evento verificável nem autoridade correspondente. **Nenhuma decisão futura torna essas frases emitíveis sem antes criar o evento que as sustente.**

---

# 10 · Indisponibilidade posterior

| Pergunta | Resposta | Fundamento |
|---|---|---|
| A decisão continua registrada? | **Sim.** Nada a apaga; o histórico é imutável | F5 |
| Ela volta à Mesa com as alternativas preservadas? | **Sim** — a entrega final não é alterada | F7 |
| As alternativas continuam válidas? | **Como seleção, sim. Como informação, depende da data** — podem precisar de reconferência | O9 |
| O Curador precisa reavaliar? | **Sim, se o motivo tocar o Perfil.** Se for só agenda, não | A_DECISAO §4.3 |
| Nova Curadoria é necessária? | **Só se o Perfil mudar** — e **SD-O9** exige justificativa registrada se não mudar | SD-O9 |
| O sistema pode sugerir outra pessoa? | **NÃO, jamais.** | **N1, N2, P2** |
| Quem comunica? | ⛔ **Não definido — e hoje ninguém.** Ver abaixo | Q-D1 |
| Como impedir que ela leia como erro seu? | linguagem de §8.3 da Sala: a falha é de **atualidade da informação**, e é nossa | SD-O8, SD-N12 |

**Sobre não sugerir automaticamente a "segunda colocada":** **não há colocação** — os três são caminhos legítimos sem ordem (**P2**). O sistema restaurar uma alternativa seria **criar uma ordem que o Método recusa**, e nem sequer é possível: a correção é ato dela (F6).

**A lacuna crítica, dita sem suavização.** **Hoje ninguém comunica indisponibilidade, porque ninguém a descobre.** Não há consulta de disponibilidade (F9) e não há contato pela Aliviar (F8). **A paciente descobre sozinha, ao ligar.** É o cenário que A_DECISAO §10 proíbe expressamente (*"deixá-la descobrir"* está na coluna do que **nunca** se faz) — **e é o comportamento atual do sistema.**

> **DIVERGÊNCIA D2, derivada de D1:** o princípio *"avisa imediatamente, assume como falha nossa, e o Curador retoma antes de ela pedir"* **não é cumprível pela operação atual.** Ou D1 muda, ou A_DECISAO §10 deve deixar de prometê-lo. **Não é aceitável manter os dois.**

---

# 11 · Prazos e compromissos humanos

**Nenhum prazo é inventado aqui.** Mapa dos pontos que dependem de pessoa:

| Ponto | Responsável | Canal | Horário | Prazo | Fora do horário | Escalonamento | Linguagem antes | Após o prazo | Se ninguém responde |
|---|---|---|---|---|---|---|---|---|---|
| **Dúvida sobre eles** | **Curador do caso** *(único definido)* | ⛔ **Q10** | ⛔ **Q5** | ⛔ **Q5** | ⛔ | ⛔ | *"sua pergunta foi para [nome]"* | ⛔ | ⛔ |
| **Quero conversar** | Concierge *(sem autoridade — Q9)* | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | *"[nome] vai falar com você"* — **só se o nome existir** | ⛔ | ⛔ |
| **Contato com o profissional** | ⛔ **Q-D1** | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | **nada afirmável** | — | — |
| **Indisponibilidade** | ⛔ **Q-D1/D2** | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | **nada afirmável** | — | — |
| **Retorno após "nenhum dos três"** | Curador | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | *"vamos entender melhor"* | ⛔ | ⛔ |
| **Urgência** | ⛔ **Q7** | ⛔ | ⛔ | ⛔ | ⛔ **crítico** | ⛔ | *"a Curadoria não atende urgência"* | — | — |

**O que a tabela demonstra:** **um único responsável está definido** (o Curador, para dúvidas sobre o caso) — e mesmo para ele não há canal, horário nem prazo.

> **Consequência normativa: nenhuma frase com "quando" pode ser dita à paciente hoje.** Não por escolha de tom — por ausência de compromisso. **Prazo sem capacidade operacional é promessa falsa**, e a linguagem permitida é a que nomeia **quem**, nunca **quando**.
> A linha da **urgência fora do horário** é a única cuja indefinição é **risco de segurança**, não de experiência.

---

# 12 · Privacidade e contexto transmitido

## 12.1 · A formulação do trade-off — o achado

**A Fase 9 §3 afirma que a frase existe "para ela, e só ela".** O sistema armazena-a em `patient_curadoria_decisions.note`, e a política `patient_decisions_select_own_or_team` **a torna legível pela paciente, pelo Curador do caso e pelo administrador**.

> **DIVERGÊNCIA D3: o documento afirma privacidade que o sistema não implementa.** Não é violação — é ausência de decisão informada. **Impacto:** ela pode escrever supondo intimidade algo que o Curador lerá. **Correção mínima:** ou o documento passa a dizer a verdade (a nota é lida pela equipe do caso), ou a decisão de privacidade restringe o acesso. **Q6 — Direção + Privacidade.** Ver patch **P-7**.

**Recomendação deste Contrato, para exame:** **manter legível ao Curador do caso e dizê-lo a ela** — a frase ajuda a cuidar melhor, e o custo é uma linha de honestidade no convite. **O que não deve acontecer é ela não saber.**

**Deve ser armazenada?** **Sim** — é o antídoto do arrependimento (A_DECISAO §6) e só serve se durar.
**Pode ser transmitida ao profissional?** **Não, e a recomendação é que nunca seja.** É reflexão privada sobre uma escolha entre pessoas, e uma delas é ele. **Transmiti-la seria mostrar-lhe o que ela abriu mão ao escolhê-lo.**
**É dado operacional ou reflexão privada?** **Reflexão privada com utilidade operacional lateral** — e essa ordem importa: a finalidade é dela; qualquer uso pela equipe é subordinado.

## 12.2 · Minimização por papel

| Papel | Recebe | **Nunca recebe** |
|---|---|---|
| **Curador** (dúvida sobre eles) | o caso, quem ela considerava, a prioridade em questão, o estado e a data da informação | leitura emocional; tempo de decisão; número de visitas |
| **Concierge** (quero conversar) | **o mínimo**: que ela quer conversar, e o caso | **nada** que sugira insegurança; nenhuma métrica de comportamento; **nem o motivo, se ela não o disse** |
| **Profissional** | o necessário para atender — a definir sob D1 | **a formulação do trade-off**; as prioridades ordenadas; a comparação; a existência dos outros dois |
| **Administrador** | o operacional para responder por falhas | idem ao Curador |

**A regra:** *cada papel recebe apenas o que precisa para cumprir sua responsabilidade — e "quero conversar" não transporta diagnóstico.*
**A proibição estrutural (P5, SD-N6):** **nenhum papel recebe classificação emocional**, porque nenhuma existe e nenhuma pode ser criada — nem por inferência do sistema, nem por campo preenchido por pessoa.

---

# 13 · Concierge

## 13.1 · Os sete momentos, deliberadamente distintos

| Momento | Definição | Existe? |
|---|---|---|
| **Alcançável** | há uma porta que leva a ele | ⚠️ **exigida** pela Mesa e pela Sala (O5); **sem destino implementado** |
| **Recebe solicitação** | um pedido chega a uma pessoa | ⛔ **Q10** — não há canal |
| **Responde** | uma pessoa fala com ela | ⛔ **Q5** — sem prazo nem horário |
| **Assume responsabilidade** | passa a ser o ponto de contato | ⛔ **Q9** |
| **Inicia acompanhamento** | trabalho contínuo | ⛔ — nenhum registro (F6) |
| **Oferece companhia** | consolo, sem informação | conceitual (A_DECISAO §8) |
| **Devolve ao Curador** | quando a questão é sobre o caso | conceitual (A_DECISAO §3) |

> **Presença, resposta e assunção são três eventos, e hoje nenhum dos três tem implementação.**

## 13.2 · Resolução do conflito 0.2

**A contradição:** A_DECISAO §8 diz que o Concierge entra *"no instante da decisão — não antes"*; O5 exige a porta dele na Mesa, que é anterior.

> **Resolução proposta (ratifica a correção 0.2 da Fase 9):** **alcançável desde a Mesa** — a porta existe e leva a uma pessoa quando ela a procura; **assume o acompanhamento no instante da decisão** — apresentado nominalmente pelo Curador (SD-O10).
> **Fundamento:** é a menor correção que preserva os dois requisitos sem enfraquecer nenhum, e distingue **estar disponível** de **ser responsável** — que nunca foram o mesmo.
> **Autoridade:** Operação (**Q9**). **Enquanto não ratificada, a porta "quero conversar" não tem destino, e nenhuma expectativa de resposta pode ser criada** — o que hoje é um risco real: uma porta que não leva a lugar nenhum é pior que porta nenhuma.

## 13.3 · Quando ele não tem autoridade para responder

**Sobre o caso, os três, a informação** → devolve ao Curador (A_DECISAO §3).
**Sobre disponibilidade, agenda, prazo** → **não afirma nada** (§9, §11).
**Sobre "qual você escolheria?"** → **não responde** — *"eu não conheço a sua vida como você conhece"* (A_DECISAO §8).
**Sobre qualquer coisa clínica** → **nunca**, e é a mais dura: **encaminha a quem tem autoridade clínica (Q7)**.

---

# 14 · Urgência e piora clínica

## 14.1 · O mínimo operacional seguro que já tem autoridade

Quatro afirmações emitíveis **hoje**, todas de escopo institucional (Direção) e nenhuma clínica:

**A Curadoria não atende urgência.** Declaração de escopo — a Direção pode fazê-la.
**A experiência contemplativa recua** diante de indicação de piora. Consequência de A_DECISAO §10.1.
**Telefone precede formulário**, quando houver telefone.
**O estado documental não se perde** — nada é apagado, confirmado ou revertido por este caminho; **e nenhum efeito operacional é disparado por ele.**

## 14.2 · O que exige responsável clínico — e não pode ser inferido por design

**Sinais ou critérios** que caracterizam piora ou urgência · **números e canais** a indicar · **encaminhamentos** (que serviço, em que situação) · **linguagem** exata da orientação · **registro** (se há dever de registrar o relato) · **retorno à jornada** (quando é adequado retomar, e quem julga) · **responsabilidade fora do horário** — *a mais crítica de todas, porque é quando a ausência de definição tem consequência real.*

> **Nenhum conteúdo clínico é aprovado por inferência de design.** Enquanto **Q7** estiver aberta, a Sala faz o que pode — encurta ao máximo o caminho até uma pessoa da Aliviar e diz que a Curadoria não atende urgência — **e não emite orientação de encaminhamento.**
> **Esta é a única pendência do Contrato cujo risco é a segurança de uma pessoa, e por isso não deve esperar a ordem de dependência de §2.**

---

# 15 · Efeitos jurídicos e consentimento

*Perguntas para validação especializada. **Nenhuma conclusão jurídica é emitida, nenhum termo é redigido.***

**J1 · Autorização para contato.** A confirmação autoriza a Aliviar a contatar um terceiro em nome dela? Hoje a questão é vazia (nada sai); **sob mediação, deixa de ser** — e provavelmente exige consentimento específico, não presumido. *(depende de Q-D1)*

**J2 · Compartilhamento de dados.** Que dados podem ser transmitidos ao profissional, com que base legal, e o que a paciente precisa saber antes?

**J3 · Expectativa de contratação.** A confirmação cria expectativa jurídica de atendimento — para ela, para ele, ou nenhuma? **A linguagem de cuidado que o Método exige pode, involuntariamente, criar ou encobrir vínculo.**

**J4 · Ausência de garantia de agenda.** Não havendo reserva (F9), **como isso é dito sem parecer isenção defensiva?** É o ponto de maior atrito entre linguagem jurídica e linguagem de cuidado.

**J5 · Papel da Aliviar na relação.** Curadoria, indicação, intermediação ou plataforma? **Q-D1 muda a resposta**, e a resposta muda o regime aplicável.

**J6 · Registro probatório.** O histórico imutável de eventos (F5) serve como prova de quê, e para quem?

**J7 · Retenção.** Por quanto tempo se guardam decisão, nota e Curadoria — e o que acontece se ela pedir exclusão? **Cruza com a imutabilidade append-only já implementada**, e essa tensão é real.

**J8 · Revogação.** Depois de `CONTATO_INICIADO`, o sistema impede a troca (F4). **Isso é aceitável juridicamente, ou existe direito de revogar que a arquitetura estaria impedindo?** — **a pergunta mais importante desta seção**, porque a resposta pode exigir mudança de *trigger*, não de texto.

**J9 · Consentimento para leitura da nota.** Ela precisa ser informada de que a equipe do caso lê sua frase? *(cruza com Q6, D3)*

---

# 16 · Decisões, pendências e bloqueios

## 16.1 · Decisões registradas

| # | Decisão | Classificação | Autoridade | Fundamento | Afeta | Consequência operacional | Consequência para a experiência |
|---|---|---|---|---|---|---|---|
| **D-01** | **"Comunicada" = a paciente declarou ter iniciado o contato** | `DECIDIDA COM CONDIÇÃO` *(condição: Q-D1)* | arquitetura congelada | F2, F4, F8 | A_SALA §6, §17.4 · SD-N5 | nenhuma mudança | a janela reversível é fechada **por ela** |
| **D-02** | **A correção da escolha é possível até esse marco, e impossível depois** | `DECIDIDA` | arquitetura congelada (*trigger*) | F4 | A_DECISAO §8 · A_MESA §2 · A_SALA §6 | já implementado | a frase honesta de §3.5 torna-se emitível |
| **D-03** | **Só a paciente pode corrigir a escolha** | `DECIDIDA COM CONDIÇÃO` *(Q-D1 pode exigir mediação)* | arquitetura congelada (RLS) | F6 | A_SALA §6.3, Q4 | Curador/Concierge não executam | autonomia máxima; **e nenhum socorro humano** |
| **D-04** | **A troca só recai sobre os três da entrega** | `DECIDIDA` | arquitetura congelada (*trigger*) | F7 | A_SALA §10 | já implementado | fora dos três é **reabertura**, não correção |
| **D-05** | **Não existe reserva, agenda ou disponibilidade confirmada** | `DECIDIDA` (por ausência) | constatação | F9 | A_SALA §8, §9 | nada a fazer | **§9.2 é proibição imediata e permanente** |
| **D-06** | **A confirmação autoriza apenas registrar e tornar legível ao Curador** | `DECIDIDA` | constatação | F6, §5.2 | A_SALA §14.2 | — | derruba as promessas de contato/encaminhamento |
| **D-07** | **O Curador não é avisado; ele tem visibilidade** | `DECIDIDA` | constatação | F6 | A_DECISAO §5.2 | ninguém é notificado | **patch P-1 é obrigatório** |
| **D-08** | **Nenhuma frase com "quando" é emitível hoje** | `DECIDIDA` | consequência de §11 | Q5 aberta | A_SALA §8.2, §11 | — | linguagem nomeia **quem**, nunca **quando** |
| **D-09** | **"Nenhum dos três" é desfecho de primeira classe** | `DECIDIDA` | arquitetura congelada | F1 | A_SALA §10 | já implementado | **P4 é verdade também no banco** |
| **D-10** | **Concierge: alcançável desde a Mesa; assume na decisão** | `PENDENTE DE OPERAÇÃO` *(proposta)* | Operação (Q9) | §13.2 | A_DECISAO §8 · O5 | precisa canal e escala | resolve o conflito 0.2 |
| **D-11** | **A formulação do trade-off nunca é transmitida ao profissional** | `DECIDIDA COM CONDIÇÃO` *(ratificar em Q6)* | este Contrato + Privacidade | §12.1 | A_SALA §7 | — | protege a intimidade da frase |
| **D-12** | **O sistema nunca sugere substituto** | `DECIDIDA` | N1, N2, P2 | §10 | A_SALA §8.3 | — | não há colocação a restaurar |

## 16.2 · Pendências e bloqueios

| # | Questão | Classificação | Dono sugerido | Decisão necessária | Bloqueia |
|---|---|---|---|---|---|
| **Q-D1** | **a Aliviar intermedia o contato?** | `PENDENTE DE OPERAÇÃO` **(raiz)** | **Direção** + Curadoria, Jurídico, Privacidade | manter auto-serviço ou passar a mediar | **§8 inteira da Sala** · E10–E12 · SD-O8/O10 · Q2, Q3, Q5, Q8, Q9 · promessas de contato, disponibilidade, encaminhamento, acompanhamento |
| **Q7** | política de urgência | `PENDENTE CLÍNICA` **(prioridade máxima por risco)** | Direção + resp. técnica clínica | critérios, canais, encaminhamento, linguagem, fora do horário | §14 · toda orientação de urgência |
| **Q5** | prazos e canais humanos | `PENDENTE DE OPERAÇÃO` | Operação | responsável, canal, horário, prazo, contingência | **toda frase com "quando"** · E10 · §11 |
| **Q9** | quando o Concierge assume | `PENDENTE DE OPERAÇÃO` | Operação | ratificar D-10 e criar o canal | porta "quero conversar" · SD-O10 |
| **Q10** | contexto transmitido | `BLOQUEADA POR Q9` | Operação + Privacidade | conteúdo exato, sem leitura emocional | §12.2 |
| **Q6/D3** | quem lê a formulação | `PENDENTE JURÍDICA/PRIVACIDADE` | Direção + Privacidade | restringir o acesso **ou** informá-la | A_SALA §3 · patch P-7 |
| **Q8/J1–J9** | efeitos jurídicos | `BLOQUEADA POR Q-D1` | Jurídico | as nove perguntas de §15 | linguagem do ato · **J8 pode exigir mudança de *trigger*** |
| **Q3** | reserva de agenda | `BLOQUEADA POR Q-D1` | Direção + Jurídico | se passa a existir | §9 · promessas de disponibilidade |
| **Q2** | momento do contato | `BLOQUEADA POR Q-D1` | Operação | qual alternativa de §8.1 | duração real da janela |
| **Q4** | autoridade para alterar | `DECIDIDA (D-03), reaberta se Q-D1 mudar` | Operação | — | §6.3 da Sala |
| **D2** | ninguém comunica indisponibilidade | `BLOQUEADA POR Q-D1` | Direção | mudar D1 **ou** corrigir A_DECISAO §10 | §10 · SD-O8 |

**Nenhum prazo é atribuído a nenhuma pendência** — não há autoridade para isso, e prazo inventado é a mesma falha que este Contrato existe para evitar.

---

# 17 · Patches documentais propostos

*Propostos, **não aplicados**. Nenhum altera princípio que não dependa destas decisões operacionais.*

| # | Documento · local | Texto/ideia atual | Problema | Correção mínima | Decisão que a sustenta |
|---|---|---|---|---|---|
| **P-1** | `A_DECISAO.md` §5.2 | *"ela sabe que o Curador foi avisado e o que ele fará"* | **Não há aviso** — há visibilidade (F6). Nem o fato nem a previsão são garantíveis | dizer que a decisão fica registrada e visível ao Curador do caso; **remover o aviso e a previsão de ação** | **D-07** |
| **P-2** | `A_DECISAO.md` §8 | Concierge diz *"que a decisão é reversível"* | promessa sem condição, no ponto mais frágil (conflito 0.1) | condicionar ao marco: *"enquanto você não tiver falado com ele, dá para trocar"* | **D-01, D-02** |
| **P-3** | `A_DECISAO.md` §8 | *"Quando entra. No instante da decisão — não antes."* | colide com O5 (porta na Mesa) | distinguir **alcançável** de **assume** | **D-10** *(pendente Q9)* |
| **P-4** | `A_DECISAO.md` §10 | *"avisa imediatamente, assume como falha nossa, e o Curador retoma antes de ela pedir"* | **não é cumprível**: ninguém descobre a indisponibilidade (D2) | marcar como **dependente de Q-D1**, ou reformular para o que a operação sustenta | **D2** |
| **P-5** | `A_DECISAO.md` §5.2 | *"a alternativa sai de cena no mesmo instante"* | "instante" indefinido (lacuna 0.4) | ancorar em `CONTATO_INICIADO`, não na confirmação | **D-01** |
| **P-6** | `A_MESA.md` §2 | recusa prometer reversibilidade | **estava certa, e agora pode ser precisa** | acrescentar que a troca é possível até ela declarar contato | **D-02** |
| **P-7** | `A_SALA_DA_DECISAO.md` §3 | *"Quem precisa compreender essa formulação? **Ela, e só ela.**"* | o Curador e o administrador leem a nota (D3) | dizer a verdade sobre quem lê, **ou** restringir o acesso | **Q6/D3** |
| **P-8** | `A_SALA_DA_DECISAO.md` §13 | 13 estados | falta `ENCERRADO_SEM_RELACIONAMENTO` — desfecho implementado e sem tratamento | acrescentar o estado "o contato não avançou" | **F2** |
| **P-9** | `A_SALA_DA_DECISAO.md` §8.1 | seis eventos, com *"profissional contatado — autoridade: pessoa da Aliviar"* | **descreve serviço inexistente** (D1) | marcar a seção inteira como **condicionada a Q-D1** | **Q-D1, D-06** |
| **P-10** | `A_SALA_DA_DECISAO.md` §16-Q1..Q4 | tratadas como abertas | **estão majoritariamente decididas** (F4, F6, F9) | substituir pelo estado revisto de §1 deste Contrato | **D-01..D-05** |
| **P-11** | `A_SALA_DA_DECISAO.md` §6.4 | *"quem trata de uma mudança de ideia (uma pessoa, com nome)"* | hoje **não há pessoa**: ela mesma executa (F6) | dizer que ela troca sozinha, e que depois do marco há uma pessoa a procurar | **D-03** |

---

# 18 · Vocabulário canônico

*Normativo. **O mesmo termo não pode designar eventos diferentes em documentos distintos.***

| Termo | Definição | O que **não** significa | Evento | Autoridade |
|---|---|---|---|---|
| **Preferência** | inclinação de gosto, interna | não é escolha nem intenção declarada | nenhum | ela |
| **Inclinação** | preferência já orientada a um nome, sem o custo aceito | **não é decisão**; nunca registrável | nenhum | ela |
| **Decisão formulada** | preferência com o custo nomeado | não é confirmação; **não autoriza nada** | nenhum | ela |
| **Confirmação** | ato deliberado de dizer à Aliviar que a decisão vale | não é registro; não é comunicação | `decisao_confirmada` | **ela, exclusivamente** |
| **Registro** | a Aliviar guardou a confirmação | **não é aviso a ninguém** | `decisao_registrada` | sistema |
| **Despacho** | o sistema enviou uma informação a alguém | não é recebimento nem leitura | ⛔ não existe | sistema |
| **Recebimento** | a informação chegou ao destino | não é leitura; **não significa que alguém sabe** | ⛔ não existe | canal |
| **Leitura** | uma pessoa leu | não é ação nem resposta | ⛔ não existe | a pessoa |
| **Comunicação** | **hoje:** a paciente declarou ter iniciado o contato | **não é** a Aliviar ter contatado (F8) | `CONTATO_INICIADO` | **ela** |
| **Contato** | interação efetiva com o profissional | não é disponibilidade nem agendamento | idem, por declaração | **ela, hoje** |
| **Disponibilidade** | condição do profissional de atender | **declaração datada ≠ disponibilidade atual** | parcial (Base de Evidências) | o profissional |
| **Reserva** | horário segurado para ela | **não existe** | ⛔ | — |
| **Encaminhamento** | pôr em marcha o primeiro atendimento | **não existe como ato da Aliviar** | ⛔ | — |
| **Acompanhamento** | trabalho contínuo do Concierge | **não existe** operacionalmente | ⛔ | Concierge (Q9) |
| **Reversão** | tornar sem efeito o que foi feito | **não é** correção; **comunicação recebida não é reversível** | — | — |
| **Alteração / Correção da escolha** | trocar por outro **dos três**, antes do marco | não apaga a escolha anterior (F5) | `CORRECAO_ESCOLHA` | **ela** |
| **Cancelamento** | encerrar sem relacionamento | não é reversão nem correção | `ENCERRADO_SEM_RELACIONAMENTO` | **ela** |
| **Reabertura da Curadoria** | novo entendimento e nova busca | **não é** trocar entre os três | parcial (`NONE_OF_THEM`) | ela + Curador |

---

# 19 · Máquina de estados conceitual

**Não é funil:** de quase todo estado sai mais de um caminho; três desfechos são terminais e **nenhum é o "sucesso"**; e o estado inicial admite saída sem avanço.

```
[ NA MESA / NA SALA ]  (nenhum registro; nada existe ainda)
   ├─ sai sem confirmar ......... nenhum evento. Não é estado. ──► volta quando quiser
   ├─ NONE_OF_THEM ──────────────────────────────────────────► [ CURADORIA REABERTA ]
   └─ confirma ──► [ DECISAO_REGISTRADA ]
                      ├─ CORRECAO_ESCOLHA (dentro dos três) ──► [ DECISAO_REGISTRADA ]
                      ├─ declara contato ──► [ CONTATO_DECLARADO ]
                      │                        ├─ 1º atendimento ──► ‖ PRIMEIRO_ATENDIMENTO_REALIZADO ‖
                      │                        └─ não avançou ─────► ‖ ENCERRADO_SEM_RELACIONAMENTO ‖
                      ├─ 1º atendimento (atalho válido) ──────────► ‖ PRIMEIRO_ATENDIMENTO_REALIZADO ‖
                      └─ não avançou ─────────────────────────────► ‖ ENCERRADO_SEM_RELACIONAMENTO ‖

[ PAUSA POR SEGURANÇA ] — sobreposto a qualquer estado; não altera nenhum; sem efeito operacional
```

| Transição | Evento | Ator | Condição | Reversível? | Afirmação permitida |
|---|---|---|---|---|---|
| → `DECISAO_REGISTRADA` | `decisao_confirmada` | **paciente** | entrega publicada | **sim** — até declarar contato | *"sua decisão está registrada"* |
| ↻ `DECISAO_REGISTRADA` | `CORRECAO_ESCOLHA` | **paciente** | status inalterado; novo profissional entre os três | sim | *"sua escolha agora é [nome]"* |
| → `CONTATO_DECLARADO` | declaração dela | **paciente** | — | **não** | *"você registrou que iniciou o contato com [nome]"* |
| → `PRIMEIRO_ATENDIMENTO` ‖ | declaração dela | **paciente** | — | não (terminal) | *"você registrou o primeiro atendimento"* |
| → `ENCERRADO_SEM_RELAC.` ‖ | declaração dela | **paciente** | — | não (terminal) | *"você registrou que o contato não avançou"* |
| → `CURADORIA REABERTA` | `NONE_OF_THEM` | **paciente** | — | — | *"vamos entender melhor"* — **sem prazo** (D-08) |
| ⟂ `PAUSA POR SEGURANÇA` | declaração dela | **paciente** | — | — | *"a Curadoria não atende urgência"* — **e nada mais** (Q7) |

**Falhas contempladas:** unicidade na confirmação (idempotente); correção fora de janela (recusada por *trigger*); profissional fora dos três (recusado por *trigger*); **indisponibilidade — sem representação (D2)**; ninguém responder a pedido de conversa — **sem contingência (Q5)**.

**Note-se o que a máquina não tem:** nenhum estado produzido pela Aliviar depois da confirmação. **Todos os eventos pós-decisão têm a paciente como ator.** É a expressão exata de D1.

---

# 20 · Auditoria de promessas

| # | Frase | Classificação | Autoridade | Evento verificável | Risco se errada | Formulação honesta hoje |
|---|---|---|---|---|---|---|
| 1 | *"sua decisão está registrada"* | **AUTORIZADA** | sistema | `decisao_registrada` | — | mantém-se |
| 2 | *"você registrou que iniciou o contato com [nome]"* | **AUTORIZADA** | sistema (declaração dela) | `CONTATO_INICIADO` | — | **já em produção** |
| 3 | *"enquanto você não tiver falado com [nome], pode trocar aqui mesmo"* | **AUTORIZADA** | *trigger* (F4) | `CORRECAO_ESCOLHA` | — | **nova; deve substituir a frase 4** |
| 4 | *"a decisão é reversível"* | **REMOVER** | nenhuma | nenhum | promessa quebrada no ponto mais frágil | usar a frase 3 |
| 5 | *"o Curador foi avisado"* | **REESCREVER** | nenhuma — não há aviso | nenhum | ela esperar ação que ninguém disparou | *"sua decisão fica registrada e visível para [nome], o Curador do seu caso"* |
| 6 | *"e o que ele fará em seguida"* | **BLOQUEADA** | Operação (Q5) | nenhum | prever ação humana não comprometida | — |
| 7 | *"falamos com ele"* / *"vamos falar com ele"* | **BLOQUEADA** | **Q-D1** | ⛔ | **ela esperar uma ligação que ninguém fará** | — |
| 8 | *"seu profissional está garantido"* | **REMOVER** | nenhuma | ⛔ (F9) | garantia inexistente | — |
| 9 | *"sua consulta está reservada"* / *"está tudo certo"* | **REMOVER** | nenhuma | ⛔ (F9) | idem | — |
| 10 | *"ele atende de manhã"* | **AUTORIZADA COM CONDIÇÃO** | Base de Evidências | evidência datada | informação vencida como atual | *"ele declarou, em [data], que atende de manhã"* |
| 11 | *"[nome] vai falar com você"* | **BLOQUEADA** | Operação (Q9, Q10) | ⛔ | porta sem destino | — |
| 12 | *"responderemos em [prazo]"* | **BLOQUEADA** | Operação (Q5) | ⛔ | prazo sem capacidade | nomear **quem**, nunca **quando** |
| 13 | *"seu acompanhamento começou"* | **BLOQUEADA** | Q9 | ⛔ | declarar inexistente | — |
| 14 | *"avisaremos se algo mudar com ele"* | **BLOQUEADA** | **Q-D1/D2** | ⛔ | **ninguém monitora** | — |
| 15 | *"a Curadoria não atende urgência"* | **AUTORIZADA** | **Direção** | escopo institucional | — | mantém-se |
| 16 | *"procure agora [serviço]"* | **BLOQUEADA** | **Q7 — clínica** | ⛔ | **risco à segurança** | — |
| 17 | *"seus três caminhos continuam aqui"* | **AUTORIZADA** | sistema | entrega persistida | — | mantém-se |
| 18 | *"vamos entender melhor"* (após "nenhum dos três") | **AUTORIZADA COM CONDIÇÃO** | Curador | `NONE_OF_THEM` | virar espera indefinida | sem prazo, e **um Curador com nome** |
| 19 | *"você registrou que o contato não avançou"* | **AUTORIZADA** | sistema | `ENCERRADO_SEM_RELACIONAMENTO` | — | **falta tratamento de experiência** (P-8) |

**Nenhuma frase sem dono e sem evento verificável foi classificada como autorizada.** Autorizadas: **7**. Com condição: **3**. Bloqueadas: **6**. A remover ou reescrever: **4**.

---

# 21 · Critério de conclusão

| # | Pergunta | Resposta | Estado |
|---|---|---|---|
| 1 | o que significa "comunicada" | a paciente declarou ter iniciado o contato (`CONTATO_INICIADO`) | **respondida** (D-01) |
| 2 | qual evento limita a reversibilidade | o mesmo — *trigger* impede correção depois | **respondida** (D-02) |
| 3 | o que a confirmação autoriza | registrar a escolha e torná-la legível ao Curador. **Nada mais** | **respondida** (D-06) |
| 4 | quando o profissional é contatado | **a Aliviar não o contata**; quem contata é ela | **respondida como constatação — e é a divergência D1** |
| 5 | existe reserva? | **não** | **respondida** (D-05) |
| 6 | indisponibilidade posterior | decisão preservada, alternativas preservadas, **e hoje ninguém a comunica** | **parcial — D2 bloqueada por Q-D1** |
| 7 | quem pode alterar a decisão | **a paciente, e só ela**, até o marco | **respondida** (D-03) |
| 8 | quando o Concierge assume | proposta: alcançável desde a Mesa, assume na decisão | **BLOQUEADA — Q9** |
| 9 | quem recebe a formulação | paciente, Curador do caso e administrador — **contra o que a Fase 9 afirmou** | **respondida como constatação — D3 exige decisão (Q6)** |
| 10 | o que pode ser prometido | as 7 autorizadas e 3 condicionais de §20 | **respondida** |
| 11 | quais decisões permanecem bloqueadas | **Q-D1** (raiz) · **Q7** (clínica, prioridade por risco) · Q5 · Q9 · Q10 · Q6 · Q8 · Q3 · Q2 · D2 | **respondida** |
| 12 | quais correções os documentos exigem | 11 patches, §17 | **respondida** |

**Onde a resposta correta foi um bloqueio, ele está explícito e nomeado.** Nenhuma pergunta foi respondida por invenção.

---

> **O que acontece no mundo da Aliviar quando uma paciente confirma uma decisão?**
> **Hoje: quase nada — e isso é uma constatação, não uma crítica.** Guarda-se a escolha, cria-se o vínculo, e o Curador passa a poder vê-la. Ninguém é avisado, ninguém é contatado, nenhuma agenda é tocada. **A paciente segue sozinha a partir dali, e a única coisa que muda para ela é que, ao dizer que falou com o profissional, perde a possibilidade de trocar.**
> **Se este é o serviço que a Aliviar quer prestar, os documentos de experiência precisam parar de prometer outro. Se não é, o domínio precisa passar a existir.**
> **As duas coisas são legítimas. Manter as duas ao mesmo tempo não é.**
