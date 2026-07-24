# Relatório de Readiness — MISSÃO 207

**Data**: 2026-07-23
**Recomendação formal**: **NO GO**

> Critério de sucesso da missão: *"Se um paciente iniciar sua jornada amanhã, a Aliviar conseguirá conduzi-lo do primeiro contato até a escolha do profissional utilizando exclusivamente o produto construído."*
>
> **Não é possível afirmar isso.** Nenhuma informação de uma Curadoria real sobreviveria a um recarregamento de página, e o produto não compila para produção no estado atual da árvore de trabalho.

---

## Bloqueadores (impedem o lançamento)

### B1 — O build de produção falha

```
./src/lib/supabase/admin.ts:28:3
Type error: Type 'SupabaseClient<any, any, "curadoria", any, any>'
is not assignable to type 'SupabaseClient<any, "public", "public", any, any>'.
```

**Origem**: cinco arquivos em `src/lib/supabase/` estão modificados e **não commitados** desde antes da MISSÃO 002, introduzindo `DB_SCHEMA = "curadoria"` sem ajustar o tipo de retorno.

**Evidência de isolamento**: com essas mudanças guardadas (`git stash`), `npm run build` **passa** e gera todas as 40+ rotas. Com elas, falha. Logo: o repositório commitado compila; a árvore de trabalho não.

**Risco**: qualquer deploy a partir do estado atual falha no build da Vercel.

### B2 — Nenhuma tabela do Método existe em produção

Consulta ao `aliviar-2-prod`, schema `curadoria`:

| Tabela esperada | Existe? |
|---|---|
| `priority_profiles` | ❌ |
| `priority_weights` | ❌ |
| `priority_profile_filters` | ❌ |
| `compatibility_analyses` | ❌ |
| `curated_selections` | ❌ |
| `curated_selection_options` | ❌ |
| `patient_curadoria_decisions` | ❌ |

A migration `20260723000000_curadoria_compartilhada.sql` **nunca foi aplicada**, aguardando desde a MISSÃO 002 a decisão sobre o schema de destino. Tudo que as MISSÕES 002–206 construíram existe apenas como mock em memória do cliente.

### B3 — A rede médica está vazia

| Tabela | Linhas em produção |
|---|---|
| `curadoria.professional_profiles` | **0** |
| `curadoria.professional_competency_areas` | **0** |

Sem profissionais aprovados, a Mesa de Curadoria não tem sobre o que operar e o Motor de Compatibilidade dispara `E-01` (universo esvaziado) em 100% dos casos.

### B4 — Os dois Portais estão sem autenticação

`/portal-curador` e `/portal-paciente` estão em `PUBLIC_PREFIXES`. Qualquer pessoa com o link abre ambos. Foi decisão consciente das missões de construção ("não integrar autenticação ainda") — e é incompatível com atendimento real.

### B5 — O Dossiê não existe

A MISSÃO 204 (Relatório de Curadoria) **não foi executada**. As missões 205, 206 e 207 partiram da premissa de que estava concluída. A própria 204 o define como *"o principal produto entregue pela Aliviar"*.

Consequência na jornada: a Mesa encerra com três pareceres e não há para onde seguir.

### B6 — Nenhuma evidência de integração

Os 15 arquivos de teste de integração falharam (133 testes), todos por ausência de Supabase local (`PGRST205`, rate limit de auth). Não são falhas de código — mas **não existe evidência** de que RLS, autenticação e transições funcionem.

---

## Etapa 1 — Auditoria funcional

| Trecho da jornada | Estado |
|---|---|
| Landing → WhatsApp | ✅ contatos contextualizados, número oficial |
| Landing → Jornada | ✅ corrigido na MISSÃO 206 |
| Consulta Inicial | ⚠️ **não existe como tela** — o Módulo 2 nunca foi construído |
| Perfil de Prioridades (Curador) | ✅ navegável, sem persistir |
| Mesa de Curadoria | ✅ fluxo completo verificado |
| Dossiê | ❌ inexistente (B5) |
| Portal do Paciente | ⚠️ 3 de 7 telas |
| Escolha | ❌ tela não construída |
| Acompanhamento | ❌ tela não construída |

**A jornada tem ruptura.** Não é possível ir do primeiro contato à escolha.

## Etapa 2 — Auditoria técnica

| Item | Resultado |
|---|---|
| Typecheck | ❌ falha (B1) |
| Lint | ✅ sem avisos |
| Testes unitários | ✅ 794 passando (63 arquivos) |
| Testes de integração | ❌ 133 falhando por falta de ambiente (B6) |
| Build | ❌ falha (B1) · ✅ passa sem as mudanças não commitadas |
| Smoke tests | ⛔ não executáveis sem deploy |
| Lighthouse / Core Web Vitals | ⛔ **não medidos** — ferramenta indisponível neste ambiente |

**Bundle** (do build limpo): First Load JS compartilhado **103 kB**; Mesa de Curadoria 121 kB; Perfil de Prioridades 118 kB; Portal do Paciente 106 kB. Números saudáveis, mas sem Lighthouse não há veredito de performance.

## Etapa 3 — Banco de dados

| Item | Estado |
|---|---|
| Migrations versionadas | ✅ 30 arquivos |
| Migration do Método aplicada | ❌ (B2) |
| Divergência migrations × produção | ❌ **crítica**: todos os arquivos criam em `public.`; produção tem tudo em `curadoria` |
| Rollback / backup / restauração | ⛔ não testados |
| Seed | ⛔ inexistente para a rede médica |

## Etapa 4 — Autenticação

| Item | Estado |
|---|---|
| Login/logout/sessão (produto antigo) | ⚠️ implementado, sem evidência de teste (B6) |
| Portais novos | ❌ sem autenticação (B4) |
| Papéis | ⚠️ `user_roles` com 3 linhas; sem "Atendente" (tensão aberta desde ADR-006) |

## Etapa 5 — Segurança

Advisors do Supabase em produção: **1 ERROR, 40+ WARN**.

| Achado | Nível |
|---|---|
| `curadoria.patient_case_overview` é `SECURITY DEFINER` view | **ERROR** |
| 13 funções com `search_path` mutável | WARN |
| 9 funções `SECURITY DEFINER` executáveis por `anon` via RPC | WARN |
| Proteção contra senha vazada desabilitada | WARN |

Nenhum foi introduzido pelas missões recentes; todos precedem esta auditoria. **Nenhum foi corrigido aqui** — a missão proíbe alterações fora de escopo e correção em produção exige sua autorização.

## Etapa 6 — Observabilidade

| Item | Estado |
|---|---|
| Logs estruturados | ⚠️ parcial (`ace_execution_events`, `case_events`) |
| Telemetria / alertas / health check | ❌ inexistentes |
| Eventos do Motor (Engine §7) | ❌ 33 catalogados, quase nenhum emitido |

**A trilha atual não passa no teste de reconstrução** — divergência 12 registrada na especificação do Motor.

## Etapas 7 e 8 — Performance e acessibilidade

Auditadas na MISSÃO 206 para as superfícies novas: sem overflow em 375px e 1265px, nenhum alvo de toque abaixo de 24px, foco visível, semântica e ARIA verificadas por inspeção de DOM.

**Não cobertos**: Lighthouse, Core Web Vitals, leitor de tela real, tablet, dobráveis e ultrawide.

## Etapa 9 — Produção

| Item | Estado |
|---|---|
| Domínio / HTTPS / Vercel | ⛔ não verificados nesta auditoria |
| Banco | ❌ (B2, B3) |
| WhatsApp | ✅ número oficial integrado |
| Storage / uploads / e-mails | ⛔ não verificados |
| Backups / monitoramento | ❌ inexistentes |

## Etapa 10 — Operação

Documentação metodológica **completa e madura** (Fundamentos, Ontologia, Experience Bible, Engine, AQS, Experiência, auditorias). Falta a operacional: o checklist do AQS não existe no sistema, o papel "Atendente" segue sem representação, e não há templates de mensagem.

## Etapa 11 — Rede médica

❌ Vazia (B3). Sem base inicial, não há o que validar.

## Etapa 12 — Shadow Check (5 Curadorias completas)

**Não executável.** Sem persistência (B2) e sem rede médica (B3), uma Curadoria completa não pode ser realizada nem registrada. Executá-la em mock não produziria evidência sobre o produto real — produziria evidência sobre o mock.

---

## Checklist final

| Pergunta | Resposta |
|---|---|
| A Landing está pronta? | ⚠️ **Quase** — funcional e verificada, mas sem Lighthouse |
| O Portal do Curador está pronto? | ❌ Não — sem persistência, sem autenticação, sem Consulta Inicial |
| O Portal do Paciente está pronto? | ❌ Não — 3 de 7 telas |
| O Dossiê está pronto? | ❌ Não — não foi construído |
| O Método está respeitado? | ✅ **Sim** — é o ponto mais forte do projeto |
| A operação está preparada? | ❌ Não |
| O ambiente de produção está pronto? | ❌ Não |
| Existe pendência bloqueadora? | ✅ **Sim — seis** |

---

## Riscos

| Risco | Severidade | Probabilidade |
|---|---|---|
| Deploy falha no build | Alta | **Certa** se feito hoje |
| Perda de dados de paciente real (sem persistência) | **Crítica** | Certa |
| Acesso não autorizado aos Portais | Alta | Alta |
| Curadoria impossível por rede vazia | Alta | Certa |
| Divergência migrations × produção causar perda em migration futura | **Crítica** | Média |

---

## Plano de mitigação — ordem recomendada

1. **Resolver o schema** (`curadoria` vs `public`) e corrigir o tipo em `admin.ts`. Destrava B1 e B2. *Requer sua decisão.*
2. **Aplicar a migration** do Método em produção. *Requer sua autorização explícita.*
3. **Reconciliar `supabase/migrations/` com produção** — hoje o diretório não descreve o banco real.
4. **Cadastrar a rede médica inicial** com os campos que o Motor exige.
5. **Ligar a persistência** dos Portais e **removê-los de `PUBLIC_PREFIXES`**.
6. **Construir o Dossiê** (MISSÃO 204) e as telas 4–7 do Paciente.
7. **Subir Supabase local** e fazer os testes de integração passarem.
8. **Corrigir os advisors de segurança**, começando pelo ERROR.
9. **Então** executar o Shadow Check de 5 Curadorias.

---

## Recomendação formal

# NO GO

O Método Aliviar está **excepcionalmente bem construído** — nove documentos canônicos coerentes entre si, 794 testes protegendo invariantes reais, e superfícies que respeitam o Método em detalhes que raramente sobrevivem à implementação.

O que falta não é qualidade. É **infraestrutura**: nada persiste, nada autentica, o banco não tem as tabelas, a rede está vazia e o build não compila.

Os itens 1 a 5 do plano são o caminho crítico. Enquanto não estiverem feitos, qualquer data de lançamento é aspiração, não plano.
