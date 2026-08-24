# Proposta — o painel do Concierge

> **Status: Proposta. Não é canônico, não está agendado, não é o plano.**
> **Data:** 2026-08-24 · Levantado a pedido do Fundador, em conversa direta.
> **Sob a [ADR-073](DECISIONS.md) (congelamento).** Nada aqui é implementado até a
> primeira Curadoria real acontecer de ponta a ponta.

---

## 0 · A regra que governa este documento

A ADR-073 diz, com todas as letras, que **a ordem depois do descongelamento é a dor, não
o plano** — e nomeia como sinal de fracasso a primeira Curadoria acontecer e o
descongelamento seguir a ordem do plano original, ignorando o que foi observado.

Então este documento é **um candidato**, e não uma fila. Ele existe para que a conversa
de 24/08 não se perca e para que a decisão futura seja tomada com o inventário à mão —
nunca para dispensar a observação que a ADR-073 exige.

Se, quando a operação real acontecer, o Concierge precisar de outra coisa, **vence a
operação.** Este texto é descartável de propósito.

---

## 1 · O que já existe — inventário verificado em 2026-08-24

| # | Capacidade | Onde está | Estado |
|---|---|---|---|
| 1 | **Papel `concierge`** | `curadoria.roles`; `crm_cases.responsible_concierge_id` | vivo |
| 2 | **Transferência do Case ao Concierge** | `transfer_case_responsibility()` — ator de `auth.uid()`, motivo obrigatório, valida o papel real do destinatário, idempotente, audita antes de mover; `case_responsibility_changes` | vivo |
| 3 | **Leitura da Connection pelo Concierge** | policies `connection_records_select_case_responsible` e `connection_events_select_case_responsible`, via `can_access_case` — o responsável ATUAL lê; quem entregou o Case deixa de enxergar | vivo desde 2026-08-01 |
| 4 | **Agenda** | `curadoria.crm_appointments` (24/07): título, `start_at`/`end_at`, tipo, `location_or_link`, `assigned_to`, status ∈ `agendado, confirmado, concluido, cancelado, nao_compareceu`; índice `(assigned_to, start_at)` | modelado, **nunca usado com dado real** |
| 5 | **Tarefas e interações** | `curadoria.crm_tasks`, `curadoria.crm_interactions`, com RLS própria | modelados |
| 6 | **Estados da continuidade** | `CONTATO_INICIADO`, `PRIMEIRO_ATENDIMENTO_REALIZADO` (terminal), `ENCERRADO_SEM_RELACIONAMENTO` (terminal), `CORRECAO_ESCOLHA` | vivos |
| 7 | **A superfície `/acompanhamento`** | lista os Cases sob responsabilidade dele, com o nome da paciente — e nada além | mínima **de propósito** |
| 8 | **A modelagem da continuidade pós-decisão** | [`architecture/MODELAGEM_CONTINUIDADE_POS_DECISAO.md`](architecture/MODELAGEM_CONTINUIDADE_POS_DECISAO.md) + [`architecture/DECISOES_TECNICAS_CONTINUIDADE_POS_DECISAO.md`](architecture/DECISOES_TECNICAS_CONTINUIDADE_POS_DECISAO.md) — 1.087 linhas, de 01/08 | escrito, **não implementado** |

**A conclusão do inventário:** não falta domínio ao Concierge. Falta **vista**. Ele já lê
tudo o que precisa do Case dele; o que não existe é tela que mostre.

É a mesma figura que a ADR-073 descreve — construção correta, pronta e desligada. Aqui
ela aparece duas vezes: a agenda (item 4) e a modelagem inteira (item 8).

---

## 2 · Sobre o calendário, especificamente

O pedido que originou esta conversa foi *"ter um calendário pra ajudar no controle de
agenda do paciente"*. Duas ressalvas, e a segunda é de Método.

### 2.1 Calendário é ferramenta de volume

`crm_appointments` existe desde julho e nunca recebeu um compromisso real. Na mesma data
deste documento, a **ADR-087 §5** recolheu Tarefas e Agenda em dobras fechadas na ficha
do contato — porque, sem volume, elas gritavam sobre nada. Uma tela de calendário agora
refaria o que foi desfeito hoje.

Há também um efeito prático: dos cinco status de `crm_appointments`, **nenhum foi
validado contra um atendimento real**. Desenhar a tela antes disso é escolher campos por
suposição.

### 2.2 De quem é a agenda — e esta é a linha fina

Um calendário do Concierge que marca **as consultas dela** implica que a Aliviar controla
o tempo dela. Isso contraria a doutrina que o produto repete em toda superfície: *"a
escolha é dela, no tempo dela"* — e contraria o próprio código, onde
`registerContactIntent` só aceita a paciente como autora (`assertOwner`), porque
`CONTATO_INICIADO` é **declaração dela, nunca verificada externamente**.

**O limite proposto:** a agenda do Concierge guarda os compromissos **dele** (uma ligação,
um retorno, uma conversa marcada com ela). A consulta médica dela entra como **fato
declarado**, jamais como compromisso que a Aliviar marca em nome dela. Confundir os dois
transforma acompanhamento em tutela.

---

## 3 · A primeira fatia que eu proporia no lugar

A pergunta que o dia do Concierge realmente faz não é *"o que tenho na agenda"* — é
**"quem está parado, e há quanto tempo"**.

Ela decidiu: conseguiu falar com o profissional? A primeira consulta aconteceu? Nasceu
relacionamento, ou encerrou sem? Os três estados já existem (item 6), e o tempo desde o
último evento é derivável de `connection_events`. Uma lista de **pessoas** — nunca de
Cases — ordenada pelo tempo de silêncio responde a pergunta inteira e cabe numa tela.

O calendário vem **depois**, quando a memória do Concierge começar a falhar — e aí já se
saberá quais dos cinco status são de verdade.

---

## 4 · As doutrinas que qualquer desenho aqui tem de respeitar

Não são preferências; estão em decisão ou em código, e um painel que as cruze é defeito,
não escolha de produto.

1. **A autoria da decisão é dela.** O Concierge acompanha; não decide, não marca por ela,
   não corrige a escolha em nome dela.
2. **`CONTATO_INICIADO` é declaração da paciente** — o código já recusa outra autoria.
3. **Nenhum horário, nenhum SLA, nenhuma promessa de prazo** (contrato 30 §3). Vale para
   o canal e vale para qualquer coisa que o painel exiba a ela.
4. **O Concierge acompanha PESSOAS**, não UUIDs — o rótulo é o nome da paciente
   (auditoria de 22/08, já aplicada em `/acompanhamento`).
5. **Autorização é pela responsabilidade ATUAL**: quem entregou o Case deixa de enxergar.
   Qualquer vista nova herda `can_access_case`, sem predicado próprio.
6. **A RLS é a autoridade** — filtrar no TypeScript esconderia defeito de policy em vez de
   revelá-lo. É a razão pela qual `/acompanhamento` não filtra por responsável no código.

---

## 5 · O que a primeira Curadoria real precisa devolver para isto virar decisão

Escrito como pergunta, para ser respondido por observação e não por opinião:

- Quantas vezes o Concierge precisou **lembrar** de alguém — e o que usou para lembrar
  (papel, WhatsApp, memória)? É a medida real da falta de agenda.
- O que ele quis saber ao abrir a tela pela primeira vez no dia?
- Alguma paciente pediu que a Aliviar marcasse a consulta por ela? Se sim, o que foi
  respondido — e isso mudou o limite de §2.2?
- Quanto tempo, de fato, passa entre a decisão e o primeiro atendimento? É esse número que
  define se "quem está parado" é uma lista útil ou uma tela vazia.
- Em que momento o Concierge improvisou por fora do sistema? A ADR-073 diz que é ali que o
  produto não existe.

---

## 6 · Recomendação

**Não construir agora** — e não por burocracia. O formato do dia de um Concierge é a coisa
mais imprevisível que restou no produto, e a primeira Curadoria real responde em uma
semana o que este documento levaria um mês supondo.

Quando descongelar, a ordem sai do §5, não do §3.
