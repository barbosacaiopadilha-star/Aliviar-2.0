# D-11 · Ordem entre o Primeiro Encontro e a validação dos mapas

**Classificação:** DECISÃO / REGRA OPERACIONAL NECESSÁRIA
**Status:** registrado, **não corrigido**
**Origem:** teste material do §6/§7 da missão D-9F

---

## O que a regra de produto diz

> A validação **definitiva** dos mapas de prioridades e preferências ocorre no
> Primeiro Encontro com o Curador.

## O que o produto faz hoje

**Resultado C do §7: o sistema PERMITE.**

Num Case criado **inteiramente sob D-9** — banco recriado do zero, 117 de 117
migrations, cenário montado pelo seed oficial:

| fato | estado |
|---|---|
| `meeting_scheduled_at` | **nulo** — encontro nem agendado |
| `meeting_held_at` | **nulo** — encontro não realizado |
| `understanding_confirmed_at` | **nulo** — história nem reconhecida |
| `validated_at` | **presente** |
| `priority_profiles.status` | **`VALIDATED`** |

Os mapas estão validados sem que exista **nenhum** dos fatos que deveriam
precedê-los. Não é resíduo pré-D9: o Case nasceu depois dela.

## O que exatamente foi exercitado

O cenário foi produzido pelo **seed oficial**, que chama a camada de repositório
e de ações programaticamente — não por um humano clicando na UI. Portanto o que
está provado é:

- **a camada de ação/repositório permite** validar os mapas sem o encontro;
- **não está provado** que a UI do Curador ofereça esse caminho.

A distinção importa para decidir **onde** impor a ordem, e é justamente a
pergunta que esta decisão precisa responder.

## A pergunta a decidir

Qual camada deve impor a ordem?

- **UI** — esconder/desabilitar a validação antes do encontro;
- **Server Action** — recusar o ato, com mensagem própria;
- **domínio** — regra explícita no modelo;
- **banco** — constraint;
- **combinação**.

Cada uma tem custo diferente, e a escolha muda o que acontece com os Cases que
já estão neste estado.

## Preparação ≠ validação definitiva

A distinção que a decisão precisa preservar (§9):

| ato | quando pode ocorrer |
|---|---|
| Curador lê a história | antes do encontro |
| Curador prepara o Perfil / rascunha os mapas | antes do encontro |
| Curador organiza os dados | antes do encontro |
| **validação definitiva com a paciente** | **no Primeiro Encontro** |

Hoje o produto tem **um** `validated_at`, e ele não distingue rascunho de
validação definitiva. Se a decisão for que preparar e validar são atos
diferentes, isso pode exigir mais do que uma constraint.

## O que NÃO foi feito

Zero constraint · zero alteração de action · zero trigger · zero mudança de
domínio — conforme §8.
