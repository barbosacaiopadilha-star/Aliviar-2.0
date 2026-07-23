# Vertical Slice 02 — Compartilhar Contexto

**Data:** 2026-07-22

## Objetivo

Experiência de compartilhamento — não tela de upload. O paciente sente que a equipe compreende melhor sua história.

## Capacidades

| Área | Implementação |
|---|---|
| Documentos | Referência via JourneyMemory (`referenceAttachment`, categoria DOCUMENTO) |
| Referências | Links e materiais externos (categoria REFERENCIA) |
| Observações | Notas visíveis à curadoria (`addNote`) |
| Organização | Projeção agrupada por tipo |
| Histórico | Timeline da memória compartilhada |

## Consumo exclusivo

Journey (Kernel) · JourneyMemory · Identity · Case · Handoff

## Fluxo validado

```
Portal (/portal)
  → Compartilhar contexto (/portal/compartilhar)
  → JourneyMemory atualizada
  → Curadoria recebe contexto (buildCuradoriaContextoView)
```

## RC

```bash
npm run vertical-slice:rc
npm run test
npm run build
```
