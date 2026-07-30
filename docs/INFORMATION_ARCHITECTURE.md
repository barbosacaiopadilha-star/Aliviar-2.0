# INFORMATION_ARCHITECTURE — Arquitetura conceitual da experiência

**Estado**: Proposto (Missão 0, 2026-07-25). Par de `ALIVIAR_GUIDED_EXPERIENCE.md`. **Nada aqui foi implementado** — é o alvo conceitual; rotas, banco, APIs e RLS permanecem como estão até missão de implementação autorizada.

---

## 1. Diagnóstico da experiência atual

Levantado percorrendo a plataforma real (produção + código) nesta linha de trabalho.

### O que já está certo (preservar e generalizar)
- As **nove fases do COS** são jornada de verdade: estado, dependência explícita, critérios do Motor
- Fila do Atendente ordenada pelo que falta fazer; ficha com as quatro ações nomeadas
- Dois níveis de compatibilidade (score interno / banda ao paciente); vocabulário banido testado
- Dashboard executivo honesto (`null` ≠ 0; números que doem em destaque)
- Identidade unificada (AuthenticatedUserMenu em portal) e logout global

### Problemas encontrados

**D1 — Dualidades de rota para o mesmo conceito** *(o maior)*
- `/atendimento` (operações auditadas do Case) × `/coa/atendimento` (fila CRM por pipeline_stage): **duas noções de fluxo do Nível 1**; a segunda move `crm_cases` sem tocar o Case único — resíduo da dualidade que a Correção de Domínio proibiu. **RESOLVIDO em 2026-07-25** (Convergência de Domínio B1–B4): `crm_cases` foi removida; o pipeline virou projeção derivada do Case canônico
- `/acompanhamento` × `/coa/concierge` — idem para o Nível 3
- `/paciente` (dashboard editorial) × `/portal-paciente` (Jornada do Método): duas homes de paciente com filosofias distintas
- `/curador` e `/paciente` antigos (ACE automático) ainda montados como superfícies-legado

**D2 — Telas-definição sem execução no meio do fluxo**: o padrão "esta tela explica; a de trabalho vem depois" quebrou em produção na Fase 1 (corrigido). Fases 2, 3 e 6 ainda seguem o padrão explicativo — cada uma precisa ou de workspace próprio ou de link inequívoco para onde o trabalho acontece.

**D3 — Mudanças de contexto visual**: PortalShell (Método) × AppShell/ADS (admin/CRM) × PatientShell (editorial) × COA seletor — quatro gramáticas; a pessoa sente que trocou de produto ao cruzar `/admin/crm` → `/coa/atendimento` → `/atendimento`.

**D4 — Navegação por entidade em parte do CRM**: "Contatos / Funil / Tarefas / Agenda" são módulos, não jornada — aceitável como *ferramenta* (ver §3), não como fluxo principal do Atendente.

**D5 — Redundâncias menores**: dois "Sair" no AppShell (menu + sidebar); duas normalizações de telefone (`lead.ts` × `phone.ts`); Landing pública mudou 3× de direção em uma semana (2.0 → editorial → 3.0) sem norma que estabilize.

### Oportunidades
- O COS já é o molde: estender "fase com estado + critério resolvível + próxima ação" aos fluxos do Atendente e do Concierge custa pouco — os fatos já existem no banco
- O seletor COA ("Escolha sua área operacional") pode virar a porta única da equipe, apontando para as superfícies auditadas
- `handedToConciergeAt`/auditoria de passagens já permitem Linha do Tempo real em todo Case

## 2. Arquitetura proposta — por jornada, nunca por módulo

### Mapa de superfícies-alvo (conceitual)

```
PÚBLICO      Landing → Contar minha história → Login
PACIENTE     Minha Jornada (única home)
             Contar e confirmar · Acompanhar · Meu relatório · Decidir · Pós-decisão
NÍVEL 1      Atendimento (única home)
             Fila → Ficha do contato (Acolher→Qualificar→Converter→Abrir→Encaminhar)
NÍVEL 2      Curadoria (única home)  — as 9 fases do COS, todas executáveis
NÍVEL 3      Acompanhamento (única home)
             Fila por frieza → Caso (agenda·retornos·pendências·encerrar)
ADMIN        Visão executiva (única home) → aprofundamentos → ações de estrutura
FERRAMENTAS  CRM (contatos/tarefas/agenda/interações) · Observabilidade ACE ·
             Equipe/Perfis · Relatórios — alcançáveis DE DENTRO da jornada
```

**Regra de unicidade**: um conceito, uma superfície. Toda dualidade do D1 se resolve escolhendo a superfície que executa as **operações auditadas** como canônica; a outra é absorvida (funcionalidade útil migra) ou rebaixada a ferramenta.

### Classificação Fluxo × Ferramenta (todo módulo existente)

| Módulo/superfície | Classe | Motivo |
|---|---|---|
| Fila+ficha do Atendente (`/atendimento`) | **Fluxo** | executa a jornada auditada do Nível 1 |
| COS 9 fases (`/portal-curador`≡`/coa/curadoria`) | **Fluxo** | é a Curadoria |
| Acompanhamento (`/acompanhamento`) | **Fluxo** | jornada do Nível 3 |
| Minha Jornada do paciente | **Fluxo** | jornada do paciente |
| Visão executiva `/admin` | **Fluxo** (do Admin) | é a leitura-e-ação de governança |
| CRM contatos/tarefas/agenda/interações | **Ferramenta** | organiza; não decide etapa de Case |
| `/coa/atendimento`, `/coa/concierge` | **Ferramenta transitória** | pipeline visual; absorver no fluxo auditado (Fase 3c/4) |
| Mesa de Curadoria | **Fluxo** (fase 8) | decisão central do Curador |
| Observabilidade ACE | **Ferramenta** | diagnóstico técnico do Admin |
| Equipe/Pacientes/Profissionais (admin) | **Ferramenta** | gestão de estrutura |
| Wizard "Sua história" | **Fluxo** (do paciente) | primeira etapa da jornada |
| Superfícies-legado `/curador`, `/paciente`(ACE) | **Ferramenta em extinção** | manter até o último Case antigo fechar |

### Shells
Duas gramáticas apenas: **Jornada** (paciente + três níveis — PortalShell/PatientShell convergindo) e **Gestão** (admin/ferramentas — AppShell). Ambas com os mesmos componentes conceituais de `UX_PRINCIPLES.md` e o mesmo menu de identidade.

## 3. Riscos

1. **Renomear sem migrar hábito**: equipe já usa as rotas atuais → toda mudança de rota com redirect permanente e período de convivência
2. ~~**D1 mexe em produção operante**~~ — **executado e concluído** na Convergência de Domínio (B1–B4, 2026-07-25), sob autorização própria do Fundador e fora de qualquer missão de UX
3. **Unificar shells pode achatar identidades** que são deliberadas (calor do paciente ≠ densidade do admin) → unificar componentes e princípios, não a pele
4. **Custo de teste**: cada tela nova sob as 5 perguntas + vocabulário — os guards existentes (traceability, vocabulário do paciente) devem se estender antes das telas mudarem
5. **Concorrência de sessões** (Cursor × esta): qualquer implementação desta IA precisa de branch + janela combinada — a lição da reintegração RC-2

## 4. Recomendações para a missão de implementação

**Ordem sugerida** (cada passo entregável e testável sozinho):
1. **Guards primeiro**: estender testes de vocabulário/5-perguntas às superfícies de equipe
2. **D2**: dar execução (ou link inequívoco) às fases 2, 3 e 6 do COS — mesmo padrão do Acolhimento
3. **Paciente**: eleger UMA home (`Minha Jornada`), absorver o que o editorial tem de bom, redirect da outra
4. **Nível 3**: enriquecer `/acompanhamento` com agenda/tarefas do CRM como ferramenta embutida
5. **D1 estrutural** (`/coa/*` → fluxo auditado): só junto das Fases 3c/4 do banco, com autorização própria
6. **Legados**: telão de aviso já existe; desmontar quando o último Case ACE fechar
7. Landing: congelar sob ADR — três redesigns em uma semana é o sintoma de falta de norma, não de energia

**Critérios de aceite de qualquer tela nova**: passa o teste das 5 perguntas em 30s · uma ação principal nomeada pelo efeito · estado derivado de fato · vazio informativo · vocabulário humano · acessível por teclado · coberta por teste de comportamento.
