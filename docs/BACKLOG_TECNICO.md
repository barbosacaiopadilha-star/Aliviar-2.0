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
