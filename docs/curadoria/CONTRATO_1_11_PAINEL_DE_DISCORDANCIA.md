# Contrato do Item 1.11 — Painel de Discordância e Leitor Agregado

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-07 |
| **Status** | **Vigente — lavrado pelo DT-01**, nível derivado |
| **Decide** | DT-01 — Fundador |
| **Base** | `44866a3` (Item 1.8 encerrado) |
| **Dependências** | Arquitetura §11/§17.5 (O6) e a definição da taxa (linha "Taxa de discordância das derivações") · [`CONTRATO_1_8_R1.md`](CONTRATO_1_8_R1.md) §18/§21 (modelo de authority boundary, cumprido) · ADR-066 §11 (cinco estados da proposta) |
| **Origem** | Pré-voo do próximo pacote (2026-08-07): o painel exige leitura agregada que a C-01 proíbe e que a capability individual do §21 deliberadamente não fornece |

> Decisão do DT-01: **seguir para o Item 1.11**, precedido exclusivamente por
> esta lavratura. O Item 1.6 permanece elegível e **não é aberto agora**.

---

## 1. Objeto

Uma **única capability SQL de leitura agregada** que permita ao Painel de
Discordância observar taxas **sem**: acesso direto a `derivation_proposals` ·
exposição de proposta individual · exposição por profissional · ranking ·
write path · abertura da Fronteira Humana.

## 2. Princípio central

> A capability responde **uma pergunta só**: *quantas propostas existem em cada
> desfecho, por conceito e por versão exata da regra.*

Ela **não responde**: quem · qual profissional · qual paciente · qual Case
individual · qual conteúdo · qual justificativa · qual registro de origem.

## 3. A capability

| Campo | Especificação |
|---|---|
| **Nome** | `curadoria.contar_propostas_por_desfecho` — verbo-primeiro, como as demais |
| **Assinatura** | **zero argumentos.** Sem predicado, sem filtro, sem paginação: nada que um chamador possa estreitar até reconstituir linha individual. (`STRICT` não se aplica a assinatura vazia — registrado para não parecer omissão) |
| **Corpo** | um único `SELECT … GROUP BY`, referências qualificadas, zero SQL dinâmico |
| **Retorno** | `returns table (subcriterion_code text, rule_id text, rule_version integer, state text, contagem bigint)` |
| **Granularidade** | **uma linha = `subcriterion_code × rule_id × rule_version × state`**, com uma contagem agregada |
| **Sem propostas** | **conjunto vazio.** Nenhuma linha zero é fabricada; o vazio honesto é responsabilidade do modelo do painel (§8) |
| **Segurança** | `SECURITY DEFINER` · `STABLE` (read-only imposto pelo motor) · `set search_path = curadoria, pg_temp` (`pg_temp` por último) · owner = papel de migrations, nunca reatribuído |
| **Grants** | `REVOKE EXECUTE FROM PUBLIC` imediato · `EXECUTE` **só** a `service_role` · `anon`/`authenticated` sem nada · **nenhum grant na tabela**; `has_table_privilege('service_role', 'curadoria.derivation_proposals', 'select') = false` permanece aceite positivo |

### 3.1 Dimensões permitidas — e só elas

`subcriterion_code` · `rule_id` · `rule_version` · `state` (o desfecho real do
schema) · `contagem`. **Nenhuma dimensão adicional** sem necessidade demonstrada
e lavrada.

### 3.2 Dimensões proibidas

Agrupamento por `professional_profile_id` · paciente · `case_id` · proposta
individual · `origin_record` · `origin_author` · qualquer identificador pessoal ·
**qualquer eixo capaz de formar ranking de profissionais**.

### 3.3 Conteúdo proibido no retorno

`proposal_id` · `suggested_value` · `origin_record` · `origin_version` · autoria ·
texto · justificativa · timestamps individuais · qualquer conteúdo de proposta.
**Somente agregados.**

## 4. Desfechos — os do schema, nenhum inventado

Os valores reais de `derivation_proposals.state` (migration `20260805090000`,
ADR-066 §11):

| `state` | Natureza | Entra na taxa? |
|---|---|---|
| `PROPOSTA` | pendente — nenhum humano decidiu | **não** (nem denominador) |
| `CONFIRMADA` | ato humano: concordou | **denominador** |
| `RECUSADA` | ato humano: discordou | **numerador e denominador** |
| `SUPERADA` | a origem mudou ou nova proposta a substituiu (S1/S2) — não é juízo de mérito | **não** |
| `RETIRADA` | o conceito saiu de circulação — não é juízo | **não** |

A capability **devolve as contagens de todos os cinco** (o painel também observa
o que aguarda juízo); a **taxa** usa só os dois decididos.

## 5. A taxa — definição lavrada

Âncora normativa já existente (Arquitetura, tabela de métricas): *"Taxa de
discordância das derivações — **com que frequência o humano recusa a proposta**,
por conceito e por versão de regra"* — o instrumento de calibração da 2.0
(R-02: *discordância alta corrige a **tabela**, não o Curador*).

| Pergunta | Resposta lavrada |
|---|---|
| **Denominador** | `CONFIRMADA + RECUSADA` — atos humanos decididos, e só eles |
| **Numerador** | `RECUSADA` |
| **Por conceito?** | sim — a taxa existe por `subcriterion_code` |
| **Por versão de regra?** | sim — por `rule_id × rule_version`, sempre |
| **Agregação entre versões?** | **NÃO.** Cada versão começa sua própria série observacional; misturar v1 com v2 esconderia exatamente o que a calibração quer ver |
| **Comparável entre conceitos?** | **exibível lado a lado** — conceitos não são pessoas, e comparar taxas por conceito é a calibração que O6 existe para permitir. **Nunca** vira juízo sobre profissional ou paciente |
| **Pode ordenar?** | **NÃO** — a exibição segue a **ordem neutra do catálogo**. Ordenar por taxa criaria uma fila de "piores", e fila é ranking. Só um contrato futuro explícito muda isso |
| **Denominador zero** | **não existe taxa.** Exibe-se o estado do §8; proibido "0%" |

## 6. Versionamento e regra suspensa/revogada

`rule_id + rule_version` são **preservados sempre**. E, coerente com o §22 do
Contrato do 1.8 (proposta é ato histórico):

> **Observações são fatos históricos e permanecem visíveis e auditáveis após
> suspensão ou revogação da regra.** A validade **atual** da regra é uma
> pergunta (ciclo de vida, ADR-069); o **histórico das propostas que ela
> emitiu** é outra. O painel responde à segunda e nunca confunde as duas.

## 7. Anti-ranking por desenho — invariante

> **O Painel de Discordância nunca agrega, compara ou ordena por profissional.**

Guardas futuras **falham** se surgir: `professional_profile_id` na saída ou no
agrupamento · coluna de profissional · ranking · top/bottom · ordenação por
entidade humana. A proteção começa na capability (a dimensão não existe) e
termina na superfície (a ordenação é a neutra do catálogo).

## 8. E-03 — vazio honesto

O painel **nasce vazio** e permanece honesto: **proibidos** dados demo ·
placeholder numérico · "0% de discordância" sem base · fallback textual que
pareça medição. Com conjunto vazio ou denominador zero, o estado declara:

> **"Ainda não há observações suficientes."**

(ou vocabulário canônico equivalente, nunca número). Contagens de `PROPOSTA`
pendentes podem ser exibidas como o fato que são — *"N propostas aguardam
juízo"* — sem taxa.

## 9. Privacidade — mínimo necessário

Não existe limiar de supressão lavrado no projeto (verificado em 2026-08-07), e
**nenhum é inventado aqui**. A confirmação exigida é estrutural:

1. a saída **não contém dimensão pessoal** — não há o que reidentificar
   diretamente;
2. o consumidor é a **Mesa**, cujos papéis já leem os fatos individuais pelos
   caminhos legítimos (RLS vigente) — a contagem não lhes acrescenta informação
   nova sobre pessoas;
3. **condição registrada**: se o painel um dia sair da Mesa (paciente, público,
   relatório externo), a decisão de limiar/supressão de células pequenas
   torna-se **obrigatória antes** dessa exposição. Fica lavrada como decisão
   pendente **condicional**, não bloqueante do 1.11.

## 10. C-01 e C-01d

**C-01 não muda:** nenhum `src/` conhece `derivation_proposals`; a capability é
a fronteira; a aplicação conhece **funções**, nunca a tabela.

**C-01d evolui** para reconhecer **duas** capabilities, com chamadores nominais
**distintos**:

| Capability | Chamador único autorizado |
|---|---|
| `ler_proposta_para_proveniencia` (individual, §21) | `src/modules/curadoria/cadeia-de-proveniencia-repository.ts` |
| `contar_propostas_por_desfecho` (agregada) | `src/modules/curadoria/painel-de-discordancia-repository.ts` *(nasce no 1.11)* |

Nenhum terceiro chamador; nenhum chamador cruzado; o conjunto de funções SQL que
alcança a tabela passa a ser exatamente
`{ emissor (C-11) · leitora individual · leitora agregada }` — um quarto nome
derruba a guarda.

### 10.1 Proibição expressa — não agregar por fora

> **É proibido montar agregação em `src/` por chamadas repetidas a
> `ler_proposta_para_proveniencia`.** Isso reintroduziria o acesso individual,
> permitiria reconstruir linhas, enfraqueceria o anti-ranking — e é ineficiente.
> **A agregação nasce no banco**, na capability agregada, e só nela.

## 11. Migration prevista — uma

| Item | Especificação |
|---|---|
| Conteúdo | `create or replace function curadoria.contar_propostas_por_desfecho()` conforme §3 · `revoke execute … from public` · `grant execute … to service_role` · `comment on function` citando este contrato |
| Rollback | `drop function curadoria.contar_propostas_por_desfecho()` — nada mais; nenhum dado é tocado |
| Idempotência | `create or replace` + revoke/grant idempotentes; reexecutar não falha nem duplica |
| Oráculos | `has_function_privilege` (service_role ✓; anon/authenticated/PUBLIC ✗) · `prosecdef` · `proconfig` com o search_path · `provolatile = 's'` · aceite positivo da tabela fechada preservado |

## 12. Repository e modelo puro

```
contar_propostas_por_desfecho()   (banco — única agregação)
        ↓
painel-de-discordancia-repository.ts   (único chamador; não conhece a tabela;
        ↓                               não agrega em memória; não lê individual)
modelo puro do Painel              (calcula a taxa do §5; decide vazio honesto §8)
        ↓
Mesa                               (ordem neutra do catálogo; sem ordenação por taxa)
```

**Sem writer. Sem persistência do painel.** A leitura é recalculada sempre
(D-03).

## 13. Testes obrigatórios do 1.11

1 · banco vazio → painel vazio honesto (§8) · 2 · uma versão isolada → série
própria · 3 · duas versões da mesma regra **não se misturam** · 4 · dois
conceitos não se misturam · 5 · desfechos agregam corretamente (cinco estados,
taxa só com dois) · 6 · nenhuma linha individual sai · 7 · nenhum profissional
sai · 8 · `service_role` continua **sem SELECT** direto · 9 · `EXECUTE` só da
capability, só ao `service_role` · 10 · terceiro chamador proibido (C-01d) ·
11 · coluna de profissional na saída ⇒ guarda falha · 12 · agrupamento por
profissional ⇒ guarda falha · 13 · conteúdo individual ⇒ guarda falha · 14 ·
rollback limpo · 15 · idempotência da migration.

## 14. Mutações obrigatórias

Cada uma deve **matar** ao menos um teste: grant excessivo (PUBLIC/authenticated)
· `SECURITY INVOKER` · search_path inseguro · coluna individual extra no retorno
· `professional_profile_id` em qualquer posição · `case_id` · `proposal_id` ·
agrupamento por profissional · mistura de versões (remoção de `rule_version` do
`GROUP BY`) · segundo chamador em `src/` · acesso direto à tabela · cálculo de
taxa com denominador zero.

## 15. Escopo do Item 1.11

| Dentro | Fora |
|---|---|
| capability agregada (migration única) | mecanismo de discordância (1.12) |
| `painel-de-discordancia-repository.ts` | qualquer write path |
| modelo puro do painel (taxa §5, vazio §8) | Fronteira Humana |
| painel da Mesa, ordem neutra | ranking · top/bottom · ações sobre profissionais |
| evolução da C-01d (duas capabilities) | edição de propostas · mudança de regra |
| testes §13 + mutações §14 | `2.C` · exposição fora da Mesa (§9.3) |

## 16. Critérios de aceite do 1.11 — fechados

| # | Critério |
|---|---|
| 1 | **Observabilidade real**: com propostas no banco, o painel exibe contagens e taxas conforme §4–§5 |
| 2 | **Nenhum dado individual** em nenhuma camada |
| 3 | **Nenhum ranking** — nem por profissional, nem ordenação por taxa |
| 4 | **Versionamento separado** — v1 e v2 nunca somam |
| 5 | **Vazio honesto** (§8), sem "0%" fabricado |
| 6 | **Nenhuma escrita** — sem writer, sem persistência, sem cache |
| 7 | **Capability mínima** — zero argumentos, cinco colunas, grants do §3 |
| 8 | **C-01, C-01b, C-01c e C-01d verdes**, com a C-01d evoluída para duas capabilities |
| 9 | **Rollback limpo** — drop da função + remoção do painel |
| 10 | **Regressão integralmente verde** — nada do 1.8 encerrado regride |

## 17. Microcorretivo de encerramento — `1.11-MR1` (DT-01, 2026-08-07)

> **Contexto.** O Agente 04 emitiu **ITEM 1.11 VERIFICADO COM RESSALVAS** sobre
> `4928af6` — três ressalvas, nenhuma de domínio. Decisão do DT-01: **quitá-las
> antes do encerramento formal**, sem reabrir o domínio do 1.11 e sem alterar
> taxa, capability, segurança, versionamento ou privacidade estrutural.
> `4928af6` **não é reclassificado como reprovado**.

### 17.1 R-1 — Byte `NUL` literal é dívida de auditabilidade

**O fato, localizado:** dois bytes `NUL` literais na linha 119 de
[`painel-de-discordancia.ts`](../../src/modules/curadoria/painel-de-discordancia.ts)
— os separadores da chave composta
`` `${subcriterionCode}␀${ruleId}␀${ruleVersion}` `` — tornam o arquivo
**binário para o Git** (`Bin 0 -> 6191 bytes` no próprio commit).

**Correção lavrada:**

```
byte NUL literal  →  sequência escapada de seis caracteres ASCII: barra invertida, u, 0000
```

A escolha do `NUL` como separador **permanece correta** (nenhum código canônico
pode contê-lo — a colisão de chave é impossível); o que muda é a **grafia**, de
byte cru para escape. **Aceite:** o arquivo volta a ser texto para o Git ·
`git diff` por linha volta a funcionar · a chave gerada em runtime é
**byte a byte idêntica** · nenhum teste funcional muda de intenção.

### 17.2 R-2 — Guarda anti-ranking: fortalecer (Opção A)

**O defeito, demonstrado:** a detecção atual usa
`/\.sort\([^)]*(taxa|discordancia|recusad|contagem)/i` — e `[^)]*` para no
**primeiro** `)`, que é o fecho de `(a, b)`. Um comparador realista nunca é
alcançado:

```ts
series.sort((a, b) => {
  return b.discordancia.taxa - a.discordancia.taxa;   // passa hoje — vácuo
});
```

A promessa normativa **não muda** — *o painel não ordena por taxa, recusa,
volume ou mérito* —; o que muda é a guarda passar a medi-la.

**Decisão: Opção A — fortalecer a guarda textual.** A detecção passa a extrair o
**argumento completo** de cada `.sort(...)` — parênteses balanceados, comparador
multilinha e aninhado incluídos — e a procurar os radicais proibidos
(`taxa` · `discordancia` · `recusad` · `contagem` · `merito`) **dentro do corpo
extraído**. A Opção B (arbitragem só comportamental) fica registrada como
alternativa **não adotada**: a guarda textual robusta é adequada ao padrão do
projeto (é o mesmo salto que C-11 deu com `corpoDaFuncao`), e uma guarda com
nome mais forte do que sua medida é exatamente o que o Agente 04 apontou.

### 17.3 Falseabilidade — mutação real e controle negativo

| Prova | Entrada | Esperado |
|---|---|---|
| **Mutação positiva** | `.sort((a, b) => { return taxaB - taxaA; })` (comparador multilinha com radical proibido) aplicada temporariamente a um arquivo do painel | **a guarda cai** |
| **Controle negativo** | `.sort((a, b) => ordemNeutra(a) - ordemNeutra(b))` — ordenação neutra permitida | **a guarda não cai** |

Sem o controle negativo, a guarda forte demais proibiria a própria ordem neutra
do catálogo — o erro simétrico ao que se corrige.

### 17.4 R-3 — `admin.ts`: o cabeçalho contradiz o uso lavrado

**Auditoria do contrato atual** ([`admin.ts`](../../src/lib/supabase/admin.ts)):
o cabeçalho afirma **(a)** *"nunca para leitura/escrita de dado de negócio"* e
**(b)** *"toda função que chama este cliente já deve ter passado por
`requireRoleForAction('administrador')`"*.

**Confronto com o uso do 1.11** (lavrado neste contrato, §3): leitura **agregada**
via capability `SECURITY DEFINER` com `EXECUTE` exclusivo de `service_role` ·
gate humano `requireAnyRole(["curador_medico", "administrador"])` na superfície ·
**nenhuma** leitura direta de tabela. As duas frases do cabeçalho são
contrariadas por um uso **correto e decidido** — o texto está errado, não o uso.

**Semântica lavrada para o cliente administrativo:**

> O cliente administrativo **não é usado para leitura direta de tabelas de
> negócio**. Ele **pode invocar capabilities SQL nominalmente lavradas,
> read-only e de saída mínima**, quando a autorização humana da superfície já
> foi verificada pelo gate de papel apropriado — que é o **declarado pela
> lavratura de cada capability**, não necessariamente `administrador`.
> **O uso arbitrário de `service_role` continua proibido**, e o cliente
> administrativo **não se torna cliente genérico de leitura.**

A correção do 1.11-MR1 é **documental no cabeçalho** — reescrevê-lo para dizer
isso — sem tocar o código da função.

### 17.5 Wrapper estreito — avaliado e **não** exigido

Um wrapper conceitual (`invocar capability nominal` em vez de expor o cliente
inteiro) **reduziria autoridade acidental** — quem importa o cliente hoje recebe
`.from()` sobre qualquer tabela, ignorando RLS. Mas: esse risco **antecede o
1.11**, está mitigado por `server-only` + convenção + guardas, e os dois únicos
usos de capability são nominais e auditados (C-01d). Conforme a preferência do
DT-01 — correção documental mínima, salvo risco concreto —, **o wrapper fica
registrado como evolução futura opcional, não condição do 1.11.**

### 17.6 Escopo do `1.11-MR1`

| Dentro | Fora |
|---|---|
| remover os 2 `NUL` literais (§17.1) | capability · migration · taxa |
| fortalecer a guarda anti-ranking (§17.2) | repository · modelo de privacidade |
| mutação + controle negativo (§17.3) | C-01/C-01d (semântica) |
| reescrever o cabeçalho de `admin.ts` (§17.4) | `1.12` · Fronteira Humana · `2.C` |
| testes diretamente afetados · regressão completa | qualquer refatoração do cliente (§17.5) |

### 17.7 Identificador e estado

**Identificador: `1.11-MR1`** — mesma convenção de `2.2A-MR1` e `1.8-R1-MR1`
(nível *Micro-retificação* do Processo). Nenhuma hierarquia nova.

> **`4928af6` = ITEM 1.11 VERIFICADO COM RESSALVAS — AGUARDA MICROCORRETIVO DE
> ENCERRAMENTO.** O encerramento formal do Item 1.11 acontece **só** após o
> `1.11-MR1` implementado e verificado; em seguida, o pré-voo do `1.12`.
