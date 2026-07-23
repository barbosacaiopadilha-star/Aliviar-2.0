# Vertical Slice 01 — O Primeiro Portal

**Data:** 2026-07-22

## Objetivo

Primeira interface funcional autenticada — a conversa apenas continua.

## Consumo exclusivo

- Kernel (estado operacional)
- Identity (ator paciente)
- Case Registration (paciente)
- Journey Memory (próxima ação)
- Journey Handoff (checkpoint narrativo)

## Tela

Exibe apenas: saudação, nome, estado da jornada, checkpoint narrativo, próxima ação.

Sem menu, dashboard, sidebar, gráficos ou tabelas.

## Fluxo validado

```
Landing (LIMIAR_INVITE)
  → Conversa (CONVERSA_ASK_STORY)
  → JourneyHandoff + Bootstrap
  → Portal (/portal)
```

## RC

```bash
npm run vertical-slice:rc
npm run test
npm run build
```
