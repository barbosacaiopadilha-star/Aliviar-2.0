# Contrato — Biblioteca Determinística de Redação no Juízo do Curador

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-09 |
| **Base** | `a365c4e` (implementação generativa) + `6c1a1e3` (gates documentais) |
| **Superfície** | `Juízo do Curador (H8–H11)` |
| **Natureza** | revisão arquitetural pós-go-live — **simplificação** |
| **Status** | **PRONTO PARA IMPLEMENTAÇÃO** |
| **Delta desta missão** | somente documentação. **Zero código, zero migration** |

> **Substitui a geração por modelo de linguagem por uma biblioteca de textos
> canônicos, pré-escritos e versionados em Git.** O ganho de UX permanece; some
> a latência, o prompt, a alucinação, o suboperador e o gate jurídico.

---

## 1. O que muda, em uma linha

| | Antes (`a365c4e`) | Agora |
|---|---|---|
| origem do texto | modelo de linguagem, por chamada | **constante em código** |
| contexto enviado | conceito, natureza, evidências do cartão | **nada sai da Aliviar** |
| eixo das alternativas | tom (Objetiva/Cautelosa/Explicativa) | **situação do julgamento** |
| latência / falha | timeout, saída inválida, indisponibilidade | **não existem** |
| gate de privacidade | bloqueante | **inaplicável** (§9) |

**O que não muda:** o campo nasce vazio · nada entra sem ato do Curador · edição
livre · só o texto final vira ato · autoria exclusivamente humana.

## 2. Categorias — por situação, não por tom

Quatro situações, **as mesmas nos seis conceitos**. Consistência entre cartões
vale mais do que taxonomia própria por conceito, e cobre o que a operação
encontra:

| # | Título na UI | Quando serve |
|---|---|---|
| 1 | **Elementos suficientes** | há material que sustenta a leitura |
| 2 | **Elementos parciais** | há material, e ele cobre parte do necessário |
| 3 | **Informação insuficiente** | não dá para concluir — **P-04** |
| 4 | **Com ressalva** | há elementos, e eles pedem cautela declarada |

**Quatro por conceito, 24 no total.** Nenhum conceito pediu três ou cinco: as
quatro situações se aplicam integralmente aos seis, e acrescentar variação de
estilo dentro da mesma situação transformaria a UX em catálogo de respostas.

## 3. Os textos canônicos

Todos: **≤ 280 caracteres** · linguagem descritiva · sem vocabulário de mérito
comparativo · respeitando a natureza do conceito · e **nenhum** transforma
lacuna em negativo.

### 3.1 `FORMACAO` — natureza `TECNICO`

| # | Situação | Texto |
|---|---|---|
| `formacao-suficiente` | Elementos suficientes | *"A formação está documentada nos registros referenciados e é pertinente ao aspecto avaliado. Concluo com base neles."* |
| `formacao-parcial` | Elementos parciais | *"Há formação documentada, mas parte dos registros não cobre o período ou o escopo necessários. Concluo com essa limitação à vista."* |
| `formacao-insuficiente` | Informação insuficiente | *"A documentação disponível não permite firmar conclusão sobre a formação neste momento. A ausência de registro não afirma ausência de formação."* |
| `formacao-ressalva` | Com ressalva | *"A formação consta e é pertinente, mas os elementos disponíveis não sustentam conclusão mais específica para este aspecto."* |

### 3.2 `EXPERIENCIA` — natureza `TECNICO`

| # | Situação | Texto |
|---|---|---|
| `experiencia-suficiente` | Elementos suficientes | *"A experiência descrita está documentada e é pertinente ao aspecto avaliado. Concluo pelo que os registros descrevem, não pelo tempo de prática."* |
| `experiencia-parcial` | Elementos parciais | *"Há experiência documentada, e os registros descrevem parte do que este aspecto envolve. Concluo com essa parcialidade declarada."* |
| `experiencia-insuficiente` | Informação insuficiente | *"Os elementos disponíveis não permitem concluir sobre a experiência neste aspecto. A falta de registro não afirma falta de prática."* |
| `experiencia-ressalva` | Com ressalva | *"A experiência aparece nos registros, e exige leitura cautelosa: o que está descrito não esclarece a extensão nem o contexto da prática."* |

### 3.3 `HISTORICO` — natureza `TECNICO`

| # | Situação | Texto |
|---|---|---|
| `historico-suficiente` | Elementos suficientes | *"O histórico está documentado nos registros referenciados e descreve a trajetória de forma suficiente para este aspecto."* |
| `historico-parcial` | Elementos parciais | *"O histórico documentado cobre parte da trajetória. Concluo sobre o que está registrado, sem estender ao período não coberto."* |
| `historico-insuficiente` | Informação insuficiente | *"A informação disponível não permite conclusão específica sobre o histórico. Trajetória não documentada aqui não é trajetória inexistente."* |
| `historico-ressalva` | Com ressalva | *"O histórico registra vínculos e instituições. Concluo pelo que a trajetória descreve, não pelo nome das instituições em que ocorreu."* |

### 3.4 `MODELO_DECISAO_COMPARTILHADA` — natureza `RELACIONAL`

| # | Situação | Texto |
|---|---|---|
| `decisao-suficiente` | Elementos suficientes | *"As condutas declaradas descrevem como as decisões são apresentadas e discutidas, e permitem juízo relacional sobre este aspecto."* |
| `decisao-parcial` | Elementos parciais | *"As condutas declaradas descrevem parte de como a decisão é conduzida. Concluo sobre o que foi declarado, sem supor o restante."* |
| `decisao-insuficiente` | Informação insuficiente | *"Não há elementos suficientes para concluir como a decisão é conduzida. A ausência de declaração não afirma ausência da conduta."* |
| `decisao-ressalva` | Com ressalva | *"As condutas declaradas indicam a forma de conduzir a decisão, e registro que declaração de conduta não é observação de prática."* |

### 3.5 `MODELO_PREFERENCIAS_E_RESTRICOES` — natureza `RELACIONAL`

| # | Situação | Texto |
|---|---|---|
| `preferencias-suficiente` | Elementos suficientes | *"As condutas declaradas descrevem como preferências e restrições da pessoa são acolhidas na prática relatada."* |
| `preferencias-parcial` | Elementos parciais | *"As condutas declaradas cobrem parte do que este aspecto envolve. Concluo sobre o que consta, sem estender às situações não declaradas."* |
| `preferencias-insuficiente` | Informação insuficiente | *"Não há elementos suficientes para concluir sobre o acolhimento de preferências e restrições. A falta de declaração não afirma recusa."* |
| `preferencias-ressalva` | Com ressalva | *"Há condutas declaradas sobre preferências e restrições. Registro que o declarado descreve intenção de conduta, não garantia de como ocorrerá."* |

### 3.6 `MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS` — natureza `RELACIONAL`

| # | Situação | Texto |
|---|---|---|
| `noticias-suficiente` | Elementos suficientes | *"As condutas declaradas descrevem como notícias difíceis são conduzidas, e permitem juízo relacional sobre este aspecto."* |
| `noticias-parcial` | Elementos parciais | *"As condutas declaradas descrevem parte da condução de notícias difíceis. Concluo sobre o que está descrito, sem supor o restante."* |
| `noticias-insuficiente` | Informação insuficiente | *"Não há elementos suficientes para concluir sobre a condução de notícias difíceis. A ausência de declaração não afirma ausência da conduta."* |
| `noticias-ressalva` | Com ressalva | *"As condutas declaradas descrevem o que se faz ao dar uma notícia difícil. Registro que isso descreve conduta, não disposição pessoal."* |

### 3.7 As quatro guardas de conteúdo, embutidas nos textos

| Risco nomeado na missão | Onde está protegido |
|---|---|
| §14 — tempo de prática ≠ qualidade | `experiencia-suficiente`: *"não pelo tempo de prática"* |
| §15 — prestígio institucional ≠ mérito | `historico-ressalva`: *"não pelo nome das instituições"* |
| §17 — não afirmar que "respeitará" | `preferencias-ressalva`: *"intenção de conduta, não garantia"* |
| §18 — empatia presumida ≠ conduta | `noticias-ressalva`: *"descreve conduta, não disposição pessoal"* |

**A ressalva de cada conceito é onde mora o risco daquele conceito.** Não é
decoração da quarta opção: é a linha que impede a leitura fácil e errada.

## 4. Regra de natureza — conferida texto a texto

**Os doze textos `TECNICO`** falam de documentação, registro, trajetória,
extensão e contexto da prática. **Nenhum** menciona vínculo, escuta, acolhimento
ou relação com a pessoa.

**Os doze textos `RELACIONAL`** falam de condutas declaradas e de como algo é
conduzido. **Nenhum** menciona qualificação, formação, competência, titulação ou
mérito.

> Bibliotecas **separadas por natureza, sem texto compartilhado**. Nenhuma frase
> universal cruza os dois territórios — e é por isso que há 24 textos e não um
> conjunto genérico de quatro.

## 5. P-04 — a opção 3 existe em todos os seis

Cada conceito tem uma alternativa de insuficiência, e **todas** dizem
explicitamente que a falta de registro não afirma a falta da característica:
*"não afirma ausência de formação"* · *"não afirma falta de prática"* ·
*"trajetória não documentada aqui não é trajetória inexistente"* · e a mesma
construção nos três relacionais.

**Nenhum dos 24 textos transforma lacuna em negativo.**

## 6. "Aponta, nunca copia"

Os textos são **canônicos e cegos ao caso** — não têm como reproduzir evidência,
porque nunca a recebem. A doutrina fica preservada **por construção**, não por
validação. O Curador contextualiza editando.

## 7. UX

```
┌─ Cartão do conceito ────────────────────────────────┐
│  Evidências referenciadas (a conclusão aponta…)     │
│   ☐ resumo · v2 · nao_verificado                    │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ A sua conclusão — expressa, curta, sua.        │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  [ Modelos de redação ]                              │
│                                                      │
│  ── após abrir ─────────────────────────────────────│
│  Modelos de redação — nenhum é uma conclusão.        │
│  Escolha, edite ou ignore.                           │
│                                                      │
│  Elementos suficientes      "…"     [ Usar este ]   │
│  Elementos parciais         "…"     [ Usar este ]   │
│  Informação insuficiente    "…"     [ Usar este ]   │
│  Com ressalva               "…"     [ Usar este ]   │
│                                            [ ✕ ]     │
│                                                      │
│  Motivo (opcional — nunca exigido)                   │
│  [ Registrar juízo ]                                 │
└──────────────────────────────────────────────────────┘
```

| Regra | Detalhe |
|---|---|
| textarea | **vazio**, sem `defaultValue`, sem carry-forward — **G-2.3-5 preservada** |
| botão | **abaixo** do campo: escrever do zero é o padrão |
| abrir a lista | **não altera** o textarea |
| `Usar este` | copia para o textarea; **100% editável**, nenhuma parte travada |
| sobrescrita | se já houver texto, **confirmação** — mantém o `window.confirm` de `a365c4e`, suficiente nesta versão; **nenhum redesign de modal** |
| `✕` | fecha a lista; não toca o textarea |
| **não há** | estado de carregamento · `Gerar outras` · mensagem de erro · timeout |

## 8. Copy canônica

| Elemento | Texto |
|---|---|
| **cabeçalho do bloco** | *"O Motor lê e sinaliza; a conclusão é sua — registrada, versionada e auditável. Nada é pré-preenchido ou copiado. Se quiser, comece de um modelo de redação e edite livremente."* |
| **botão** | **`Modelos de redação`** |
| **microcopy da lista** | *"Modelos de redação — nenhum é uma conclusão. Escolha, edite ou ignore."* |
| **placeholder** | ***inalterado***: *"A sua conclusão — expressa, curta, sua."* |

**Por que `Modelos` e não `Sugestões`:** a G-2.3-5 acabou de ser emendada
justamente porque a palavra *sugestão* era ambígua. **`Modelo`** descreve o que
a coisa é — texto pré-escrito, igual para todos — e **não reabre a ambiguidade**.

**Por que o placeholder não muda:** com o botão visível logo abaixo, ele não
precisa explicar nada. *"Expressa, curta, sua"* carrega a mensagem de autoria
melhor do que uma instrução — e **um texto a menos é o espírito desta missão**.

**Texto único, sem variante condicional.** Sem flag, sem estado indisponível: a
biblioteca ou existe no build, ou não existe. A dualidade que o contrato
anterior exigia **deixa de ser necessária**.

**Proibido na interface:** *"a IA sugere"* · *"assistência inteligente"* ·
*"melhor texto"* · *"recomendado"* · qualquer marca comercial.

## 9. Privacidade — o gate A-3 e a ADR-056

| Questão | Resposta |
|---|---|
| algum dado profissional sai da Aliviar? | **Não.** A geração não recebe Case, profissional, evidência ou paciente |
| o **gate A-3** se aplica a esta feature? | **Não — torna-se inaplicável.** Some o fluxo que o motivava |
| a **ADR-056** fica resolvida? | **NÃO.** ⚠️ |

> **A distinção é obrigatória e não pode ser abreviada.** A ADR-056 obriga
> documentar a Anthropic como suboperadora porque **o texto clínico da paciente
> sai para a API pelo caminho do ACE**. Esse caminho **continua existindo** e é
> independente desta funcionalidade.
>
> **Remover a Anthropic daqui não cumpre a ADR-056 — apenas deixa de agravá-la.**
> A pendência do Bloco H permanece **integralmente aberta, com o mesmo prazo e o
> mesmo dono**, e **não** deve ser marcada como resolvida em nenhum registro por
> causa desta conversão.

## 10. Arquitetura de dados

Dado declarativo puro, no domínio, sem lógica condicional espalhada na UI:

```ts
type ModeloDeRedacao = {
  id: string;        // estável: "formacao-parcial"
  situacao: SituacaoDoJulgamento;
  texto: string;     // ≤ 280
};

const MODELOS_DE_REDACAO: Record<ConceitoElegivel, readonly ModeloDeRedacao[]>;
```

`ConceitoElegivel` é a **união fechada dos seis** — `AREA` não é membro do tipo,
então sua ausência é erro de compilação, não teste esquecido. A UI só pergunta:
*este conceito tem biblioteca?*

**Versionamento: Git, e basta.** É copy de produto, não regra material: nenhuma
derivação depende dela, nenhuma proveniência a referencia, e **nada do que foi
mostrado é persistido** (§11). Uma tabela versionada contradiria o próprio §11 —
guardaria justamente o que decidimos não guardar.

## 11. Persistência e telemetria

**Persistido: apenas o texto final do textarea, no `Registrar juízo`.**

Nada de `template_id` no julgamento · nenhum registro de qual modelo foi exibido
ou escolhido · nenhuma marca de "assistido" · nenhuma telemetria semântica:
sem similaridade, sem score de edição, sem concordância. **Telemetria de UX, se
um dia fizer sentido, é missão separada.**

## 12. Reaproveitamento e remoção

**Reaproveitar de `a365c4e`** — o desenho visual já está certo:

| Peça | Ajuste |
|---|---|
| bloco de alternativas, seleção, `Usar esta` | manter — renomear para `Usar este` |
| confirmação de sobrescrita (`window.confirm`) | **manter como está** |
| botão abaixo do campo, nada pré-selecionado, `✕` | manter |
| estado de carregamento · `Gerar outras` · desfechos de erro · limite de 3 gerações | **remover** — perderam objeto |

**Remover da feature** (nada disto tem outro uso):

| Alvo | Observação |
|---|---|
| `src/modules/curadoria/assistencia-de-redacao.ts` | prompt, schema, validação de saída generativa — **substituído** pela biblioteca |
| `src/modules/curadoria/assistencia-de-redacao-actions.ts` | a action de geração deixa de existir; **não há chamada ao servidor** |
| `tests/unit/assistencia-de-redacao.test.ts` · `tests/components/assistencia-de-redacao.test.tsx` | substituídos pelo pacote do §13 |
| flag `ASSISTENCIA_DE_REDACAO_IA` e o `assistenciaDisponivel` do `page.tsx` | **§14** |
| alargamento em `language-model.ts` (`protocolId`/`protocolVersion` opcionais, `usageId`) | criado **exclusivamente** para este recurso ⇒ reverter, para a porta não carregar generalidade morta |
| usos correspondentes em `anthropic-language-model.ts` e `fake-language-model.ts` | idem |

> ⚠️ **Não remover a infraestrutura do Concierge.** `getAceLanguageModel()`, a
> detecção de produção e os dois adaptadores **continuam servindo ao ACE** e
> **não** são tocados. O `timeout` por chamada, se a engenharia julgar útil ao
> ACE, **pode ficar** — desde que **não altere comportamento do ACE**. É a única
> peça do alargamento que pode sobreviver por mérito próprio, e é decisão do
> `03 ENGENHEIRO`, não desta missão.

## 13. Testes

Os vinte da missão. **Três deixam de precisar de teste porque viram
impossibilidade estrutural** — e isso é o ganho:

| # | Caso | Esperado |
|---|---|---|
| 1 | os seis conceitos | têm biblioteca |
| 2 | `AREA` | **não é membro do tipo** — erro de compilação, além do teste |
| 3 | todos os 24 textos | **≤ 280 caracteres** |
| 4 | textarea | inicia vazio |
| 5 | abrir a lista | não altera o textarea |
| 6 | `Usar este` | copia corretamente |
| 7 | após usar | totalmente editável |
| 8 | escrever do zero | funciona |
| 9 | sobrescrita | exige confirmação |
| 10 | `Registrar juízo` | grava só o texto final |
| 11 | qualquer modelo | não cria ato |
| 12 | provider | **zero import** de `language-model` no caminho da feature |
| 13 | rede | **zero chamada** — asserção estrutural |
| 14 | Case | nenhuma dependência na montagem |
| 15 | profissional | nenhuma dependência na montagem |
| 16 | natureza | nenhum texto `TECNICO` fala de relação; nenhum `RELACIONAL` fala de mérito — **lista de termos, sobre as 24 constantes** |
| 17 | P-04 | os seis têm alternativa de insuficiência, e nenhuma afirma ausência da característica |
| 18 | persistência | zero `template_id`, zero registro de exibição |
| 19 | autoria | `author_id` continua do Curador |
| 20 | Motor · Regra 001 · DR3 · CD-1 · R-1 | **delta zero** |

> **12, 13, 14 e 15 tornaram-se triviais.** Antes exigiam mocks de provider,
> asserção de payload e teste de vazamento entre Cases; agora bastam asserções
> de importação, porque **não existe caminho** por onde vazar. É a medida real
> da simplificação.

## 14. Feature flag

**Recomendação: nenhuma.** O flag existia para conter o suboperador. Sem
provider, sem rede e sem gate jurídico, ele passa a esconder **copy** atrás de
configuração — e configuração que ninguém precisa mudar é dívida.

A biblioteca segue o rito normal (`02` → `03` → `04` → `05` → publicação). Se o
DT-01 quiser rollout gradual, usar **mecanismo existente**, sem infraestrutura
nova.

## 15. Migration, ADR e escopo

| Pergunta | Resposta |
|---|---|
| **Migration?** | **NÃO** — nada em banco |
| **Nova ADR?** | **NÃO.** Esta missão **reduz** superfície: remove um suboperador de um fluxo, não abre nada. As autoridades vigentes (Princípio 6, G-2.3-5 emendada, ADR-067) já bastam, e a decisão do DT-01 está registrada neste contrato |
| **Escopo tocado** | apenas a superfície do Juízo e o pacote de `a365c4e` |
| **Não tocado** | Via C · R-1 · Regra 002 · WARN de `search_path` · redirects · Motor · Fronteira · DR3 · CD-1 |

## 16. Veredito

> ### BIBLIOTECA DETERMINÍSTICA DE REDAÇÃO — CONTRATO PRONTO PARA IMPLEMENTAÇÃO
>
> **24 textos canônicos** — quatro situações × seis conceitos —, todos abaixo de
> 280 caracteres, com bibliotecas **separadas por natureza** e alternativa de
> insuficiência em todos os seis (P-04).
>
> **A ressalva de cada conceito carrega a guarda daquele conceito:** tempo de
> prática não é qualidade · instituição não é mérito · intenção declarada não é
> garantia · conduta não é disposição pessoal.
>
> **Sem migration. Sem ADR nova. Sem flag. Sem provider. Sem rede.** O gate A-3
> torna-se inaplicável — mas a **ADR-056 permanece integralmente aberta**, e não
> deve ser marcada como resolvida por causa desta conversão.
>
> **G-2.3-5 preservada:** campo vazio, nada entra sem ato do Curador, autoria
> exclusivamente humana. **CD-1 e R-1 intocadas.**
