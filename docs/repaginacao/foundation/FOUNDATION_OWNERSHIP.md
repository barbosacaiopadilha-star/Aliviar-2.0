# Fundação · Propriedade de arquivo entre as quatro trilhas

> O risco desta fase não é uma trilha errar. É **duas trilhas acertarem
> diferente no mesmo arquivo.**

## As quatro trilhas

**A — Paciente core:** PatientShell · Início · Jornada · Sua História · Central de Documentos
**B — Curadoria e entrega:** Minha Curadoria · Três Caminhos · comparador · sinalização · Concierge · WhatsApp
**C — Curador:** Fila · Mesa · Julgamentos · Composição · Redação · Relatório
**D — Público e operação:** Landing · Login · Admin · CRM · Atendimento

## Compartilhado — nenhuma trilha edita sozinha

| Arquivo / área | Dono | Regra |
|---|---|---|
| `src/app/globals.css` (escala, semântica, gramática de estado) | **Fundação** | extensão registrada; **nunca** cor/raio/tempo novo dentro de uma trilha |
| `src/foundation/estado-visual.ts` | **Fundação** | congelado — os cinco papéis não mudam sem nova decisão |
| `src/foundation/contrato-de-estado.ts` | **Fundação** | estado novo exige fato real; trilha **não** cria macroestado local |
| `src/components/ui/*` | **Fundação** | consolidar sim, bifurcar não; API muda com migração de todos os consumidores |
| `src/components/ui/state-mark.tsx` | **Fundação** | não existe segundo Status |
| `src/components/ui/button.tsx` | **Fundação** | variante nova precisa de justificativa semântica, nunca "por tela" |

## Por trilha — edita à vontade

| Área | Trilha |
|---|---|
| `src/app/patient-dashboard.css` · `src/components/paciente/*` | **A** |
| superfícies de caminhos, comparador, Concierge | **B** |
| `src/app/mesa-curador.css` · `src/components/curadoria/mesa/*` · `mesa-workspace.tsx` | **C** |
| `src/app/landing-editorial.css` · `src/components/landing/*` · admin · CRM | **D** |

## Fronteiras que já vão doer

| Arquivo | Quem quer | Regra |
|---|---|---|
| `src/app/layout.tsx` | A, D | mudança combinada; é a raiz de todos |
| `src/middleware.ts` · `public-paths.ts` | D (login) | **só D**; A/B/C abrem chamado |
| `src/components/shell/app-shell.tsx` | C, D | shell de operação — **não** é o do paciente |
| `src/components/paciente/patient-shell.tsx` | **A** | B consome, não edita |
| `src/components/curadoria/mesa/gramatica-de-estados.ts` | C | mapeamentos são de C; o **vocabulário** é da Fundação |
| `src/app/foundation/page.tsx` | Fundação | vitrine; toda trilha acrescenta ao consolidar um primitivo |

## Regra de conflito

Duas trilhas precisando do mesmo arquivo compartilhado **não negociam entre si**:
registram necessidade de extensão da Fundação. É mais lento uma vez, e evita
quatro versões do mesmo botão.
