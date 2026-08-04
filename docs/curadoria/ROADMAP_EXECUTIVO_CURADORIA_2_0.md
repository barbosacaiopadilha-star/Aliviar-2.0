# Roadmap Executivo — Curadoria 2.0

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 03 — Implementador (pacote F-00) |
| **Data** | 2026-08-04 · **HEAD:** `97ed8b2` |
| **Status** | **Vigente** — nível derivado; revisável sem ADR |
| **Dependências** | [`ARQUITETURA_CURADORIA_2_0.md`](ARQUITETURA_CURADORIA_2_0.md) §15 · [`MAPA_DOS_PACOTES.md`](MAPA_DOS_PACOTES.md) |
| **Documentos relacionados** | [`INDICE_DA_CURADORIA_2_0.md`](INDICE_DA_CURADORIA_2_0.md) · [`REGISTRO_DE_GOVERNANCA.md`](REGISTRO_DE_GOVERNANCA.md) · [`REGISTRO_DOS_PARECERES.md`](REGISTRO_DOS_PARECERES.md) |
| **Origem** | Pacote F-00 |

---

## 1. Estado da Curadoria 2.0 — em uma tela

| Dimensão | Estado | Detalhe |
|---|---|---|
| **Diagnóstico** | ✅ Concluído | Auditoria de 2026-08-04 |
| **Arquitetura** | 🟡 v1.2, aprovação declarada pelo Fundador; documento ainda se declara em revisão | divergência **G-01** |
| **Governança documental** | 🟡 Em regularização | pacote **0.6** (este) — commit pendente |
| **ADRs** | 🔴 **0 de 4** escritas | ADR-A, B, D, E |
| **Decisões humanas** | 🔴 **11 de 11 abertas** | DP-1..DP-11 |
| **Implementação** | 🔴 Não iniciada, não autorizada | zero código, zero migrations |
| **Rede real** | 🔴 Inexistente | bloqueia a Onda 5 |
| **Janela de publicação** | 🔴 Inexistente | ledger de produção derivado |

**Resumo honesto:** a Curadoria 2.0 está **inteiramente na Onda 0**. Nada foi construído, e
o que impede não é engenharia — são **onze decisões humanas** e **quatro ADRs** que ainda
não existem.

## 2. Fases

| Onda | Nome | Natureza | Pré-condição | Entrega |
|---|---|---|---|---|
| **0** | Verificar e decidir | Decisão | nenhuma | 6 decisões registradas |
| **1** | Corrigir defeitos e construir auditabilidade | Código, **sem derivação** | Onda 0 fechada | 7 defeitos corrigidos + explicabilidade, proveniência, reconhecimento em duas colunas, discordância + função pura inerte |
| **2** | A virada do eixo | Código, **exige ADR** | Onda 1 verde + ADR-A/B/D + DP-1/DP-4 | zero atos de transcrição; toda entrada do Motor com origem |
| **3** | Um relógio, um instrumento | Código, **independente da Onda 2** | Onda 1 | um modelo de progresso; um instrumento por lado; canônicos reescritos |
| **4** | Refinamento | Apresentação | Ondas 1–3 | mesma informação, melhor apresentada |
| **5** | Calibração por operação real | Método | **Rede real + Cases reais** | valores da ponte fixados |

```
Onda 0 ──▶ Onda 1 ──┬──▶ Onda 2 ──▶ Onda 4 ──▶ Onda 5 (exige Rede real)
                     └──▶ Onda 3 (independente da Onda 2)
```

## 3. Pacotes

Fonte única: [`MAPA_DOS_PACOTES.md`](MAPA_DOS_PACOTES.md). **33 pacotes**: 1 em execução,
9 planejados, 22 bloqueados, 1 proibido (2.5, regime de bloco), 2 retirados e 1 reescrito
em relação ao plano anterior.

## 4. Cronograma

**Não há data.** O cronograma da 2.0 é **orientado a decisão**, não a calendário, e declarar
prazo antes das decisões seria ficção. O que existe:

| Marco | Gatilho (não é data) | Esforço estimado depois do gatilho |
|---|---|---|
| **M0 — Governança regularizada** | autorização de commit dos documentos | 0,5 d |
| **M1 — Onda 0 fechada** | DP-1, DP-2, DP-3, DP-4 respondidos + parecer do Guardião versionado | 0 d de engenharia |
| **M2 — Onda 1 verde** | M1 | ~20–25 d de engenharia (12 pacotes, um engenheiro) |
| **M3 — ADRs escritas** | M1 + DP-5, DP-7, DP-9 | ~6 d de redação |
| **M4 — Onda 2 fechada** | M2 + M3 | ~20 d de engenharia |
| **M5 — Onda 3 fechada** | M2 (paralela à Onda 2) | ~15 d de engenharia |
| **M6 — Onda 4** | M4 + M5 | ~8 d |
| **M7 — Onda 5** | **Rede real com Cases concluídos** | indeterminado — fora do controle da engenharia |

**Estimativas são do Implementador, não compromisso.** A Arquitetura não estima prazo.

## 5. Dependências

### 5.1 Do Fundador
DP-2 (ACE) · DP-4 (Autoridade de Método) · **PA-07** (registrar por escrito a aprovação
constitucional já declarada) · autorização da janela de publicação · autorização de commit ·
DP-3 e DP-5 pela via de Método · 3.3/3.4 (instrumentos) · **Rede real**.

### 5.2 Do Guardião (Agente 00)
DP-11 (versionar o parecer) · DP-7 (P-07/P-08/P-10/P-11 viram domínio?) · DP-8 (P-12) ·
DP-9 (RLS do Mapa do Profissional) · aprovação final da Arquitetura (pacote 0.4).

### 5.3 Do Arquiteto (Agente 02)
DP-1 com o Guardião · correção do cabeçalho da Arquitetura (G-01) · alocação de onda para
o item C-16/PD-01 · 3.6 (reescrita dos canônicos).

### 5.4 Da Engenharia
Commit controlado dos documentos · separação do pacote de segurança em curso ·
reconciliação do ledger · stack Supabase local quieta para validação do zero.

### 5.5 De ADR
ADR-A (Onda 2) · ADR-B (Onda 2, **com a dívida documental do Modelo no mesmo ato**) ·
ADR-D (Onda 2) · ADR-E (Onda 0/1). ADR-C **retirada**.

## 6. Caminho crítico

```
0.6 (governança) ─▶ DP-11 + PA-07 ─▶ 0.4 (aprovação) ─▶ DP-1 ─▶ Onda 1 ─▶ ADR-A/B/D ─▶ Onda 2
                    └─ DP-4 (Autoridade) ────────────────────────────────┘
```

**O caminho crítico é integralmente humano até o fim da Onda 0.** Nenhum dia de engenharia
encurta essa parte.

## 7. Riscos do roadmap

| # | Risco | Efeito sobre o cronograma |
|---|---|---|
| **RM-1** | Onze decisões abertas simultaneamente | Toda a 2.0 parada; nenhuma onda começa |
| **RM-2** | Pareceres não versionados (LP-1) | Aprovações podem ser contestadas depois; retrabalho de governança |
| **RM-3** | Rede real indeterminada | A Onda 5 pode nunca começar; a ponte grau→importância fica com valores provisórios por tempo indefinido |
| **RM-4** | Janela de publicação inexistente | Ondas 1–3 acumulam migrations não publicadas |
| **RM-5** | Sessões paralelas escrevendo na mesma árvore suja | Documentos podem mudar sem registro entre uma decisão e a seguinte |
| **RM-6** | A Onda 1 é grande (12 pacotes) e contém a base de auditabilidade inteira | Se a Onda 1 escorregar, **tudo** escorrega — ela é pré-condição das Ondas 2 e 3 |

## 8. Histórico

| Data | Evento | Produto | Autor |
|---|---|---|---|
| 2026-07-31 | Catálogo Canônico 1.0.0 congelado; protocolos oficiais emitidos | catálogo + 5 documentos de protocolo | Método |
| 2026-08-01 | **Congelamento arquitetural da Curadoria** | `CONGELAMENTO_ARQUITETURAL.md` | Arquitetura |
| 2026-08-03 | Compatibilidade Relacional aprovada e congelada (ADR-065) | `DOMINIO_COMPATIBILIDADE_RELACIONAL.md` v1.0 | Fundador |
| 2026-08-04 | **Auditoria operacional pré-2.0** | PA-01 | Agente 01 |
| 2026-08-04 | Arquitetura da 2.0 — v1.0, v1.1, v1.2 | PA-02/03/04 | Agente 02 |
| 2026-08-04 | Parecer constitucional + veredito com cinco correções | PA-05/06 — **não versionados** | Agente 00 |
| 2026-08-04 | Plano de Pacotes com impedimento aberto | PA-08 | Agente 03 |
| 2026-08-04 | Aprovação constitucional declarada | PA-07 — **não versionada** | Fundador |
| 2026-08-04 | Plano Executivo (33 pacotes) | PA-09 | Agente 03 |
| 2026-08-04 | **Pacote F-00 — regularização da governança** | este documento + 4 outros | Agente 03 |

## 9. Responsáveis por onda

| Onda | Responsável principal | Corresponsáveis |
|---|---|---|
| 0 | **Fundador** | Guardião, Arquiteto, engenharia |
| 1 | **Implementador** | Arquiteto (DP-1), Método (1.5) |
| 2 | **Implementador** | Guardião (ADRs), Autoridade de Método |
| 3 | **Implementador** | Fundador (instrumentos), Arquiteto (3.6) |
| 4 | **Implementador** | — |
| 5 | **Método + Fundador** | Implementador |
