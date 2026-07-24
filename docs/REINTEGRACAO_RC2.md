# Reintegração — árvore certificada × origin/main · Certificação RC-2

**2026-07-24.** Merge de `origin/main` (8 commits, 179 arquivos, +13.283 linhas) sobre a árvore certificada RC-1. **O merge está resolvido e validado no working tree, deliberadamente sem commit** — conforme instruído; o commit de merge será criado só com a autorização de publicação.

---

## 1. O que as duas linhas eram

| | Árvore certificada (RC-1) | origin/main |
|---|---|---|
| Modelo de responsabilidade | `curadoria.cases.responsible_id/role` + `transfer_case_responsibility()` auditada | `crm_cases.pipeline_stage` movido por etapas |
| Atendente | `/atendimento` (qualifica → converte → abre Case → encaminha, tudo validado no banco) | `/coa/atendimento` (fila CRM por pipeline) |
| CRM | operações de domínio | **plataforma completa**: contatos, tarefas, agenda, interações, WhatsApp, integração site |
| Design | dashboard executivo `/admin` | redesign editorial da Landing + dashboard do paciente + COA |

**Leitura da reintegração**: complementares no CRM (plataforma deles + operações auditadas minhas), concorrentes no modelo de responsabilidade — e aí vale a Correção de Domínio do Fundador: o Case único auditado vence.

## 2. Conflitos e decisão, um a um

| Arquivo | Decisão | Por quê |
|---|---|---|
| `role-home.ts` | **Reescrito**: mapa canônico da árvore certificada (+ `getAuthenticatedPortalCta` deles derivando do MESMO mapa) | Existiam dois mapas concorrentes; papel cai na superfície das operações auditadas. Curador → `/portal-curador`, que o próprio next.config deles canoniza como `/coa/curadoria` |
| `role-home.test.ts` | Reescrito: união dos contratos + teste novo "CTA nunca contradiz ROLE_HOME" | Impede a divergência de voltar |
| `crm/schema.ts` | **União** (deles + meus schemas) | Sem sobreposição de exports |
| `crm/index.ts` | União com re-export seletivo de `./lead` | `normalizePhone/Email` e `DuplicateMatch` existem nos dois lados; pelo índice sai só a versão da plataforma |
| `admin/page.tsx` | **Meu** (dashboard executivo certificado) | O deles era o painel antigo + redirect de concierge que ficou obsoleto (`/acompanhamento` existe) |
| `portal-curador/layout+page` | **Deles** | Já lê o banco, tem conduction-ui e identidade real; meu diferencial (feed) ficou de fora — ver §4 |
| `curador/page`, `paciente/page` | **Deles** (redesign) | Meu lado só adicionava um aviso de superfície antiga |
| `phase-navigator` | Deles | Evolução do workflow guiado |
| `mock-data.ts` + teste | **Apagados** | Deletados na consolidação; ninguém no merge importa |
| `guard.ts` (não-conflito textual) | Removida duplicata de `requireAnyRole` (as duas linhas criaram a mesma função) | |

## 3. Correções pós-merge (bloqueadoras, nenhuma cosmética)

1. **Vocabulário do Método violado em componente do paciente** — o redesign dizia "sem ranking" no título do relatório. A palavra proibida não entra nem para ser negada (Ontologia §8, contrato do próprio teste deles). → "sem ordem de preferência".
2. **Ação principal onde não deve haver** — `patient-home-state` (caso em andamento) ganhou um link "Ver minha Curadoria" no redesign; o contrato do Método diz: enquanto o caso está com a equipe, nenhuma ação é sugerida ao paciente. Link removido.
3. Rótulo do bloco de limitações restaurado ao contrato ("Vale considerar").
4. Testes desatualizados do header público atualizados às classes do redesign (componente mudou **depois** do teste; contrato preservado: expandido ≠ compacto, sombra ao rolar).
5. Teste `ace-artifacts-list` atualizado para os rótulos humanizados ("História organizada") — humanização foi decisão deliberada do workflow guiado deles.
6. `crm-audit-security.test` apontava para migrations com **versões fantasma** (`190000/200000/210000`) que não existem no banco; apontado para os arquivos reais verificados por hash. Os 3 arquivos fantasma foram removidos — mantê-los criaria migrations "pendentes" de conteúdo já aplicado.
7. Stub `server-only` adicionado à config de testes de componentes (mesma técnica da de integração).
8. `/atendimento` e `/acompanhamento` migrados para o `PortalShellContainer` deles (identidade resolvida no server — uma implementação só de shell).

**Importante**: as falhas 1–5 **já existiam em `origin/main`** — a outra sessão publicou com a própria suíte de componentes vermelha (6 falhas). A reintegração as herdou e corrigiu.

## 4. Mudanças de comportamento

- Login por papel: Atendente → `/atendimento`, Concierge → `/acompanhamento`, Admin → `/admin` (antes, em produção: `/coa/*`). Curador: mesma tela, URL canônica `/coa/curadoria`.
- Paciente em "caso em andamento" não vê mais link de ação (contrato do Método restaurado).
- Relatório do paciente sem a palavra banida.
- O feed "O que mudou desde sua última visita" **saiu** do painel do Curador (o redesign deles não o traz; o módulo `portal/activity.ts` permanece pronto). Backlog.

## 5. Suítes na árvore integrada

| | |
|---|---|
| `tsc --noEmit` | ✅ 0 |
| lint | ✅ limpo |
| build | ✅ compila |
| unit | ✅ **936** (75 arquivos — inclui os testes deles) |
| components | ✅ **192** |
| golden | ✅ 1 |
| integração | ✅ **140/140** |
| smoke local | ✅ `/admin` 200 pós-merge |

**Total: 1.269 testes.**

## 6. Riscos restantes

1. **Dualidade operacional residual**: `/coa/atendimento` (pipeline do CRM) e `/atendimento` (operações auditadas) coexistem montados. O ROLE_HOME aponta só para o auditado, mas a superfície de pipeline segue alcançável e move `crm_cases` sem tocar o Case único. É a Fase 3c/4 pendente da unificação — **a decisão de fundir continua sendo sua**.
2. Validação visual autenticada pós-merge foi só de fumaça (`/admin` 200); a validação profunda foi pré-merge e o merge não tocou os arquivos do dashboard.
3. Produção hoje roda `origin/main` puro — inclusive com as violações de Método dos itens 1–2 do §3, até este merge ser publicado.

## 7. Backlog pós-release

| Item | Categoria | Impacto | Prioridade |
|---|---|---|---|
| Unificar `/coa/atendimento` × `/atendimento` (Fase 3c/4) | Arquitetura/CRM | dualidade de Case | **Alta** |
| Religar feed de atividade real no painel do Curador | Curadoria/UX | perda de contexto | Média |
| Unificar `normalizePhone/Email` (lead.ts × phone.ts) | Técnico | duas normalizações | Média |
| SMTP/templates próprios | Segurança/Produto | e-mails saem como "Supabase" | Alta (antes de paciente real) |
| Apagar fixtures "Ana Demonstração" | Técnico | lixo em produção | Média |
| Paginação de `listUsers` > 1.000 | Técnico | teto de contas | Baixa |
