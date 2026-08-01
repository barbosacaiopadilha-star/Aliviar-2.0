# RC1 — Publicação dos três primeiros profissionais reais

> Documento de operação. **Não descreve arquitetura, não abre backlog, não fala de versões futuras.**
> É o passo a passo para levar três médicos reais até a rede publicada da Aliviar — o único bloqueador que resta para a primeira paciente.
> **Data:** 2026-08-01 · **Ambiente:** produção

---

# 0 · Por que exatamente três

O banco recusa qualquer Relatório que não apresente **exatamente três opções**. Não é preferência: é regra do Método, imposta pelo próprio sistema.

Com dois profissionais publicados, **nenhuma Curadoria pode ser entregue**. A paciente percorreria a história, a Consulta Inicial, o Perfil e o reconhecimento — e o Curador não teria o que apresentar.

**Três é o mínimo que abre a operação. Nada abaixo disso funciona.**

E há uma regra que não tem exceção: **nenhum profissional de demonstração pode ser publicado.** O banco bloqueia. Os seis perfis "DEMO_" existentes não contam e nunca contarão.

---

# 1 · Checklist de um profissional

*Copie este bloco uma vez para cada médico. Nenhum item é opcional — cada um corresponde a uma verificação que o sistema faz na hora de publicar.*

## 1.1 · Identificação

| | Item | Observação |
|---|---|---|
| ☐ | **Nome de exibição** | como a paciente vai lê-lo |
| ☐ | **CRM** | número real, conferido no documento |
| ☐ | **UF do CRM** | duas letras maiúsculas — `SP`, `RJ`, `MG` |
| ☐ | **Identificador interno** | referência única da Aliviar |

> **Não preencher CRM sem o documento em mãos.** Número aproximado, lembrado ou "confirmado por telefone" não serve.

## 1.2 · Verificação do registro

| | Item | Observação |
|---|---|---|
| ☐ | **Registro consultado no conselho** | consulta feita de verdade, não presumida |
| ☐ | **Resultado: regular** | se vier irregular ou não localizado, **para aqui** |
| ☐ | **Fonte da consulta** | onde foi consultado — portal do CRM da UF, etc. |
| ☐ | **Data da consulta** | quando |
| ☐ | **Responsável pela verificação** | quem, com nome |

> Os três últimos são **inseparáveis**. O sistema recusa registro marcado como regular sem fonte, data e responsável. Isso existe para que, meses depois, seja possível dizer **quem** verificou e **quando** — e não apenas que alguém verificou.

## 1.3 · Área de atuação

| | Item |
|---|---|
| ☐ | **Área cadastrada** |
| ☐ | **Área verificada** — ao menos uma com verificação registrada |

> Sem uma área verificada, a publicação é recusada. Área declarada e não conferida não conta.

## 1.4 · Mapa do Profissional — os 26 subcritérios

Cada subcritério recebe um dos três estados: **confirmado**, **não confirmado** ou **não informado**.

> **"Não informado" é resposta legítima e completa.** Significa que alguém olhou e não encontrou informação suficiente — diferente de ninguém ter olhado. **Não deixe em branco para "resolver depois": o branco não é um estado, é uma ausência, e o Motor vai devolver lacuna.**
>
> Nenhum subcritério recebe nota, peso ou adjetivo de qualidade. Registra-se o que a prática dele é, não quão bom ele é.

**ACESSO** (4)

| | Código | Subcritério | preenchido | validado |
|---|---|---|---|---|
| 1 | `ACESSO_LOCALIZACAO` | Localização | ☐ | ☐ |
| 2 | `ACESSO_MODALIDADE` | Modalidade de atendimento | ☐ | ☐ |
| 3 | `ACESSO_DISPONIBILIDADE` | Disponibilidade | ☐ | ☐ |
| 4 | `ACESSO_PRAZO_PARA_CONSULTA` | Prazo para a consulta | ☐ | ☐ |

**CONTINUIDADE DO CUIDADO** (4)

| | Código | Subcritério | preenchido | validado |
|---|---|---|---|---|
| 5 | `CONTINUIDADE_RETORNOS` | Retornos | ☐ | ☐ |
| 6 | `CONTINUIDADE_POS_PROCEDIMENTO` | Acompanhamento pós-procedimento | ☐ | ☐ |
| 7 | `CONTINUIDADE_EQUIPE_DE_APOIO` | Equipe de apoio | ☐ | ☐ |
| 8 | `CONTINUIDADE_COORDENACAO` | Coordenação com outros profissionais | ☐ | ☐ |

**EXPERIÊNCIA** (4)

| | Código | Subcritério | preenchido | validado |
|---|---|---|---|---|
| 9 | `EXPERIENCIA_TEMPO_DE_PRATICA` | Tempo de prática | ☐ | ☐ |
| 10 | `EXPERIENCIA_CASOS_SEMELHANTES` | Casos semelhantes | ☐ | ☐ |
| 11 | `EXPERIENCIA_CONDICAO_OU_PROCEDIMENTO` | Condição ou procedimento | ☐ | ☐ |
| 12 | `EXPERIENCIA_VOLUME_DE_ATUACAO` | Volume de atuação | ☐ | ☐ |

**FORMAÇÃO** (5)

| | Código | Subcritério | preenchido | validado |
|---|---|---|---|---|
| 13 | `FORMACAO_GRADUACAO` | Graduação | ☐ | ☐ |
| 14 | `FORMACAO_RESIDENCIA` | Residência médica | ☐ | ☐ |
| 15 | `FORMACAO_ESPECIALIZACAO` | Especialização | ☐ | ☐ |
| 16 | `FORMACAO_FELLOWSHIP` | Fellowship | ☐ | ☐ |
| 17 | `FORMACAO_COMPLEMENTAR` | Formação complementar | ☐ | ☐ |

**HISTÓRICO** (4)

| | Código | Subcritério | preenchido | validado |
|---|---|---|---|---|
| 18 | `HISTORICO_REGULARIDADE` | Regularidade profissional | ☐ | ☐ |
| 19 | `HISTORICO_TRAJETORIA_INSTITUCIONAL` | Trajetória institucional | ☐ | ☐ |
| 20 | `HISTORICO_PRODUCAO_ACADEMICA` | Produção acadêmica | ☐ | ☐ |
| 21 | `HISTORICO_ENSINO_E_PESQUISA` | Ensino e pesquisa | ☐ | ☐ |

**MODELO DE ATENDIMENTO** (5)

| | Código | Subcritério | preenchido | validado |
|---|---|---|---|---|
| 22 | `MODELO_COMUNICACAO` | Comunicação | ☐ | ☐ |
| 23 | `MODELO_DECISAO_COMPARTILHADA` | Decisão compartilhada | ☐ | ☐ |
| 24 | `MODELO_PARTICIPACAO_FAMILIAR` | Participação da família | ☐ | ☐ |
| 25 | `MODELO_ALTERNATIVAS` | Explicação de alternativas | ☐ | ☐ |
| 26 | `MODELO_PREFERENCIAS_E_RESTRICOES` | Preferências e restrições | ☐ | ☐ |

**☐ Os 26 tratados** — nenhum em branco.

## 1.5 · Publicação

| | Item |
|---|---|
| ☐ | **Nenhuma divergência crítica em aberto** no cadastro |
| ☐ | **Status: ativo** |
| ☐ | **Não é DEMO** |
| ☐ | **Publicado** |
| ☐ | **Elegível** — aparece na consulta da Curadoria |

---

# 2 · Os três blocos

Use a checklist da §1 três vezes, de forma independente. **Um profissional incompleto não é compensado por outro completo.**

## Profissional 1

☐ Identificação ☐ Verificação ☐ Área ☐ Mapa (26/26) ☐ Publicação

**Nome:** ______________________ **CRM/UF:** ____________ **Verificado por:** ____________ **Data:** ______

## Profissional 2

☐ Identificação ☐ Verificação ☐ Área ☐ Mapa (26/26) ☐ Publicação

**Nome:** ______________________ **CRM/UF:** ____________ **Verificado por:** ____________ **Data:** ______

## Profissional 3

☐ Identificação ☐ Verificação ☐ Área ☐ Mapa (26/26) ☐ Publicação

**Nome:** ______________________ **CRM/UF:** ____________ **Verificado por:** ____________ **Data:** ______

---

# 3 · Responsáveis por etapa

| Etapa | Quem faz | Quem valida | Evidência registrada |
|---|---|---|---|
| Contato e aceite do médico | Direção ou Operação | Direção | Aceite do profissional |
| Coleta de identificação e CRM | Operação | Administrador | Nome, CRM, UF no cadastro |
| **Consulta ao conselho** | **Operação** | **Administrador** | Fonte, data e responsável no registro |
| Cadastro da área de atuação | Operação | **Curador** | Área com verificação registrada |
| **Preenchimento do Mapa (26)** | **Curador** | Curador | Mapa completo no cadastro |
| Conferência de divergências | Administrador | Administrador | Nenhuma crítica em aberto |
| **Ativação e publicação** | **Administrador** | Direção | Status publicado |
| Confirmação de elegibilidade | Administrador | Curador | Perfil aparece na consulta da Curadoria |

> **A publicação é sempre um ato do administrador, com verificação de outra pessoa.** Ninguém publica o profissional que cadastrou sozinho.

---

# 4 · Critérios de GO

**Um profissional está publicado quando as sete condições valem ao mesmo tempo:**

1. Não é DEMO
2. Status **ativo**
3. **CRM e UF** preenchidos
4. Registro **regular**, com **fonte, data e responsável**
5. Ao menos uma **área de atuação verificada**
6. **Nenhuma divergência crítica** em aberto
7. Publicação efetivada

**E está elegível para a Curadoria quando, além disso:**

8. **Os 26 subcritérios do Mapa foram tratados**

> As sete primeiras o sistema exige — sem elas a publicação é recusada com mensagem dizendo o que falta. **A oitava o sistema não exige, mas sem ela o Motor devolve lacuna em tudo e o Curador não tem o que apresentar.** Publicar sem Mapa é publicar um nome vazio.

---

# 5 · Critérios de NO GO

**Impede publicar — o sistema recusa:**

- É perfil de demonstração
- CRM ou UF ausentes
- Registro não verificado, ou verificado como **irregular** ou **não localizado**
- Registro marcado como regular **sem** fonte, data ou responsável
- Nenhuma área de atuação verificada
- Divergência **crítica** em aberto

**Impede operar — o sistema aceita, mas a Curadoria não funciona:**

- Mapa incompleto ou em branco
- Status inativo
- Menos de três profissionais publicados no total

**Impede por decisão nossa, mesmo que o sistema aceite:**

- CRM conferido por telefone, sem documento
- Área declarada pelo próprio médico e não conferida
- Mapa preenchido "no chute" para destravar a publicação

> **Nenhum destes se resolve baixando a exigência.** Se um profissional não passa, o caminho é completar o dado — nunca contornar a regra.

---

# 6 · Validação final dos três juntos

☐ **Existem exatamente três profissionais elegíveis**
☐ **Todos aparecem na consulta canônica da Curadoria**
☐ **Todos podem entrar em um Relatório** — o Curador consegue montar uma seleção com os três
☐ **Todos podem ser escolhidos** — a paciente consegue escolher qualquer um dos três
☐ **Nenhum é DEMO**

**Teste que fecha:** abra um Case de teste, monte o Perfil, preencha o Mapa de Prioridades e chegue até a emissão do Relatório. **Se o Relatório emitir, a rede está pronta.** Se recusar, a mensagem dirá o que falta. Descarte o Case de teste ao final.

---

# 7 · Onde estamos hoje

## Quantos profissionais faltam?

# Três.

Estado verificado em produção:

| | |
|---|---|
| Profissionais reais publicados | **0** |
| Publicados no total | **0** |
| Perfis DEMO | 6 *(não contam, nunca contarão)* |
| Registros verificados como regulares | **0** |
| Áreas de atuação verificadas | **0** |

## O que falta em cada um?

**Tudo.** Não há profissional real cadastrado pela metade — **não há nenhum**. Cada um dos três precisa da checklist inteira da §1, do começo ao fim.

## Qual é a primeira ação da operação amanhã?

**Definir quais são os três médicos.**

Não é uma tarefa de sistema — é decidir, com nome e sobrenome, quem serão os três primeiros profissionais da rede Aliviar. Sem isso, nenhum campo pode ser preenchido, porque **não há dado a inventar**.

Feita a escolha, a ordem é:

1. Confirmar o aceite de cada um
2. Obter CRM e UF **com documento**
3. **Consultar o conselho** e registrar fonte, data e responsável
4. Cadastrar e verificar a área de atuação
5. **Curador preenche os 26** subcritérios
6. Administrador publica, com verificação de outra pessoa
7. Rodar o teste da §6

**Os passos 1 a 3 são os que levam tempo real** — dependem de conversa e de consulta externa. Os passos 4 a 7 acontecem numa tarde.

---

> **A Aliviar está pronta para atender. Falta a quem ela vai apresentar.**
