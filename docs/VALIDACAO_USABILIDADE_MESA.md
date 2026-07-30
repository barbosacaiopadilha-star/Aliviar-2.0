# Validação de Usabilidade da Mesa do Curador — Ficha de Sessão

> Documento operacional da sessão do PROMPT 8. Preenchido durante o teste com
> pessoa real no papel de Curador. Não é documento canônico de arquitetura.

## Como preparar (já automatizado)

```bash
# 1. Semear o Case no estado inicial recomendado (idempotente; pode repetir
#    para resetar a sessão — zera pesos, declarações e seleção):
SEED_MESA=1 npx vitest run --config vitest.integration.config.ts tests/integration/seed-validacao-mesa.integration.test.ts

# 2. Servidor local (usa .env.development.local -> Supabase local):
npm run dev
```

Entrar como **curador_medico** (credenciais em `test-users.local.json`).
O seed imprime o endereço direto da Mesa.

**Estado inicial garantido pelo seed:** Perfil validado · pesos não
distribuídos · nenhuma declaração de área · nenhuma seleção · Fixtures A–D
publicadas com dossiês e fontes sintéticas.

## Instrução única ao participante

> "Conduza a Curadoria Técnica deste Case até deixar três opções prontas para
> seguir ao Relatório."

Não explicar onde ficam os pesos, como abrir evidências, o significado da
cobertura nem a sequência. Quando pedir ajuda, registrar **o que perguntou,
onde, após quanto tempo, e qual elemento não comunicou** — só então dar a
ajuda mínima.

## Sessão

| Campo | Valor |
|---|---|
| Data | |
| Ambiente | local (Supabase local + `npm run dev`) |
| Papel | curador_medico |
| Case | `[CERTIFICAÇÃO] Curadoria — Ortopedia de coluna` |
| Participante (papel de Curador) | |
| Observador | |

## Roteiro e resultado

| # | Tarefa | Sem ajuda | Com ajuda | Não concluiu | Tempo ~ | Dificuldade observada |
|---|---|---|---|---|---|---|
| 1 | Compreender o estado do Case | ☐ | ☐ | ☐ | | |
| 2 | Distribuir orçamento técnico (50) | ☐ | ☐ | ☐ | | |
| 3 | Distribuir orçamento pessoal (50) | ☐ | ☐ | ☐ | | |
| 4 | Declarar compatibilidade de área | ☐ | ☐ | ☐ | | |
| 5 | Explicar por que a Fixture D saiu | ☐ | ☐ | ☐ | | |
| 6 | Comparar A, B e C | ☐ | ☐ | ☐ | | |
| 7 | Interpretar "90 dos 100 pontos" | ☐ | ☐ | ☐ | | |
| 8 | Abrir evidências e voltar | ☐ | ☐ | ☐ | | |
| 9 | Selecionar exatamente três | ☐ | ☐ | ☐ | | |
| 10 | Chegar à continuação para o Relatório | ☐ | ☐ | ☐ | | |

### Verificações críticas (falha = revisar antes de validar)

- [ ] NÃO confundiu eliminado com pendente de informação
- [ ] NÃO leu "não avaliável" como zero ou reprovação
- [ ] NÃO leu cobertura 90 como nota, qualidade ou probabilidade
- [ ] NÃO procurou uma "nota" para explicar a eliminação da Fixture D
- [ ] NÃO acreditou que o sistema escolheu ou recomendou alguém
- [ ] NÃO tentou avançar com pesos incompletos sem entender o bloqueio

## Achados

| Prioridade (Crítico/Alto/Médio/Baixo) | Tarefa | Problema observado | Evidência (o que a pessoa disse/fez) | Correção proposta |
|---|---|---|---|---|
| | | | | |

## Regras de correção (lembrete)

Corrigir só o que foi **observado**: crítico, alto e médio objetivo. Sem
redesign, sem solução para problema hipotético. Depois de corrigir crítico ou
alto: resetar o seed, repetir só a tarefa afetada, e pinar em teste
automatizado.

## Resultado final

| Pergunta | Sim/Não |
|---|---|
| Entendeu o estado do Case? | |
| Distribuiu os dois orçamentos sem calcular? | |
| Diferenciou filtro de peso? | |
| Diferenciou eliminado de pendente? | |
| Interpretou corretamente a cobertura? | |
| Encontrou as evidências? | |
| Comparou os três? | |
| Selecionou exatamente três? | |
| Entendeu a continuação para o Relatório? | |

**Gate:** ☐ MESA VALIDADA PARA ENTRADA DE DADOS REAIS · ☐ MESA VALIDADA COM
RESSALVAS · ☐ MESA NÃO VALIDADA

A Rede real permanece, separadamente: **REDE REAL AINDA NÃO PRONTA**.
