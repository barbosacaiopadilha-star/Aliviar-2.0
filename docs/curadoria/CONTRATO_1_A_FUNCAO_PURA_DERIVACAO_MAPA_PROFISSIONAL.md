# Contrato do Item 1.A — Função Pura de Derivação do Mapa do Profissional

| Campo | Valor |
|---|---|
| **Versão** | v1.1 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-08 |
| **Status** | **APROVADO — Guardião da CURADORIA 2.0, 2026-08-08** (`APROVADO COM RESSALVA`; a ressalva — reformulação da propriedade de lacuna do §9 — está incorporada, com três registros vinculantes nos §5/§8/§10). Parecer catalogado como **PA-13** no [`REGISTRO_DOS_PARECERES.md`](REGISTRO_DOS_PARECERES.md). Nasceu como **PROPOSTA** na base `09486f2`; lavratura da aprovação no commit registrado no PA-13. **Nenhuma semântica material evidência→estado foi aprovada** |
| **Base** | `2c52832` (Item 1.12 formalmente encerrado; pré-voo do 1.A concluído) |
| **Item** | **1.A** — a metade **pura e inerte** da antiga 1.2, partida pelo §15.0/RC-4; a metade operacional é o `2.C` |
| **Dependência** | 1.1 ✓ |
| **Aceite canônico** | zero chamadores (verificável) · lacuna nunca vira estado positivo (P-04/I-8) |
| **Implementação** | **NÃO AUTORIZADA** por este documento |

---

## 1. Objeto

O 1.A entrega **uma função pura de derivação do estado proposto do Mapa do
Profissional a partir de evidências já autorizadas — e nada além disso**.

**Excluído expressamente:** persistência · escrita no Mapa · apresentação a
humano · capability · RPC · action · route · UI · efeito colateral · acesso a
banco · ativação do `2.C`.

## 2. A descoberta que define a v1 — semântica evidência→estado

O pré-voo apontou a lacuna; esta lavratura a **mediu**:

1. **ADR-065** aprova uma derivação evidência→estado — mas **relativa ao par
   pessoa×profissional**: `deriveRelationalState(concept, personOptions, …)`
   ([`motor-relacional.ts:193`](../../src/modules/curadoria/motor-relacional.ts))
   recebe as opções **da pessoa** e aplica `satisfied_by` opção-a-opção. É a
   semântica da **leitura** (célula relacional), não do **estado absoluto** que
   `professional_subcriterion_map` registra — um estado por (profissional,
   conceito), independente de Case.
2. **Nenhuma outra autoridade aprovada** define correspondência evidência→estado
   absoluto — para conceito algum.
3. **`CATALOGO_CANONICO_OPERACAO.md` está em estado de proposta não aprovada**:
   pode ser consultado como contexto; **não pode ser usado como autoridade nem
   determinar implementação** (§14).

> **Decisão da v1 — Opção B, na forma máxima e segura:** o conjunto de conceitos
> com derivação absoluta normativamente fechada é **vazio**. Logo a v1 entrega a
> **mecânica completa e o conteúdo vazio**: a função nasce **total, pura e
> honesta**, classifica todo conceito sem inventar semântica, e **não deriva
> nenhum estado** — porque nenhuma regra aprovada existe. Nenhum conteúdo do
> Catálogo em proposta é promovido a norma.

É o padrão repetido da casa: a estrutura da 2.1 nasceu inerte; o emissor da 2.2C
nasceu sem regra real; o painel do 1.11 nasceu vazio e honesto. **A derivação
material entra depois, por dado versionado** (§10), nunca por edição silenciosa
da função.

## 3. A função — contrato

```
derivarMapaDoProfissional(entrada) → DerivacaoDoMapa
```

Nome definitivo segue a convenção do repositório (`derivacao-do-mapa-profissional.ts`
ou equivalente); **um módulo, uma função exportada de derivação**.

### 3.1 Entrada — valores de domínio, imutáveis e serializáveis

| Campo | Conteúdo | Proibido |
|---|---|---|
| `conceitos` | do Catálogo **gerado** (fonte executável já vigente): `code`, `active`, `cruzamento`, opções canônicas | entidade de banco, cliente, repository, ID sem semântica |
| `evidencias` | as linhas de evidência do profissional **para os conceitos em questão**, como valores: `id`, `subcriterionCode`, `version`, `options`, `status` de verificação | objeto gigante, contexto operacional, sessão |

Todo contexto entra **por argumento**. Nada mais existe.

### 3.2 Saída — quatro braços, lista fechada

Por conceito ativo avaliado, **exatamente um**:

| Braço | Quando | Conteúdo |
|---|---|---|
| `FORA_DA_DERIVACAO` | `cruzamento` ≠ `automatico` (humanos e mistos) — juízo humano é território da ADR-067, nunca desta função | motivo nomeado |
| `NAO_SUPORTADO` | conceito automático **sem regra de correspondência aprovada** — na v1, **todos os nove** | motivo nomeado |
| `LACUNA` | conceito coberto por regra, **sem evidência vigente suficiente** | motivo nomeado (§6) — **inalcançável na v1** (não há regra) |
| `PROPOSTO` | conceito coberto por regra, com evidência suficiente | estado + proveniência (§5) — **inalcançável na v1** |

A saída é **determinística, pequena, sem efeito, sem metadado operacional, sem
persistência implícita**. Os braços `LACUNA` e `PROPOSTO` são **declarados no
tipo desde a v1** — são o contrato que o `2.C` consumirá — e documentados como
inalcançáveis até a primeira regra lavrada.

### 3.3 Proveniência na saída — decidido: faz parte

Quando `PROPOSTO` existir, ele carrega **obrigatoriamente**: o estado proposto ·
`ruleId` + `ruleVersion` (ADR-066: *"sem regra nomeada e versionada, o valor é
mágico"*) · a **evidência exata** por `id` + `version` — **sempre ponteiro,
nunca snapshot, nunca busca** (a proibição de `max(version)` para proveniência,
C-01c, vale aqui). Isso não é metadado: é o domínio que a Fronteira e a Ficha
exigem. *(Preservado expressamente pela aprovação — PA-13.)*

## 4. Pureza — invariantes contratuais

Mesma entrada → mesma saída · sem banco · sem relógio · sem aleatoriedade · sem
ambiente · sem rede · sem sessão · sem autenticação · sem escrita · sem mutação
externa · sem singleton mutável. **Todo contexto por argumento.**

## 5. Estados — o que "positivo" significa aqui

Os únicos estados propositáveis são os três do enum vigente:
`CONFIRMADO` · `NAO_CONFIRMADO` · `NAO_INFORMADO`.

> **Cláusula de precisão: "estado positivo" = qualquer estado afirmativo — e os
> três afirmam algo sobre alguém.** `CONFIRMADO` afirma presença;
> `NAO_CONFIRMADO` afirma ausência verificada — e P-04 é explícito:
> *"lacuna ≠ 'não atende'"* — derivar `NAO_CONFIRMADO` de ausência é **tão
> proibido** quanto derivar `CONFIRMADO`; `NAO_INFORMADO` afirma que *olharam e
> não souberam* (E-01) — só é derivável de **evidência existente que o declare**,
> jamais da ausência de evidência.

**Ausência de evidência não produz estado nenhum: produz `LACUNA`** — que não é
estado do Mapa, é a declaração honesta de que não há o que propor. Nenhum estado
novo é inventado.

> **Registro vinculante (Guardião, 2026-08-08).** A linha da Arquitetura §10.4
> — *"Nenhuma evidência vigente do conceito → `NAO_INFORMADO`"* (linha 1317) —
> está **superada pela ADR-066 §14.1** e **não pode fundamentar regra futura**.
> Regra vinculante: **`NAO_INFORMADO` exige evidência existente que declare a
> não-informação; ausência de evidência produz `LACUNA`, nunca `NAO_INFORMADO`.**
> A Arquitetura não é editada nesta lavratura; a emenda daquela linha será
> lavrada quando o documento for tocado — este registro é a autoridade até lá.

## 6. P-04 / I-8 — cláusula executável

> **Ausência de evidência suficiente nunca produz estado por default, fallback,
> coerção ou interpretação.**

| Situação | Resultado obrigatório |
|---|---|
| Evidência inexistente para o conceito | `LACUNA · SEM_EVIDENCIA` |
| Evidência existente, insuficiente para a regra | `LACUNA · EVIDENCIA_INSUFICIENTE` |
| Evidências **contraditórias** que a regra não resolve | `LACUNA · EVIDENCIA_CONFLITANTE` — a função **não arbitra** conflito sem regra |
| Conceito não coberto por regra | `NAO_SUPORTADO` |
| Conceito não automático | `FORA_DA_DERIVACAO` |
| Entrada **inválida** (malformada, conceito inexistente, evidência de outro conceito) | **erro técnico** — exceção; nunca lacuna, nunca estado |

Erro técnico e lacuna de domínio **não se misturam** (§6 responde ao item 18 da
missão): entrada inválida é defeito do chamador; lacuna é fato do mundo.

## 7. Matriz de conceitos — a v1, conceito a conceito

Fonte: Catálogo gerado vigente (29 ativos: 9 `automatico` · 2 `misto` · 18
`humano`), ADR-065, ADR-067.

| Conceitos | Classificação na v1 | Fonte normativa |
|---|---|---|
| `ACESSO_DISPONIBILIDADE` · `ACESSO_MODALIDADE` · `ACESSO_PRAZO_PARA_CONSULTA` · `CONTINUIDADE_CANAIS` · `CONTINUIDADE_COORDENACAO` · `CONTINUIDADE_EQUIPE_DE_APOIO` · `MODELO_ALTERNATIVAS` · `MODELO_COMUNICACAO` · `MODELO_PARTICIPACAO_FAMILIAR` *(os 9 automáticos)* | **SEMÂNTICA NÃO APROVADA** para o estado absoluto → `NAO_SUPORTADO` na v1. São os **únicos candidatos estruturais** a regras futuras | Catálogo (`cruzamento: automatico`); a ADR-065 cobre 3 deles **apenas na leitura pairwise** — não confundir |
| `ACESSO_LOCAL_DE_ATENDIMENTO` · `CONTINUIDADE_RETORNOS` *(mistos)* | **FORA DO 1.A** → `FORA_DA_DERIVACAO` — a parte humana não se separa sem decisão | Catálogo (`misto`); nenhuma autoridade de partição |
| `FORMACAO_*` (5) · `EXPERIENCIA_*` (3 ativas) · `HISTORICO_*` (3 ativas) · `CONTINUIDADE_POS_PROCEDIMENTO` · `MODELO_DECISAO_COMPARTILHADA` · `PRATICA_LIMITES_DE_ATUACAO` *(14 humanos INDIRETO)* | **FORA DO 1.A** → `FORA_DA_DERIVACAO` — juízo humano; registro em `curator_judgments` | ADR-067 |
| `MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS` · `MODELO_PREFERENCIAS_E_RESTRICOES` · `VIABILIDADE_COBERTURA_E_CONVENIO` · `VIABILIDADE_CUSTO_E_PAGAMENTO` *(humanos NUNCA)* | **FORA DO 1.A** → `FORA_DA_DERIVACAO` | ADR-067; `MOTOR_PARTICIPATION` no Catálogo (2.2C-R1) |
| códigos inativos do catálogo | **FORA DO 1.A** — fora de circulação | Catálogo (`active: false`) |

**Resposta à pergunta central da missão (Q3): nenhum conceito entra na v1 com
derivação material.** A lista de candidatos estruturais é a dos 9 automáticos, e
cada um só entra quando **sua** regra de correspondência for lavrada (§10).

## 8. Composição, precedência e evidência corrente

A única regra de composição fixada na v1 é a **já lavrada** no contrato canônico
de `practice_evidence`: *"leitura corrente = max(version)"* — a função considera,
por conceito, **a versão corrente** da evidência, e a saída `PROPOSTO` (quando
existir) apontará **por id** a linha exata usada. Precedência entre **fatos
distintos**, combinação de múltiplas evidências e resolução de conflito **não
estão decididas** para conceito algum: são matéria da regra versionada futura —
até lá, conflito ⇒ `LACUNA · EVIDENCIA_CONFLITANTE` (§6). **Nenhuma regra é
inventada.**

> **Registro vinculante — completude da entrada (Guardião, 2026-08-08).**
> A separação é normativa e permanente:
>
> | Responsabilidade | De quem |
> |---|---|
> | **Completar o conjunto** — reunir as evidências e entregá-las por argumento | **do chamador futuro (`2.C`)** |
> | **Selecionar dentro do conjunto** — a corrente por conceito, pela regra já lavrada acima | **da função pura** |
>
> O 1.A **não descobre evidência faltante, não busca banco e não sabe o que não
> recebeu**. O que não veio na entrada, para a função, não existe — e o
> resultado honesto disso é `LACUNA`, nunca suposição.

## 9. Determinismo, totalidade e propriedades

- **Total sobre domínio fechado, discriminada por conceito**: todo conceito
  ativo recebe exatamente um braço; exceção só para entrada inválida (§6).
- **Oráculos de determinismo**: mesma entrada repetida → mesma saída ·
  permutação das coleções de entrada (ordem sem semântica) → mesma saída ·
  serializar/desserializar a entrada → mesma saída · ambiente diferente → mesma
  saída.
- **Propriedade permanente** *(reformulada pela ressalva do Guardião, 2026-08-08)*:
  > **"Entrada sem evidência para o conceito jamais produz `PROPOSTO`."**
  > É a forma permanente de P-04/I-8: **do vazio, nada se afirma.**
  Junto dela, permanentes também: ausência de efeito · invariância de ordenação.
- **Monotonicidade forte — v1 apenas**: a propriedade *"remover evidência nunca
  cria estado onde não havia"* vale **somente na v1**, enquanto `PROPOSTO`
  permanece inalcançável. Sua manutenção, alteração ou rejeição após existir
  semântica material é **decisão da futura emenda do §10** — ela **não é
  declarada eterna** (uma regra futura legítima pode, por exemplo, derivar
  `NAO_CONFIRMADO` de evidência que o declare, e a remoção dessa evidência
  mudaria a saída — o que a forma forte proibiria por acidente).
- Sem framework novo: os oráculos são exprimíveis na base de teste existente.

## 10. Evolução — como a semântica entra, sem mudança silenciosa

1. **O conteúdo entra como dado versionado**, nunca como código: uma **regra de
   correspondência evidência→estado**, com `rule_id` + `version`, por conceito —
   o mesmo regime da ponte grau→importância (C-12: *"a correspondência é DADO
   versionado, nunca `case` em código"*; ADR-069 para o ciclo de vida; Autoridade
   de Método como dona).

   > **Registro vinculante — regra por argumento (Guardião, 2026-08-08).**
   > A função pura **nunca resolve regra "vigente", nunca busca regra, nunca
   > consulta banco**. Ela **recebe a(s) regra(s) por argumento, já resolvidas
   > pelo chamador, com versão explícita** — e a saída declara `ruleId` +
   > `ruleVersion` recebidos. **A seleção de regra corrente fica fora do 1.A**
   > (é do chamador futuro, sob o ciclo de vida da ADR-069). Vale para a regra o
   > mesmo que o §8 fixa para a evidência: completar é do chamador; a função só
   > aplica o que recebeu.
2. **A forma da regra e sua primeira instância exigem lavratura própria** (ADR ou
   contrato aprovado — a mesma família da ADR-066 §15). Este contrato **não a
   define** — define apenas que sem ela o braço `PROPOSTO` é inalcançável.
3. **Ativar o braço derivador é emenda a este contrato**, com os testes do §12
   ganhando os casos positivos. Guarda impede o atalho: nenhuma tradução
   opção→estado em código (§13, G-4).

## 11. Relação com `motor-relacional.ts` — precedente, não autoridade

| Reaproveitável como padrão | Específico do relacional — **não generalizar** |
|---|---|
| pureza total; módulo sem banco/escrita (C-04 o prova) | a assinatura **pairwise** (`personOptions`) — leitura relativa à pessoa |
| estados como lista fechada; wildcard `"*"` como forma declarativa | `satisfied_by` — correspondência **da leitura**, não do Mapa |
| "conceito humano nunca produz célula" → aqui, `FORA_DA_DERIVACAO` | `AGUARDA_JUIZO_DO_CURADOR` (saída da leitura relacional, não estado de Mapa) |

## 12. Testes exigidos

Por braço alcançável na v1: `FORA_DA_DERIVACAO` (humano, misto, inativo, `NUNCA`) ·
`NAO_SUPORTADO` (cada um dos 9 automáticos) · entrada inválida (erro técnico,
nunca lacuna) · determinismo (§9) · propriedades (§9) · **nenhuma promoção de
lacuna** (P-04/I-8) · e os casos `LACUNA`/`PROPOSTO` **preparados como
especificação executável desabilitada ou fixture-futura**, para que a emenda do
§10 os ative sem reescrever o contrato de teste.

## 13. Guardas e falseabilidade

| # | Guarda | Cai se |
|---|---|---|
| G-1 | **Pureza** | o módulo importar supabase/repository/cliente · chamar `Date.now()`/random · ler env/sessão/auth · escrever · depender de singleton mutável |
| G-2 | **Zero chamadores** | surgir import operacional em `src/` (app, actions, routes, repositories, components). **Testes não contam** — a varredura exclui `tests/` |
| G-3 | **P-04/I-8** (mutações obrigatórias) | sem evidência → estado · conceito sem regra → `PROPOSTO` · `default: CONFIRMADO`/fallback · inferência por ausência · coerção de `null`/`undefined` para estado · heurística não lavrada |
| G-4 | **Sem semântica em código** | nascer tradução literal opção→estado em TS/SQL (mesmo padrão da C-12) |
| G-5 | **Fronteira com 2.C** | o módulo mencionar tabela, capability, Fronteira, emissor, ou ganhar qualquer caminho de persistência/apresentação |

Cada mutação de G-3 deve **derrubar teste** — bancada de mutação com restauro
individual, padrão da casa.

## 14. Dependência do Catálogo Canônico de Operação

`CATALOGO_CANONICO_OPERACAO.md` (estado: proposta de Método, **não aprovada**):
**pode ser consultado como contexto; não pode ser usado como autoridade; não pode
determinar implementação.** A implementação da v1 **não depende dele em nada** —
depende só do Catálogo **gerado** vigente (executável, guardado por F-02) e das
classificações já lavradas. Se um dia uma regra de correspondência quiser nascer
do seu conteúdo, é a **lavratura dessa regra** que o promoverá — nunca este item.

## 15. Critérios de aceite do Item 1.A — operacionalizados

| # | Aceite | Prova |
|---|---|---|
| **A1** | Pureza | G-1 verde + oráculos §9 |
| **A2** | Zero chamadores | G-2 verde — nenhum consumidor de produção |
| **A3** | P-04/I-8 | G-3: as seis mutações caem; lacuna jamais vira estado |
| **A4** | Determinismo | oráculos §9 verdes |
| **A5** | Autoridade | **somente semântica aprovada é executável** — na v1, isso significa `PROPOSTO` inalcançável, e a guarda G-4 impede o atalho |
| **A6** | Fronteira | G-5 verde: nenhuma persistência/apresentação nasce; `2.C` intocado |

## 16. Rollback

Propriedade do item, registrada: **remover o módulo + testes + guardas. Nenhum
estado persistido, nenhum banco a restaurar, nenhum chamador a consertar** — o
item é removível sem efeito por construção (o mapa já o diz: *"não tem
chamador"*).

## 17. Não-objetivos

Não persistir · não emitir proposta · não mostrar a humano · não escolher
autoridade · não calcular ranking · não modificar Mapa · não abrir Fronteira ·
não criar capability · **não aprovar semântica de Método por implementação**.

## 18. Encaminhamento

Ao **Guardião da CURADORIA 2.0**, para aprovação. Nenhuma pendência de
autoridade **dentro** do contrato: a v1 não depende de decisão externa. A
**fronteira futura** fica registrada com clareza: o valor material do 1.A se
realiza quando a primeira **regra de correspondência do lado profissional** for
lavrada pela autoridade competente (§10) — decisão que este contrato
deliberadamente **não** toma.
