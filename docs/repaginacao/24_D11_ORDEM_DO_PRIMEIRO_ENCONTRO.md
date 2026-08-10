# 24 · D-11 — ordem operacional do Primeiro Encontro e validação dos mapas

| Campo | Valor |
|---|---|
| **Autor** | Agente 02 — Arquiteto |
| **Data** | 2026-08-10 |
| **Base** | `a9af018` · árvore limpa exceto dois `??` **pré-existentes** |
| **Natureza** | decisão de domínio. **Zero código, zero migration** |
| **Veredito** | 🔴 **D-11 BLOQUEADO POR DECISÃO DE DOMÍNIO** — colide com a **ADR-042** |

---

## A · A action que grava `validated_at`

**Não é uma. São duas — e só uma é do produto.**

| Caminho | O que é | Chamadores de produção |
|---|---|---|
| **`curadoria.acknowledge_priority_profile(_case_id)`** | função `SECURITY DEFINER`, gate `is_patient_for_case`, grava `status='VALIDATED', validated_at=now()` **e** registra `profile_recognized` em `audit_logs` com `actor_role: 'paciente'` | ✅ **a via vigente** |
| **`repository.ts:176 · validatePriorityProfile`** | `UPDATE` direto na tabela, **sem passar pela função** | ❌ **zero** — só testes e seed |

## B · Superfícies e consumidores

**A cadeia real, do banco à tela:**

```
/paciente (Home)
  → ProfileCard
    → PerfilPanel
      → ReconhecerPerfil            (só quando !perfil.validated)
        → reconhecerPerfilAction    requireRoleForAction("paciente")
          → acknowledge_priority_profile
```

**Condições que a função vigente já impõe:** ser a paciente do Caso · perfil
existir · não estar `VALIDATED` · não estar `SUPERSEDED` ·
`priority_map_pending = 0` · `relational_needs_pending = 0`.

## C · A UI permite hoje? — **SIM, mas não a que a missão supôs**

> ### Não existe validação pelo Curador. Ela foi **removida**, de propósito.

`actions.ts:229` registra, em texto:

> *"O RECONHECIMENTO DO PERFIL SAIU DAQUI — **ADR-042**. `validateProfileAction`
> exigia `requireCurator()` e os 100 pontos… **o ato que o Método define como
> sendo DELA só podia ser executado por outra pessoa, e sob uma condição que
> nunca foi dela**. Foi removida, não desativada."*

**Quem pode validar hoje é a paciente, na Home dela**, assim que o Mapa e o
bloco relacional estiverem completos — **independentemente de qualquer
encontro**.

## D · O seed permite? — **SIM, e é aqui que o cenário nasceu**

O seed chamou **`validatePriorityProfile`**, que faz `UPDATE` direto e **não
passa pela função do banco**. Ele não usou a via do produto — **contornou-a**.

> **O estado observado em D-9F (`validated_at` presente, `meeting_held_at` nulo)
> não prova que o produto permite. Prova que o seed permite.**

**E há um agravante estrutural:** `tests/unit/actions-have-callers.test.ts`
existe justamente porque *"uma action sem chamador é uma promessa que o produto
não cumpre"*. Mas ele cobre **actions**, e `validatePriorityProfile` é **função
de repositório** — **escapa do teste**. É um escritor de produção sem chamador de
produção, e foi por ele que a validação vazou.

## E · "Preparado" × "validado" já existe? — **SIM**

`priority_profiles.status` distingue `VALIDATED` de `SUPERSEDED`, e
**`validated_at = null` já significa exatamente "preparado, ainda não
validado"**.

> **Nenhuma coluna nova é necessária** — o §7 esperava essa resposta, e ela se
> confirma.

## F · 🔴 A colisão

A regra do §4 é: `meeting_held_at is null` → **validação definitiva proibida**.

Mas quem valida é **ela**, e `meeting_held_at` é escrito pelo **Curador**.

> **Condicionar o ato dela ao registro dele é recriar exatamente o acoplamento
> que a ADR-042 removeu** — e a ADR usa estas palavras: *"sob uma condição que
> **nunca foi dela**"*.
>
> `meeting_held_at` **é** uma condição que nunca foi dela.

**Isto não é detalhe de implementação. É contradição de autoridade**, e não
posso resolvê-la sozinho: a ADR-042 é decisão de Método.

### O que o produto já diz — e reforça a tensão

O painel dela já narra o reconhecimento **como tendo acontecido junto**:

> *"Você reconheceu este Perfil em [data]**, junto com [Curador]**."*

**A intenção do produto já é a do §2 desta missão.** O que falta não é a
intenção — é decidir **se ela vira condição**.

## G · Camada de enforcement — três desenhos

| | Desenho | O que muda | Custo | Colide com ADR-042? |
|---|---|---|---|---|
| **1** | **Gate no banco**: `acknowledge_priority_profile` ganha o desfecho `ENCONTRO_NAO_REALIZADO` quando `meeting_held_at is null` | o ato dela passa a depender do registro dele | migration + **emenda de ADR** | ⚠️ **SIM** |
| **2** | **Sequência por desenho**: a Home só oferece o reconhecimento no contexto do encontro; a função **não muda** | muda **quando a porta aparece**, não de quem é o ato | UI/orquestração, **sem migration** | ❌ não |
| **3** | **Fechar só o bypass**: o seed passa a usar a via real; `validatePriorityProfile` é tratado como o que é | nada muda para ninguém no produto | teste/seed | ❌ não |

**Os desenhos 2 e 3 não são alternativos — são complementares, e nenhum precisa
de decisão de Método.**

**O desenho 1 é o único que cumpre o §4 ao pé da letra, e é o único que exige a
emenda.**

### Minha recomendação

> **Fazer o 3 agora. Avaliar o 2. Só adotar o 1 com emenda expressa à ADR-042.**
>
> O 3 fecha o vazamento **observado** sem tocar em autoridade nenhuma. O 2
> entrega o efeito operacional pretendido — o reconhecimento acontece no
> encontro — **sem** transformar o registro do Curador em pré-condição do ato
> dela. O 1 entrega a garantia mais forte, e cobra o preço mais alto.

## H · Migration? — **NÃO, nos desenhos 2 e 3. SIM, no 1.**

No desenho 1: `create or replace` da função + novo desfecho + mensagem. **Sem
coluna nova**, sem backfill.

## I · Seed e fixtures

**Opção C do §6, adotada:** fixtures distintas e nomeadas.

| Fixture | Estado |
|---|---|
| `mapa-preparado` | mapa completo, `validated_at = null`, sem encontro |
| `encontro-realizado` | `meeting_scheduled_at` e `meeting_held_at` preenchidos, `validated_at = null` |
| `perfil-reconhecido` | reconhecimento **pela via real**, após o encontro |
| `adversarial-validado-sem-encontro` | ⚠️ **só existe se declarado**, e o nome diz que é adversarial |

**Regra:** o seed **usa a via do produto**. Quando precisar de estado
impossível pela via normal, **declara** que é adversarial. **Não alterar a
evidência para esconder o problema** — a D-9F fica como está.

## J · Impacto na Mesa

**Nenhum**, em qualquer desenho. O Curador nunca validou; continua não validando.
No desenho 2, ele ganha visibilidade de *"o Mapa está preparado, aguardando o
reconhecimento dela"* — leitura, não ato.

## K · Impacto na Jornada da paciente

**Desenho 3:** nenhum.
**Desenho 2:** o marco *"Reconhecer meu Perfil"* deixa de aparecer solto e passa
a aparecer no contexto do encontro.
**Desenho 1:** ela veria uma recusa causada por um registro que **não é dela** —
e essa é a pior consequência do desenho 1, porque a mensagem teria de explicar
uma dependência que o Método diz não existir.

## L · Critérios de aceite

| # | Critério | Desenho |
|---|---|---|
| **T-D11-1** | preparação antes do encontro continua possível | todos |
| **T-D11-2** | `meeting_held_at` nulo + tentativa de validar → **recusada** | **só 1** |
| **T-D11-3** | `meeting_held_at` presente + requisitos → validação permitida | **só 1** |
| **T-D11-4** | `understanding_confirmed_at` **não** substitui `meeting_held_at` | todos |
| **T-D11-5** | seed não cria `VALIDATED` pré-encontro sem declarar cenário adversarial | **3** |
| **T-D11-6** | a UI não oferece validação prematura | **2** |
| **T-D11-7** | chamada programática direta também é recusada | **1** — e hoje **falha**, porque `validatePriorityProfile` contorna a função |
| **T-D11-8** | validação continua sendo **ato explícito dela** | todos |
| **T-D11-9** | nenhum backfill · nenhum score · handoff Curador→Concierge intacto · D-10 fora | todos |

> **T-D11-7 é o teste que faltava**, e ele reprova o estado atual **em qualquer
> desenho** — porque existe um escritor que não passa pelo gate.

## M · Handoff

**Liberado agora, sem decisão:** o **desenho 3** — seed pela via real, fixtures
nomeadas, e um teste que prove que nenhum caminho de produção grava
`validated_at` fora da função.

**Aguardando o DT-01:** os desenhos **1** e **2**, e a pergunta que os separa —
*o reconhecimento dela pode depender do registro dele?*

---

# D-11 BLOQUEADO POR DECISÃO DE DOMÍNIO

**A regra do §4 não pode ser adotada como está sem emendar a ADR-042.**

O que a auditoria mostrou é melhor do que o temido e diferente do suposto: **o
Curador nunca pôde validar** — a ADR-042 removeu essa porta de propósito. O
vazamento observado veio de **um escritor de repositório sem chamador de
produção**, usado pelo seed.

**Decisão que peço, em uma linha:**

> *O reconhecimento do Perfil — que a ADR-042 declarou ser ato dela, livre de
> condição que não fosse dela — pode passar a depender de `meeting_held_at`,
> registrado pelo Curador?*

**Se sim:** desenho 1, com emenda expressa à ADR-042.
**Se não:** desenhos 3 e 2, que entregam a ordem operacional sem tocar em
autoridade.

**Próximo destinatário:** **`DT-01`**. O desenho 3 pode seguir ao
**`03 ENGENHEIRO`** em paralelo — não depende da resposta.
