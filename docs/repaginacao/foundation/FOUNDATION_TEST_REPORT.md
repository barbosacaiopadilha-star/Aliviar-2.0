# Fundação · Relatório de testes

## Novos — 35

| Suíte | Testes | Cobre |
|---|---|---|
| `tests/unit/foundation-contrato-de-estado.test.ts` | **22** | CASO 1–8 do §18 + as regras de segurança do §17 |
| `tests/components/foundation-primitivos.test.tsx` | **13** | tokens, `StateMark`, `Badge`, reduced motion, teste de perda |

Os oito casos não são cenários imaginados: **cada um é uma contradição que a
auditoria encontrou em produção.**

## As regras de segurança, varridas sobre todos os estados

Nove conjuntos de fatos × cinco asserções, de uma vez: nenhum rótulo de paciente
contém `_`, id, `null` ou o enum · nenhum promete prazo · `temConteudoParaPaciente`
só é verdadeiro com entrega ou conclusão reais · todo tom pertence à gramática
certificada · **verde nunca aparece sem processo concluído**.

## Teste de perda (§27)

| Garantia | Como cai |
|---|---|
| símbolo por papel | remover um papel de `SINAL_DO_PAPEL` deixa a cobertura incompleta |
| distinção por classe | dois papéis com a mesma classe derrubam a asserção de unicidade |
| reduced motion | folha sem `prefers-reduced-motion` derruba a varredura das quatro |
| derivação de estado | história `null` que devolvesse `HISTORIA_NAO_INICIADA` derruba o CASO 8 |
| `waitingOn` | pendência sem destinatário que não devolvesse `INDETERMINADO` derruba o CASO 7 |

## Regressão

| Suíte | Resultado |
|---|---|
| typecheck | **limpo** |
| lint | **5 warnings — os mesmos 5 da base**, zero erros, zero novo |
| components | **594/594** (58 arquivos) |
| unit | **2503/2504** |
| build:local | **íntegro** · 396 arquivos · backend único |
| integration | ⚠️ **ver abaixo** |

### Não-regressão da Mesa

Os **37 testes** de orientação visual da Mesa continuam verdes depois de (a)
promover o vocabulário para a Fundação e (b) mover a gramática cromática para
`globals.css`. É a prova de que a promoção preserva comportamento.

### CRLF

`mecanismo-de-discordancia > G-6` — ambiental, pré-existente, idêntica desde a
Rodada 1. Delta com zero `.sql`.

### Integração — 69 falhas, e a causa NÃO é o código

O banco local carrega resíduo de medições anteriores desta sessão, e uma guarda
recusa rodar com ele:

```
A1.1 deixou resíduo: evidencias|map|cases|prioridades = 3|9|1|28
```

**Provado por exclusão, não por argumento:** com a árvore revertida à base
`f951a25` — zero linhas da Fundação — a suíte falha **idêntica**: 13 arquivos,
**69 falhas, 817 passando**. Os mesmos números.

**Correção pertence ao ambiente, não a esta missão:** `npx supabase db reset`
seguido de `npm run bootstrap:test-users`. Não executei — é destrutivo sobre a
stack local, que é compartilhada, e a decisão é do DT-01.
