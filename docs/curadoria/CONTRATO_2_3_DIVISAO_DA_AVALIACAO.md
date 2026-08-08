# Contrato do Item 2.3 — Divisão da etapa AVALIAÇÃO

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-08 |
| **Status** | **PROPOSTA — pronta para julgamento do Guardião da CURADORIA 2.0** |
| **Base** | `279daad` (Item 2.4 formalmente encerrado; 2.3 elegível) |
| **Item** | **2.3** — Divisão da etapa AVALIAÇÃO (ADR-067 §5) |
| **Autoridades** | ADR-067 (integral) · [`CONTRATO_2_4_CURATOR_JUDGMENTS.md`](CONTRATO_2_4_CURATOR_JUDGMENTS.md) + **PA-15** · ADR-065 §3 (`AGUARDA_JUIZO_DO_CURADOR`) · ADR-035 (autoridade decisória única) · precedentes 1.12/2.6 (capabilities com gate interno) |
| **Implementação** | **NÃO AUTORIZADA** por este documento |

---

## 1. Objeto

Materializar a divisão lavrada na ADR-067 §5:

```
AVALIAÇÃO (1.0)                          AVALIAÇÃO (2.0)
6 critérios × N profissionais            ┌─ 3 critérios do lado da pessoa → MOTOR (leitura)
= 6N declarações manuais                 └─ 3 critérios técnicos → CURADOR (juízo H8–H10)
                                            + 3 conceitos relacionais → CURADOR (juízo H11)
                                            com referência a evidência, nunca texto redigitado
```

com **`curadoria.curator_judgments` como único destino persistente do juízo
humano**, e resposta inequívoca à pergunta arquitetural: *como um Curador
registra, supersede, retira e mantém julgamentos durante a AVALIAÇÃO, sem que o
Motor jamais produza o juízo.*

## 2. A separação, camada a camada

| Camada | O quê | Quem |
|---|---|---|
| **Motor produz** | a leitura dos conceitos com lado da pessoa (compatibilidade/relacional, já vigentes) e a **sinalização `AGUARDA_JUIZO_DO_CURADOR`** (ADR-065 §3, `motor-relacional.ts:94`) — derivada da **ausência** de julgamento vigente | sistema |
| **Apresentado ao Curador** | as evidências reais (por referência exata), as declarações dos dois lados, a sinalização de aguardo e — quando houver — o julgamento vigente com seu estado de atualidade (§10) | superfície da Mesa |
| **Decidido pelo Curador** | a conclusão (H8–H11), a retirada, a revisão | **humano, sempre** |
| **Persistido** | exclusivamente em `curator_judgments` (+ `curator_judgment_evidence_refs`), pelo caminho do §12 | capability |
| **Etapa avança** | quando os julgamentos **exigidos** (§9) existem, vigentes e **atuais** (§10) | derivação de leitura |
| **Etapa bloqueada** | enquanto houver `AGUARDA_JUIZO_DO_CURADOR` ou juízo desatualizado por evidência | derivação de leitura |

## 3. Não-objetivos

Abrir 2.C · abrir Fronteira · grants externos/superfície pública · fluxo
decisório final da entrega · alterar o Motor de compatibilidade · alterar
`derivation_proposals` · alterar a estrutura do 2.4 (exceto o trigger JS3 do
§10, que é regime **previsto** pelo 2.4/§22 e reproduz os oráculos F-2.4-1) ·
corrigir F-2.4-1 · qualquer juízo automático.

## 4. Cláusula herdada — destino único (G-2.4-9)

`curator_judgments` é o **único** destino do juízo humano. **Proibido**: tabela
paralela · rascunho persistente alternativo · `derivation_proposals` como
julgamento · cache autoritativo · duplicação de estado material. Estado
transitório de interface (texto sendo digitado) **não é julgamento** (ADR-067
§13b), não persiste em entidade de domínio e **não é segunda origem** — se a UI
precisar de rascunho local, ele vive no cliente e morre no cliente.

## 5. Cláusula herdada — o Motor não julga (G-2.4-7)

O Motor **não cria julgamento · não propõe conclusão · não pré-preenche · não
seleciona conclusão "provável" · não sugere para agilizar · não é autor**.

**Ergonomia sem pré-julgamento, lavrada:** a superfície pode **organizar
leitura** (mostrar evidências, lacunas, declarações — a Ficha do 1.8 é o
padrão); **não pode** iniciar o campo de conclusão com texto, oferecer
"aceitar", ordenar conclusões candidatas, nem transformar a sinalização de
aguardo em minuta. O campo de conclusão **nasce vazio, sempre** — inclusive na
revisão pós-JS3 (§10).

## 6. Autoria — herdada e operacionalizada

Autoria pertence **à versão**; autor é humano; **a identidade deriva da sessão
autenticada** (`auth.uid()`); `service_role` não constitui autoria humana.
**Proibição normativa ao writer: aceitar `actor_id` do cliente** — o parâmetro
**não existe** na assinatura (§12); mutação correspondente no §16.

## 7. Desfechos operacionais — contrato fechado

### `registrar_julgamento` (nascimento e revisão)

| Cenário | Desfecho |
|---|---|
| Primeiro julgamento do alvo, ou revisão válida sobre a versão-base vigente | **`JUIZO_REGISTRADO`** — nova versão nasce `VIGENTE`; a anterior (se havia) vira `SUPERADO` **na mesma transação** |
| Mesmo ator repete a **mesma versão-base** com **mesmo conteúdo** | **`VERSAO_JA_GRAVADA`** — sucesso idempotente; nada gravado |
| Versão-base já sucedida — **conteúdo diferente ou outro ator** | **`CONFLITO_DE_VERSAO`** — o ator relê o vigente e age de novo |
| Versão-base informada não é a vigente do alvo | `CONFLITO_DE_VERSAO` (base obsoleta) |
| Chamador não é o Curador do Case | `SEM_AUTORIDADE` (gate-first, §12) |

> **"Mesmo conteúdo" — definição vinculante do PA-15, herdada na íntegra:**
> igualdade de **todos os campos materiais de domínio da versão** — alvo,
> natureza, conceito, conclusão, referências de fatos, referências de evidências
> **com as versões referenciadas**, motivo —, excluídos **apenas** identidade
> técnica da linha, instante de gravação e metadados não materiais. E **outro
> ator jamais recebe sucesso idempotente por ato que não autorou** — recebe
> `CONFLITO_DE_VERSAO`.

### `retirar_julgamento`

| Cenário | Desfecho |
|---|---|
| Autor retira o vigente do alvo (motivo **oferecido, nunca exigido**) | **`JUIZO_RETIRADO`** — `VIGENTE → RETIRADO`; o conceito **volta a ausência de juízo**, e a etapa volta a `AGUARDA_JUIZO_DO_CURADOR` |
| Base obsoleta / corrida com outra transição | `CONFLITO_DE_VERSAO` |
| Chamador sem autoridade | `SEM_AUTORIDADE` |

**Idempotência e concorrência não são lógica de aplicação**: o árbitro é o
conjunto estrutural **já implementado no 2.4** — `um_vigente_por_alvo` ·
`uma_sucessora_por_base` · `versao_unica_por_alvo` · trigger de transição
(`VIGENTE→SUPERADO|RETIRADO`, nada mais). O writer **traduz** violações de
constraint em desfechos nomeados; **nunca** faz `SELECT → decide → INSERT` como
autoridade — a constraint decide, o SELECT apenas melhora a mensagem.

## 8. Estados — os três do 2.4, com as operações correspondentes

`VIGENTE` (nascimento — toda versão nasce assim) · `SUPERADO` (supersessão —
por nova versão na mesma transação, ou por JS3/§10) · `RETIRADO` (retirada pelo
autor). **Nenhum quarto estado; nenhuma reabertura de terminal** — revisão após
`SUPERADO`/`RETIRADO` é **versão nova** na cadeia, nunca mutação do terminal.
`PENDENTE` **não entra** em `curator_judgments`: ausência de juízo é ausência de
registro, e `AGUARDA_JUIZO_DO_CURADOR` é **derivação de leitura** da ausência.

## 9. A divisão no fluxo da etapa — o que é exigido para avançar

1. **Os 3 critérios com lado da pessoa saem da avaliação manual** — o Motor já
   os lê (é a metade automática da divisão). A leitura antiga 6×N
   (`criterion_declarations`) **deixa de ser o critério de conclusão da etapa**;
   o dado histórico é **preservado intacto** (I-7) e a superfície antiga fica
   atrás da **flag de rollback** do mapa ("flag restaura 6×N").
2. **Julgamentos exigidos** para a etapa deixar de aguardar, por profissional em
   avaliação: **H8–H10 sempre** (os 3 técnicos, `TECNICO`); **H11 quando o
   conceito relacional `humano` participa da leitura do Case** — isto é, quando
   o Case declarou grau para ele (é exatamente quando a ADR-065 §3 emite
   `AGUARDA_JUIZO_DO_CURADOR`).
3. **Exigido = julgamento `VIGENTE` e atual (§10)** para cada conceito exigido.
   Ausente, retirado sem substituto, ou desatualizado ⇒ a etapa **permanece
   aguardando** — e diz qual conceito, por quê (E-01/E-03: lacuna nomeada, nunca
   silêncio).
4. A prontidão da etapa é **derivação de leitura das mesmas fontes** — nunca
   estado persistido paralelo (o padrão O3/1.6: deriva das guardas, não as
   reimplementa).

## 10. JS3 no fluxo — evidência nova supersede, sem carry-forward

**Norma (ADR-067 §12, já lavrada):** *evidência nova supersede o juízo vigente,
mesmo que a conclusão provavelmente não mudasse.*

| Pergunta | Cláusula |
|---|---|
| Quem detecta | **o banco** — o pacote 2.3 acrescenta o **trigger JS3**: `AFTER INSERT` em `practice_evidence`, julgamentos `VIGENTES` do mesmo profissional cujo **escopo cobre o conceito da evidência nova** (RELACIONAL: `subcriterion_code` igual; TECNICO: mesma família `FORMACAO_*`/`EXPERIENCIA_*`/`HISTORICO_*`) passam a `SUPERADO` **na mesma transação** — a transição `VIGENTE→SUPERADO` é exatamente a que o trigger de estados do 2.4 permite |
| Como o fluxo reconhece | o vigente sumiu ⇒ a leitura derivada volta a `AGUARDA_JUIZO_DO_CURADOR`, com o motivo nomeado: **`JUIZO_SUPERADO_POR_EVIDENCIA`** — o Curador vê o juízo anterior **como histórico**, nunca como atual |
| Nova versão | ato humano normal (§7), referenciando as evidências **correntes** |
| **Carry-forward: PROIBIDO** | a conclusão anterior **não** pré-preenche a nova (§5); copiá-la é decisão humana de digitar de novo — nunca default |

*Nota de regime:* o trigger JS3 altera o **regime** de `curator_judgments` na
forma prevista pelo próprio 2.4 (§22/F-2.4-1): o pacote **reproduz os oráculos
vivos** (FK indevida do conceito ao Catálogo; texto autoritativo copiado) e os
mantém verdes.

## 11. Evidências mostradas ao Curador

A escrita final permanece vinculada a **`evidence_id + evidence_version`**
(refs do 2.4, validadas por trigger no banco: evidência exata, versão exata,
profissional correto, família/conceito compatível — **PA-15 é estrutural; o
writer aceita o banco como árbitro final e não flexibiliza nada**). O estado
real de verificação acompanha a referência **sem contaminar a conclusão** (I-5).
A UI **pode** exibir texto derivado/formatado da evidência **como leitura**
(mesmo regime da Ficha: recompõe de fatos, não persiste) — **não pode** gravar
cópia autoritativa em lugar nenhum: o que persiste são **referências**.

## 12. Writer — duas capabilities nominais, gate-first

| Item | Especificação |
|---|---|
| Nomes | **`curadoria.registrar_julgamento(...)`** · **`curadoria.retirar_julgamento(...)`** — verbo-primeiro; assinaturas distintas porque os atos têm cargas distintas (registro carrega conclusão+refs; retirada carrega motivo opcional) |
| Regime | `SECURITY DEFINER` · `search_path` fixo com `pg_temp` ao fim · referências qualificadas · zero SQL dinâmico · **gate-first**: `is_curator_for_case(case_id)` é a primeira verificação; sem autoridade ⇒ `SEM_AUTORIDADE`, **antes de qualquer dado** (padrão 2.6) |
| Autoria | `actor_id := auth.uid()` — **não existe parâmetro de autor** |
| Entrada mínima (registrar) | `case_id` · `professional_profile_id` · `subcriterion_code` · `natureza` · `conclusao` · `fatos_visiveis` · refs de evidência (`id`+`version`)[] · `motivo?` · **`versao_base_id?`** (null = primeiro julgamento do alvo) |
| Saída | **um desfecho nomeado** (§7) + o `id` da versão quando gravada — nada além |
| Transação | nova versão + `SUPERADO` da anterior + refs de evidência: **uma transação**; falha parcial não existe |
| Erros estruturais | violações do banco (natureza/par/estado/família/versão de evidência) são **recusas do árbitro**, traduzidas sem serem re-julgadas na aplicação |
| Grants | `REVOKE FROM PUBLIC` imediato · `EXECUTE` a `authenticated` (**o gate real é interno** — padrão `acknowledge_case_need`/`decidir_proposta`/`nome_do_curador_do_caso`, três precedentes verdes) |
| **RLS/grants da tabela** | **inalterados**: `curator_judgments` e refs permanecem **sem policy e sem grant** — o cliente jamais toca a tabela; **todo** acesso de escrita passa pelas capabilities `SECURITY DEFINER`. Leitura para a Mesa: pelo caminho de leitura do pacote (repository servidor com as capabilities/consultas autorizadas pelo contrato), **nunca** abertura direta a `authenticated` |

**Capability do Curador**: o gate **já existe** — `is_curator_for_case` (stage
7, mesmo gate das policies de `case_needs`). Nenhuma capability nova de
identidade é necessária; `nome_do_curador_do_caso` (2.6) serve à paciente e
**não é tocada**.

## 13. Superfície — a menor necessária

**Writer autoritativo** = as duas capabilities (§12). **Adaptador** = Server
Actions finas no portal do Curador (validação de forma, chamada, tradução de
desfecho — zero regra de domínio). **Renderização** = a etapa AVALIAÇÃO da Mesa
existente passa a exibir: leitura do Motor (3 lado-da-pessoa) · painel de juízo
por conceito exigido (evidências por referência, aguardo nomeado, vigente com
atualidade, histórico de versões) · ato de registrar/retirar. **Nenhuma
superfície nova fora da Mesa; nada da paciente; nada do 2.C.**

## 14. Relação com o 2.C

O 2.3 entrega ao futuro 2.C: **a etapa AVALIAÇÃO operando sobre juízo humano
registrado, versionado e auditável** — insumo de leitura. **Não entrega**:
grants externos, superfície pública, fluxo decisório final, confirmação item a
item, Fronteira. **2.C permanece `BLOQUEADO`; Fronteira `FECHADA`.**

## 15. Guardas

| # | Guarda | Cai se |
|---|---|---|
| **G-2.3-1** | o Motor não julga — nenhum caminho automático escreve em `curator_judgments` além do **trigger JS3 de supersessão** (que nunca **cria** juízo) | pipeline/regra/Motor insere versão; JS3 passa a criar em vez de superseder |
| **G-2.3-2** | destino único — nenhum juízo fora de `curator_judgments` (G-2.4-9 operacional) | nasce tabela/cache/rascunho persistente paralelo |
| **G-2.3-3** | autoria por sessão — as capabilities não têm parâmetro de autor | `actor_id` aparece em assinatura/payload |
| **G-2.3-4** | gate-first — `SEM_AUTORIDADE` antes de qualquer dado | capability consulta dados antes do gate |
| **G-2.3-5** | sem pré-julgamento — campo de conclusão nasce vazio; zero minuta/sugestão/carry-forward | UI inicializa conclusão com texto (inclusive a anterior pós-JS3) |
| **G-2.3-6** | o árbitro é o banco — o writer traduz constraints, não as reimplementa como autoridade | writer decide concorrência por `SELECT→INSERT` sem aceitar a constraint |
| **G-2.3-7** | flag de rollback restaura 6×N sem perda — `criterion_declarations` intactas | dado histórico da avaliação antiga apagado/reescrito |
| **G-2.3-8** | 2.C fechado — nenhum grant externo/superfície pública nasce | qualquer abertura citando o 2.3 |

## 16. Falseabilidade — mutações que devem cair

Motor criando juízo ⇒ G-2.3-1 · `derivation_proposals` ganhando alvo de
julgamento ⇒ G-2.4-7 (oráculo vivo) · cliente escolhendo `actor_id` ⇒ G-2.3-3 ·
outro ator recebendo `VERSAO_JA_GRAVADA` ⇒ §7 (PA-15) · writer ignorando base
obsoleta ⇒ §7/G-2.3-6 · evidência de família incompatível aceita ⇒ trigger do
2.4 (oráculo vivo, mutação PA-15) · versão de evidência inexistente ⇒ refs FK ·
writer contornando o árbitro ⇒ G-2.3-6 · destino paralelo ⇒ G-2.3-2 · juízo
automático/pré-preenchido ⇒ G-2.3-1/G-2.3-5 · 2.C aberto ⇒ G-2.3-8 · gate
burlado ⇒ G-2.3-4 · grant excessivo/policy de escrita direta ⇒ oráculo de
catálogo (inércia da tabela preservada) · **carry-forward pós-JS3** ⇒ G-2.3-5.

## 17. Rollback

Separado por camada, **sem tocar o 2.4**: `drop` das duas capabilities e do
trigger JS3 · remoção das Server Actions e da superfície nova · flag restaura a
leitura 6×N (dados antigos intactos, G-2.3-7). **`curator_judgments` e os fatos
históricos jamais são destruídos** — julgamentos reais eventualmente gravados
permanecem (I-7); o rollback desliga caminhos, não apaga atos humanos.

## 18. F-2.4-1 — vigilância herdada

Este pacote **toca o regime** (trigger JS3) e por isso **reproduz e mantém
verdes os oráculos vivos** do F-2.4-1: nenhuma FK do conceito ao Catálogo nasce;
nenhuma coluna/texto autoritativo copiado nasce nas referências. **F-2.4-1 não é
corrigido aqui** — permanece higiene não bloqueante, com a obrigação de
vigilância preservada.

## 19. Critérios de aceite

| # | Aceite |
|---|---|
| 1 | As duas capabilities existem, gate-first, autoria por sessão, desfechos nomeados do §7 **todos alcançáveis por teste** |
| 2 | "Mesmo conteúdo" comparado conforme PA-15 — mutação de campo material qualquer quebra a idempotência |
| 3 | Outro ator **nunca** recebe sucesso idempotente (prova de corrida) |
| 4 | Concorrência arbitrada pelos índices/triggers do 2.4 (provas: dois curadores; duas sucessoras; supersessão×retirada; base obsoleta) |
| 5 | Trigger JS3 supersede na transação da evidência nova; **nunca cria juízo**; oráculos F-2.4-1 verdes |
| 6 | Etapa AVALIAÇÃO: aguarda com lacuna nomeada; avança com exigidos vigentes e atuais (§9); 3 lado-da-pessoa fora da avaliação manual |
| 7 | Campo de conclusão nasce vazio — inclusive pós-JS3 (sem carry-forward) |
| 8 | Tabela permanece sem policy/grant (oráculo de catálogo); todo acesso via capabilities |
| 9 | `criterion_declarations` intactas; flag restaura 6×N |
| 10 | G-2.3-1..8 implementadas e verdes; mutações do §16 caem |
| 11 | 2.C bloqueado; Fronteira fechada; grants do 1.12 zero |
| 12 | Regressão integral verde; rollback conforme §17 |

## 20. Encaminhamento

Ao **Guardião da CURADORIA 2.0**, para julgamento integral. Após aprovado:
implementação por missão própria (Engenheiro) → verificação → encerramento — e
o caminho da Onda 2 fica inteiro para a decisão de abertura que o 2.C exigirá.
