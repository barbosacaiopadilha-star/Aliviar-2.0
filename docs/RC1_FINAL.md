# RC1

**Data:** 2026-08-01
**Commit:** o commit apontado pela tag — `git show rc1`
**Tag:** `rc1`
**Ambiente:** produção `awdlmeykminwyifnygkm`, banco atualizado, código ainda não publicado

---

## Resumo executivo

O RC1 fecha o ciclo de engenharia da Aliviar. A Curadoria Médica está implementada de ponta a ponta, o banco de produção está em paridade com o repositório, e a única barreira entre a plataforma e a primeira paciente real **não é software**: são três médicos.

Três bloqueadores foram levantados na auditoria de release. Dois foram encerrados nesta sequência — a view que contornava a RLS e a divergência de nove migrations com deriva de versão. O terceiro, a rede de profissionais, depende de trabalho humano que nenhum código encurta.

---

## O que entrou no RC1

**Método e Curadoria** — cadeia completa: Método → Catálogo Canônico → Mapa de Prioridades do Case → Mapa do Profissional → Motor de Compatibilidade. Consulta Inicial, Perfil de Prioridades, reconhecimento pela paciente, seleção dos três, Relatório e entrega humana.

**Motor de Compatibilidade** — 15 células, 4 resultados, sem score, sem ranking, sem ordenação. Ausência nunca elimina.

**Base de Evidências de Prática** — registro permanente com proveniência datada, append-only, e política de fontes com validade.

**Protocolos Oficiais** — Q1–Q28 do profissional e P1–P16 da pessoa, com bijeção garantida por teste.

**Governança da verificação** — estados de verificação, divergências, desatualização e pedidos de atualização.

**Connection e Relationship** — decisão, correção da escolha, contato declarado, primeiro atendimento e nascimento atômico do relacionamento.

**Continuidade Pós-Decisão** — dois incrementos: o modo de contato declarado pela paciente com visibilidade do Concierge responsável; e as tentativas de aproximação com notificação interna, separando fato, trabalho e atenção.

**Segurança** — RLS ancorada em `can_access_case`, isolamento entre pacientes provado por testes negativos, e a view `patient_case_overview` passando a respeitar a RLS.

**Banco** — ledger reconciliado: deriva de versão reparada, 12 migrations legadas recuperadas do próprio ledger de produção e preservadas, 10 migrations aplicadas.

**Documentação** — arquitetura da experiência da decisão, contrato operacional, fronteiras da continuidade, playbook de go live e playbook de publicação dos três primeiros profissionais.

---

## O que ficou para a v1.1

- Incremento 3 — relatório interno de inércia
- Temporary Access
- Aproximação intermediada
- WhatsApp
- SLA
- Escalonamento
- Troca de profissional
- Observabilidade adicional

---

## Estado do banco

| | |
|---|---|
| Migrations locais | 64 |
| Migrations em produção | 64 |
| Pendentes | 0 |
| Remote-only | 0 |
| Guarda NC-23 | verde |
| Deriva de versão | encerrada |
| Migrations legadas preservadas | 45 arquivos em `migrations-legacy-public/` |

---

## Estado dos testes

| Suíte | Resultado |
|---|---|
| Unitários | 1.676 passaram · 2 falhas ambientais (`env-guard`, exigem `.env.local` apontando para projeto hospedado) |
| Componentes | 383 passaram |
| Integração (banco real) | 383 passaram · 1 skipped |
| `tsc --noEmit` | limpo |
| ESLint | limpo |
| Build de produção | verde |
| Advisors de segurança | **0 ERROR** · 79 WARN registrados |

---

## Estado da operação

| | |
|---|---|
| Administrador | 1 |
| Atendente | 1 |
| Curador | 1 |
| Concierge | 1 |
| **Profissionais reais publicados** | **0** |
| Perfis DEMO | 6 — nenhum publicado, e o banco impede que sejam |
| Registros verificados como regulares | 0 |
| Áreas de atuação verificadas | 0 |

---

## Estado do release

| | |
|---|---|
| Branch | `main` |
| Commits à frente de `origin/main` | 44 |
| Push | **não realizado** |
| Deploy | **não realizado** |
| Código em produção | 44 commits atrás |
| Incremento 3 | preservado em `stash@{0}` |
| Árvore | limpa |
| Conflitos | nenhum |

---

## Checklist final

**Encerrado**

- [x] Curadoria implementada de ponta a ponta
- [x] Motor congelado e certificado
- [x] Connection e Relationship implementados
- [x] Continuidade pós-decisão, incrementos 1 e 2
- [x] Bloqueador de segurança corrigido e validado
- [x] Ledger reconciliado e produção atualizada
- [x] Suítes verdes
- [x] Playbooks de operação escritos
- [x] Tag `rc1` criada

**Pendente para abrir a operação**

- [ ] Três profissionais reais publicados
- [ ] Push e deploy do código atual
- [ ] Backup ou PITR confirmado
- [ ] Credenciais expostas em log rotacionadas
- [ ] Smoke test com 22 OK

---

> **O RC1 termina com a plataforma pronta e a rede vazia. O próximo passo não está no repositório.**
