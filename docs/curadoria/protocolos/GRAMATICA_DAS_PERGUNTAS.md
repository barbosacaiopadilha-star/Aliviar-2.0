# Gramática das Perguntas — Protocolos Oficiais da Curadoria

> **Status:** instrumento oficial derivado do Catálogo Canônico 1.0.0 (congelado 2026-07-31).
> Esta gramática governa TODA pergunta dos dois protocolos. Pergunta que não obedece à gramática não entra em protocolo — nem por exceção.

## 1. A regra única

**Toda pergunta serve a um conceito do Catálogo, e todo conceito coberto por pergunta é coberto na linguagem de quem responde.** O conceito nunca muda; a língua sim.

| Quem responde | Língua |
|---|---|
| A pessoa | a da vida dela — nunca jargão clínico, nunca o nome do conceito |
| O profissional | a da prática — situações concretas, nunca autoavaliação |
| O Curador | a do Método — os identificadores canônicos |

## 2. Formas permitidas de resposta

1. **Escolha única** — quando as opções são mutuamente exclusivas.
2. **Múltipla escolha** — quando descrevem amplitude de prática ou de necessidade. **Marcar mais opções nunca significa melhor** (P18 do Catálogo).
3. **Faixa** — para tempo, prazo, custo, frequência. A faixa é canônica; número exato não é coletado quando a faixa basta.
4. **Condição estruturada** — "depende" só existe acompanhado de *de quê*: uma condição escolhida de lista, ou declarada em campo curto anexado à opção.
5. **Escapes obrigatórios** — toda pergunta oferece os que couberem: `NAO_SEI_INFORMAR`, `NAO_SE_APLICA`, e (só do lado da pessoa, em viabilidade) `PREFIRO_NAO_INFORMAR`.

## 3. Texto livre — onde pode e onde jamais

**Pode:** exceção não representada · condição não listada · observação de contexto · evidência (citação do que foi visto/ouvido, com fonte).
**Jamais:** como resposta principal de conceito · como entrada do Motor · como origem de frase automática · como substituto de opção existente.

Campo livre tem teto de 280 caracteres fora da evidência — é apoio, não laudo.

## 4. Gramática do lado da pessoa

1. **Pergunta acolhedora, concreta, sem termo técnico.** *"Como você consegue ser atendida?"*, nunca *"Qual sua preferência de modalidade assistencial?"*
2. **Toda resposta carrega grau**: `ESSENCIAL` (sem isso o cuidado não acontece) · `IMPORTANTE` (pesa muito, não impede) · `DESEJAVEL` (bem-vindo). O grau é declarado pela pessoa ou traduzido pelo Curador — nunca inferido.
3. **Flexibilidade é pergunta própria**, não adivinhação: *"Se não houver X, Y serve para você?"* (sim/não/depende+condição).
4. **"Não tenho preferência" é resposta completa** e encerra o conceito para aquele Case.
5. **Silêncio não é dado.** Conceito não perguntado fica sem registro — jamais preenchido com default.
6. **A pergunta nasce da história quando possível.** O protocolo é conduzido pelo Curador dentro da conversa; os itens "ditos diretamente" podem ser perguntados à queima-roupa, os "reconhecidos" são propostos como tradução: *"Pelo que você me contou, entendi que X — é isso?"*

## 5. Gramática do lado do profissional

1. **Comportamento, nunca opinião.** A pergunta descreve uma situação e pede as ações habituais. Proibido: *"Você se comunica bem?"*. Obrigatório: *"Quando uma pessoa demonstra dificuldade para compreender uma explicação, quais práticas você normalmente utiliza?"*
2. **As opções são condutas observáveis** — algo que uma terceira pessoa poderia testemunhar ou um documento poderia mostrar. Nunca adjetivos ("acolhedor", "humanizado", "excelente").
3. **Seis situações sempre distinguíveis**: prática habitual (opção) · condição (opção+condição) · exceção (complemento livre) · ausência (`NAO_REALIZA`/`NAO_OFERECE` explícito) · desconhecimento (`NAO_SEI_INFORMAR`) · inaplicabilidade (`NAO_SE_APLICA`). Formulário que não separa as seis produz falso `CONFIRMADO`.
4. **Resposta não é evidência** (P20). Toda resposta entra como `declarado, ainda não verificado`; vira `verificado` só quando pessoa autorizada confere a fonte e assina — com fonte, data e responsável, como o banco já exige para área e registro.
5. **Anti-autopromoção estrutural**: nenhuma pergunta permite ao profissional qualificar a si mesmo; superlativos em complemento livre não geram frase nenhuma.

## 6. Gramática das frases automáticas

1. Frase automática é **verbalização fiel de opções selecionadas** — cada termo rastreável a um identificador canônico. Termo sem origem = frase não gerada.
2. A frase fala da **necessidade e da prática registrada**, nunca da pessoa do profissional: *"Você procura X. A prática registrada inclui X."*
3. Estado da informação acompanha quando não verificado: *"...conforme declarado, ainda não verificado"* / *"...verificado em [data]"*.
4. Frases proibidas (§6.4 do doc de operação) valem integralmente: sem adjetivo de qualidade, sem "atende ao seu perfil", sem ranking, score, contagem de opções ou `NAO_ATENDE` automático.

## 7. Validações transversais

- `CONVENIOS_SELECIONADOS` sem lista de operadoras → **inválido**.
- Opção com condição obrigatória sem condição → **inválido**.
- Grau ausente numa resposta da pessoa → **incompleto** (não bloqueia a conversa; bloqueia o fechamento do Perfil).
- Resposta do profissional marcada `verificado` sem fonte+data+responsável → **recusada** (espelha o CHECK do banco).
- Nenhuma resposta de `VIABILIDADE_*` alcança o Motor — guarda de teste prevista no inventário técnico.

## 8. Os 7 testes de existência

Toda pergunta dos protocolos passou por: (1) melhora a Curadoria? (2) melhora o casamento? (3) produz conceito reutilizável? (4) gera frase automática? (5) evita autopromoção? (6) responde-se rápido? (7) **se sumir, o Método recomenda pior?** — reprovou em 7, saiu. O registro da auditoria está em `MAPA_DOS_PROTOCOLOS.md`.
