# Backlog técnico

Aberto no encerramento da release da arquitetura canônica (2026-07-27). **Nada aqui foi executado.** Cada item nasceu de um achado concreto durante a migração, e traz a evidência que o originou — para que a decisão de priorizar não dependa de memória.

Estado da referência: [`BASELINE_CANONICAL_ARCHITECTURE.md`](BASELINE_CANONICAL_ARCHITECTURE.md).

---

## Segurança

### S1 — Auditar e endurecer os grants das funções históricas
**Evidência:** 31 das 44 funções do schema `curadoria` são executáveis por `anon`. É o padrão do PostgreSQL (`create function` concede `EXECUTE` a `PUBLIC`) nunca revogado. As cinco funções canônicas já foram fechadas nesta release; estas são anteriores.
**Risco:** depende de cada função — algumas devolvem booleano, outras podem devolver identificadores. Exige leitura uma a uma, não uma varredura cega.
**Não fazer:** revogar tudo de uma vez. Uma revogação em lote quebraria policies e triggers que dependem do privilégio do invocador.

### S2 — Política permanente de backup e recuperação
**Evidência:** organização Supabase no plano `free` — sem PITR, sem backup automático gerenciado. O único ponto de recuperação hoje é um dump manual (`aliviar-prod-pre-canonical.dump`, SHA-256 `949c1a55…`), que **ainda está numa pasta local**, não em armazenamento controlado pela empresa.
**Duas partes:** (a) mover esse dump para cofre/bucket privado; (b) decidir entre plano pago com PITR ou rotina automatizada de dump verificado.

### S3 — Conta e roteiro de smoke test seguro
**Evidência:** as 40 contas sintéticas em produção não têm papel atribuído; não alcançam nenhuma superfície autenticada. Por isso a validação pós-deploy desta release ficou limitada a rotas públicas e redirecionamentos.
**O que resolve:** uma conta de teste com papel `paciente`, dados claramente marcados, e um roteiro não destrutivo que possa rodar a cada release.

---

## Infraestrutura

### I1 — CI no GitHub Actions
**Evidência:** não existe `.github/workflows`. O PR desta release não teve nenhum check — toda a certificação foi local, e um erro que passasse aqui chegaria a produção sem barreira.
**Mínimo útil:** `tsc --noEmit`, lint, build e as suítes unit + componentes. Integração e E2E exigem Supabase local; decidir se entram via serviço no runner ou ficam manuais.

### I2 — Reconciliação do ledger de migrations
**Evidência:** as cinco migrations desta release foram registradas com timestamps gerados pela ferramenta de aplicação, não com os dos arquivos. Foi reconciliado manualmente, depois de provar por md5 que o SQL aplicado era idêntico ao do repositório.
**O que resolve:** padronizar a aplicação por `supabase db push` (que preserva a versão do arquivo), ou tornar a reconciliação um passo explícito do runbook.

### I3 — Monitoramento
**Evidência:** hoje a única observação pós-deploy é consulta manual aos logs da Vercel. Não há alerta para erro 5xx, falha de RLS ou queda de disponibilidade.

---

## Produto

### P1 — Higiene das fixtures de teste
**Evidência:** a suíte de integração deixa ~194 `cases` e ~269 `patient_stories` no banco local a cada rodada. Os arquivos migrados nesta release limpam o que criam; os demais (`cases`, `briefing-capture`, `curadoria-completa`, `patient-portal`, `team`) não.
**Efeito colateral real:** o acúmulo deixou as telas administrativas lentas o bastante para estourar o timeout de um teste E2E.

### P2 — Remoção de `auth.users` no teardown
**Evidência:** `deleteUser` é chamado sem verificação de erro em todas as suítes. Contas de teste crescem indefinidamente.

### P3 — Componentes órfãos da Landing
**Evidência:** `faq-book-section.tsx` e `final-cta-section.tsx` existem no repositório mas não são montados por nenhuma página desde o redesenho editorial (ADR-034). O primeiro ainda tem teste de componente próprio.
**Decisão pendente:** remover, ou remontar se a seção deve voltar.

### P4 — Status do Caso não atualiza o selo do cabeçalho
**Evidência:** ao mudar o status na página do Caso, o controle mostra o novo valor mas o selo ao lado do título continua com o antigo até um reload — o controle atualiza estado local e a página é server-rendered, sem `router.refresh()`.
**Impacto:** cosmético, mas mostra dado desatualizado a quem acabou de agir.

### P5 — Fechar a janela de compatibilidade da âncora legada
**Evidência:** `connection_records.final_curadoria_delivery_id` e o reconhecimento da entrega legada continuam ativos. Só devem sair quando nenhum Case ativo depender deles.

### P6 — Barril `src/modules/*/index.ts` sem consumidor
**Evidência:** doze arquivos `index.ts` de módulo não são importados por caminho de barril em lugar nenhum — os consumidores importam o arquivo específico. Ver a lista completa no relatório de encerramento.
**Cuidado:** um barril não importado não é necessariamente morto; pode ser a API pública pretendida do módulo. Decidir por módulo, não em lote.

---

## Dívida arquitetural controlada

### STORY-GET-WRITE-001 — o carregamento do wizard cria a história (GET com efeito colateral)

**Aberta em:** 2026-08-02, durante a Release de Reconstrução e Estabilização.
**Estado:** aceita por decisão explícita do responsável. **Não bloqueia a release local.**

**Situação atual.** `getOrCreateActiveStory` é chamada em dois pontos de leitura:
`/sua-historia/continuar` (que resolve o passo e redireciona) e o layout do
wizard (que monta o `StoryDraftProvider`). Os dois são GET, e os dois criam a
história quando não existe rascunho.

**Evidência que originou.** No E2E do fluxo completo, uma paciente terminou com
**duas histórias criadas com 47 microssegundos de diferença** — a do prefetch do
Next.js (vazia) e a do clique (com as respostas dela). Prefetch executa GET sem
clique nenhum: a rota gravava por antecipação.

**Motivo de não refatorar nesta release.** Tornar a história opcional atravessa
o `StoryDraftProvider` inteiro — autosave com debounce, cadeia de serialização
de promises (que existe por causa de um incidente P0 de gravação fora de ordem),
detecção de conflito por revisão e recuperação a partir do cache local. É o
componente cliente mais delicado do fluxo, e a release em curso é de
estabilização. O problema de correção — duplicação — já está resolvido no banco.

**Risco residual.** Uma paciente que apenas *passa* pelo wizard sem responder
nada deixa um rascunho vazio. Não corrompe nada, não é visível para ela, e a
consolidação da migration sabe descartá-lo. O que **não** pode mais acontecer —
duas histórias — está impedido pelo índice.

**Proteções ativas (todas testadas):**
1. índice único parcial `patient_stories (profile_id) where status = 'rascunho'`;
2. tratamento de `23505` em `getOrCreateActiveStory`;
3. releitura da história vencedora na corrida perdida;
4. `prefetch={false}` na navegação do paciente;
5. teste concorrente — 5 chamadas paralelas, uma história
   (`tests/integration/historia-unica-por-paciente.integration.test.ts`);
6. E2E do fluxo completo comprovando uma única história;
7. nenhuma mensagem de erro chega à paciente — a corrida resolve em silêncio;
8. nenhuma perda de conteúdo — a consolidação preserva qualquer rascunho com
   conteúdo (7 cenários em
   `tests/integration/consolidacao-rascunhos-duplicados.integration.test.ts`).

**Solução futura recomendada.**
- GET apenas consulta; sem escrita em caminho de leitura.
- História opcional até a primeira ação de escrita.
- Criação por Server Action / POST explícito, depois da decisão da paciente.
- `StoryDraftProvider` aceitando estado inicial sem `storyId`.
- Autosave cria o rascunho na primeira alteração real.
- Chamadas concorrentes resolvendo para o mesmo registro.
- **O índice permanece** depois da refatoração — ele é a garantia, não o
  contorno.

**Componentes afetados:** `src/app/(public)/sua-historia/(wizard)/layout.tsx`,
`src/app/(public)/sua-historia/(wizard)/continuar/page.tsx`,
`src/modules/story/use-story-draft.tsx`, `src/modules/story/actions.ts`,
`src/modules/story/repository.ts`, `src/modules/story/storage.ts`.

**Critério para remover a dívida:** nenhum caminho GET grava em
`patient_stories`; o wizard funciona com `storyId` nulo até a primeira
alteração; os testes concorrente e de consolidação continuam verdes sem
alteração; e o E2E do fluxo completo prova que carregar a home e o wizard, sem
responder nada, deixa **zero** histórias no banco.

### STORY-NOVA-001 — não existe superfície para começar uma segunda história

**Evidência:** com a correção do Marco G (2026-08-02), navegar até "Minha
história" depois do envio reabre a história ENVIADA — nunca cria outra. Isso é
o comportamento correto; a consequência é que hoje **nenhuma** superfície
permite deliberadamente começar uma segunda história ("Contar uma nova
história"). `getOrCreateActiveStory` só cria quando não existe história alguma.
**Decisão de produto pendente** — não uma lacuna técnica. Quando aprovada, a
criação deliberada deve: exigir confirmação; não substituir a anterior;
preservar histórico; criar um novo rascunho; e manter no máximo um rascunho
ativo por paciente (o índice único de 20260802120000 já garante o último).
**Não fazer:** reintroduzir a criação implícita por navegação para "resolver"
esta ausência.

### RECONHECE-REFRESH-001 — `router.refresh()` não commita a árvore nova em `/paciente`

**Aberta em:** 2026-08-02, durante o PASSO 8 da Release de Reconstrução
(reconhecimento do Perfil pela paciente). **Contornada por navegação de
documento completa — não bloqueia a release.**

**Sintoma.** Após `reconhecerPerfilAction` resolver com sucesso,
`router.refresh()` nunca atualizava a tela: botão preso em "Registrando…",
pendência "Falta você reconhecer" visível, com o banco já `VALIDATED`.

**Evidência instrumentada (spec temporário com captura de rede, três
variantes de código):**
1. Action com `revalidatePath("/paciente")` → o corpo do POST nunca fecha.
2. Action revalidando só outras rotas → idem.
3. Action sem `revalidatePath` nenhum → o POST fecha em ~170ms com o
   resultado completo (`1:{"success":true,...}`); o flight RSC do
   `router.refresh()` chega **completo** (28.529 bytes em ~300ms), com o
   estado novo dentro ("Você reconheceu" presente, pendência ausente), zero
   error digests, todos os 7 chunks referenciados presentes em disco — e o
   router do Next 15.5.20 **nunca commita a árvore**. Reproduzido com o
   refresh na mesma transition da action, em transition separada e síncrona,
   e fora de transition. Um fetch RSC manual da mesma rota fecha em ~290ms.

**Observação correlata (não explicada):** flights de prefetch das rotas
`/paciente/*` são abortados (`net::ERR_ABORTED`) ~100-300ms após os headers,
pelo próprio renderer, sem substituição — possível relação com o cache do
router.

**Contorno em vigor:** `window.location.reload()` após o retorno da action
(GET de documento ~280ms, estado novo garantido). Regressões em
`tests/unit/revalidacao-caminhos-vigentes.test.ts` impedem a volta de
`revalidatePath`/`router.refresh()` nesta superfície, e o E2E exige a
pendência sumir sem ação do usuário.

**Critério para remover a dívida:** numa futura atualização do Next,
reproduzir o spec instrumentado com `router.refresh()`; se a árvore commitar
(pendência some sem navegação de documento), restaurar o refresh e atualizar
as regressões no mesmo commit.

### NAV-COMMIT-001 — navegação client-side intermitentemente não commita (Admin → detalhe da paciente)

**Aberta em:** 2026-08-02, durante o PASSO 5 da Release de Reconstrução.
**Contornada por âncora de documento — não bloqueia a release.**

**Sintoma.** Clicar em "Gerenciar" na lista de pacientes deixava a URL parada
por 15s, de forma intermitente (3 falhas e 2 sucessos em execuções idênticas
do mesmo build; isolado, passava).

**Evidência instrumentada (rede capturada na execução real):** o flight RSC
da rota de detalhe dispara, headers 200, **corpo completo (7,4 KB em
~170ms)**, chunk JS da página carregado — e o router não commita: URL e DOM
imóveis. Classificação pelo quadro da release: *corpo encerrou, URL/DOM não
mudaram → commit do router falhou*. Persistiu com `prefetch={false}` no link
(a rajada de prefetch por linha foi eliminada mesmo assim, por custo: uma
página de paciente renderizada POR LINHA a cada carga da lista). Sem
interferentes da app: nenhum debounce na busca, nenhum listener global de
router, filtro síncrono.

**Mesma família de** [[RECONHECE-REFRESH-001]] (flight completo entregue,
commit ausente; lá no `router.refresh()`, aqui na navegação por `<Link>`),
no Next 15.5.20.

**Contorno em vigor:** o "Gerenciar" é uma âncora `<a>` — navegação de
documento (~300ms, determinística). Regressão: o próprio PASSO 5 do E2E
completo, que confirma rota de detalhe em até 15s.

**Critério para remover a dívida:** na mesma janela de upgrade do Next da
RECONHECE-REFRESH-001, restaurar o `<Link>` e provar N execuções completas
consecutivas verdes no PASSO 5; remover as duas dívidas juntas se o commit
do router se mostrar íntegro.
