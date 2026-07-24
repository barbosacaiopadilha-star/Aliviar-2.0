# Certificação Final RC-1 — após a Consolidação Estrutural

**2026-07-24.** Nada commitado, nada em push, nada em deploy.

**Veredito: 🟢 APTO PARA PRODUÇÃO** — reclassificado no mesmo dia, após os dois bloqueadores humanos serem resolvidos pelo Fundador. Ver o adendo no fim deste documento; o corpo abaixo registra o estado no momento do primeiro veredito.

~~Veredito: 🔴 NÃO APTO PARA PRODUÇÃO~~ — por dois itens, ambos fora do alcance da máquina. Tudo o que pode ser verificado por código, banco e teste está verde. Ver §Gate.

---

## 1. Revalidação — comandos e resultados reais

Nada foi aceito do relatório anterior; tudo abaixo foi reexecutado nesta sessão.

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0 |
| `npm run lint` | ✅ sem avisos |
| `npm run build` | ✅ compila |
| `npm test` | ✅ 66 arquivos, **845 passed** + 1 todo |
| `npm run test:components` | ✅ **185 passed** |
| `npm run test:golden` | ✅ 1 passed |
| `npm run test:integration` | ✅ **140/140** (15 arquivos) |
| Smoke local | ✅ dev server sobe; Landing 200; rotas autenticadas redirecionam para `/login` |

**Total: 1.171 testes.**

### A revalidação encontrou e corrigiu um bug real

Na primeira rodada desta certificação, 1 teste de integração falhou — não era flake. `listPatientAccounts` montava `.in()` com **todos** os ids de paciente na URL; com as 276+ contas acumuladas no banco local, a requisição quebrava. **Em produção, a página `/admin/pacientes` quebraria ao passar de ~200 pacientes.**

Correção em [`patient-account-repository.ts`](../src/modules/profiles/patient-account-repository.ts): embed do PostgREST com FK nomeada (`profiles!user_roles_profile_id_fkey`) — a tabela tem duas FKs para `profiles` e o embed sem nome é ambíguo. Sem `.in()` gigante, sem segunda consulta. Revalidado com o banco acumulado (o cenário que quebrava) e com a suíte inteira.

Limite latente documentado: `auth.admin.listUsers({ perPage: 1000 })` cobre até 1.000 contas; acima disso precisa de paginação. Pré-existente, não introduzido agora.

## 2. Banco e migrations

| Verificação | Resultado |
|---|---|
| Migrations locais | 24 arquivos |
| Migrations remotas (`curadoria`) | 24 |
| Migrations remotas (`public` = AliCIA) | 12 — **fora do repositório**, como decidido |
| **Hash md5, arquivo × banco** | ✅ **24/24 idênticos** (`hashes_identicos = true`, verificado pelo próprio Postgres) |
| Ordem | ✅ mesma sequência de versões |
| Estrutura local × produção | ✅ 47 tabelas · 40 funções · 38 triggers · 122 policies · 0 sem RLS — **iguais** |
| `db reset` do zero | ✅ aplica os 24 sem erro |

## 3. RLS e autorização — sessões distintas

Jornada completa reexecutada **no banco local** (schema idêntico, risco zero), com Atendente, Curador, Concierge e Paciente **distintos**, em transação revertida:

```
1-4 OK lead→qualificação→conversão→Case (nasce com o Atendente)
5   OK encaminhado ao Curador — MESMO case_id
6   OK Atendente PERDEU acesso após entregar
7   OK Curador vê
8   OK Concierge recebe — MESMO case_id
9   OK Curador PERDEU acesso após entregar
10  OK paciente sem vínculo não vê
11  OK histórico append-only (UPDATE rejeitado)
    auditoria = 2 passagens registradas
```

Complementado pelos 140 testes de integração, que exercitam RLS por papel em 15 domínios (cases, stories, connection, relationship, concierge, patient-portal, human-review…).

Escalada de privilégio: nenhuma encontrada. `ROLE_HOME` não manda nível operacional para `/admin` (teste de regressão); Administrador vê tudo **sem se tornar responsável** por Case algum.

## 4. Fluxo completo do Case

✅ Provado (§3): o mesmo `case_id` do lead ao Concierge, responsabilidade atual correta em cada etapa, auditoria com autor e motivo, sem duplicidade (idempotência provada em conversão, abertura e transferência).

`encerramento` — o estado existe (`CLOSED`, máquina de estados testada), mas nenhum Case real percorreu a jornada até lá em produção.

## 5. Portal do Curador

✅ Zero mock: `mock-data.ts` apagado, feed lê `case_events` + `case_responsibility_changes`, identidade vem da sessão, layout exige `curador_medico`. `cos/mock-records.ts` permanece só como fixture de teste unitário.

## 6–7. Dashboards, UX, mobile — ⛔ o que segue impossível daqui

`/admin`, `/atendimento`, `/acompanhamento` e `/portal-paciente` exigem login. **Eu não insiro credenciais** — logo, não validei com sessão autenticada: mobile/tablet/desktop, overflow, contraste, foco, filtros de período, `null` ≠ zero na tela, alternativas textuais renderizadas, alerta de acúmulo de papéis, upload do paciente.

O que dá para afirmar sem sessão: as garantias estão **no código e testadas em unidade** (185 de componente + os testes de métricas que provam `null` ≠ 0 e fallback textual), e o servidor redireciona corretamente para `/login`.

## 8. IA e artefatos

✅ Cobertos pelos testes de integração GO LIVE reexecutados: falha de fornecedor interrompe sem fallback e sem avançar protocolo; mensagem sanitizada; paciente nunca vê erro técnico; retomada não recomputa o que já foi persistido; ADR-024 (violação de invariante não vira bloqueio de auditoria). Golden test do P002 passa. Precedência humana garantida por trigger de imutabilidade (schema idêntico ao de produção).

## 9. Segurança

| | |
|---|---|
| Segredos no repo | ✅ nenhum (varredura por padrão `sbp_`/`sk_live`/chaves inline) |
| `.env` versionado | ✅ nenhum; `test-users.local.json` coberto por `*.local.json` |
| Fragmento de token em doc | ✅ removido nesta sessão |
| `SECURITY DEFINER` | ✅ todas as funções novas com `search_path` fixo e `revoke from public` |
| Ator falsificável | ✅ não — `auth.uid()` no servidor, provado por teste |
| RLS | ✅ 122 policies, 0 tabelas sem RLS, isolamento provado por sessão |
| Uploads | 🟡 fluxo existe e tem teste de integração; não exercitado com sessão real no navegador |

## Gate final

| Critério | |
|---|---|
| Testes críticos passam | ✅ 1.171 |
| Banco e código alinhados | ✅ por hash |
| Nenhuma superfície crítica com mock | ✅ |
| Fluxo completo funciona | ✅ provado por SQL e integração |
| RLS testada por papel | ✅ |
| Dashboards funcionam | 🟡 código + testes sim; **tela autenticada não verificada** |
| **Mobile autenticado validado** | ⛔ **não** — exige login que só você pode fazer |
| Bug crítico | ✅ nenhum aberto (2 encontrados e corrigidos nesta certificação) |
| Segredo exposto | ✅ nenhum |
| Divergência de migrations | ✅ zero |
| **Separação de papéis no cenário real** | ⛔ **não** — 1 pessoa acumula administrador+curador+concierge; não existe Atendente |

## Score por área

| Área | Score |
|---|---|
| Banco & migrations | 10/10 |
| RLS & autorização | 10/10 |
| Fluxo do Case | 10/10 |
| Testes | 10/10 |
| Segurança | 9/10 (uploads sem sessão real) |
| IA & artefatos | 9/10 (validação humana nunca exercida em produção) |
| Portal do Curador | 9/10 (nunca aberto autenticado) |
| Dashboards & UX autenticada | **4/10** — construído e testado em unidade, nunca visto logado |
| Operação (pessoas) | **2/10** — papéis existem, gente não |

## O que falta — e é só isto

1. **Três e-mails** (Atendente, Curador, Concierge) para criar os perfis pelo fluxo do próprio sistema — sem credencial inventada.
2. **Um login seu** no navegador, para eu validar dashboards, mobile e acessibilidade com sessão real e corrigir o que aparecer.

Nenhum dos dois é código. Quando existirem, a reclassificação é imediata.

---

# ADENDO — Reclassificação para 🟢 APTO (2026-07-24, mesma data)

Os dois bloqueadores foram resolvidos pelo Fundador na mesma sessão.

## Bloqueador 1 — separação de papéis: ✅ RESOLVIDO

Perfis reais criados em produção (convite/senha temporária definidos pelo próprio fluxo, auditados no `audit_logs` e visíveis no feed do dashboard):

| Pessoa | Papel |
|---|---|
| Administrador | **apenas** administrador (curador_medico e concierge revogados) |
| Atendente Aliviar | atendente |
| Curador Aliviar | curador_medico |
| Concierge Aliviar | concierge |

Configuração de Auth corrigida no painel pelo Fundador: Site URL e Redirect URLs apontando para `aliviar-2-0.vercel.app` (antes, default `localhost:3000` — links de convite quebravam).

## Bloqueador 2 — validação autenticada: ✅ EXECUTADA

Sessão real de Administrador, dashboard novo servido localmente **contra o banco de produção**:

| Verificado | Resultado |
|---|---|
| 14 indicadores com dado real | ✅ (leads 2, Cases 2, paciente ativo 1…) |
| `null` ≠ zero na tela | ✅ "Informação indisponível" em documentos pendentes e tempos médios |
| "Sem responsável: 2" em destaque | ✅ vermelho, como projetado |
| Filtros de período | ✅ 7d/30d/90d/Tudo |
| Funil com queda percentual | ✅ |
| "Ver como tabela" (alternativa textual) | ✅ expande com os mesmos dados |
| `aria-label` na série temporal, landmarks, skip link | ✅ na árvore de acessibilidade |
| **Alerta de acúmulo de papéis** | ✅ **sumiu** — ninguém mais acumula |
| Feed de auditoria | ✅ todas as concessões/revogações de hoje, nominais |
| `/atendimento` mobile | ✅ fila, ficha, **aviso de duplicidade disparou com as fixtures duplicadas reais** |
| `/acompanhamento` | ✅ rotula "Visível por vínculo anterior" honestamente |
| Mobile 375px | ✅ **após correção** (ver achado 3) |

## Três achados corrigidos durante a validação

1. **Overflow horizontal no mobile** (486px em viewport de 375): item de grid sem `min-w-0` deixava o gráfico empurrar a célula. Corrigido em `chart-frame.tsx` e na seção de papéis; verificado 375=375 depois.
2. **Guarda de navegação mais rígido que o domínio**: Administrador caía em /acesso-negado em `/atendimento`, contradizendo o acesso global do §1. Novo `requireAnyRole` em `guard.ts`; aplicado em `/atendimento` e `/acompanhamento`.
3. **Cache `.next` corrompido** por build concorrente com o dev server — ambiente, não produto; limpo.

## Revalidação após as correções

tsc 0 · lint limpo · **845 unit** · **140/140 integração** · build ok.

## Pendências que NÃO bloqueiam (registradas)

- SMTP/templates próprios (e-mails saem como "Supabase") — configurar antes de operar com pacientes reais
- Senhas temporárias do Atendente/Curador/Concierge expostas na conversa — **trocar no primeiro acesso**; senha do admin também foi colada em chat — **trocar**
- Fixtures do CRM (2 leads "Ana Demonstração") permanecem — úteis agora para treino do Atendente; apagar antes da operação real
- `listUsers` pagina até 1.000 contas
- Fases 3c/4 da unificação `crm_cases`
- Tela de confirmação com botão para links de uso único (anti-preview de WhatsApp)

## Gate final — reavaliado

Todos os critérios do §10 satisfeitos. **🟢 APTO PARA PRODUÇÃO.**
