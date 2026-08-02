# BLOCO B.6 — FECHAMENTO DAS ASSIMETRIAS TRANSACIONAIS

**Data:** 2026-08-02 · **Branch:** `remediacao/bloco-b6` · Escopo exclusivo: os 3 bloqueantes do B.5 (B1/B2/B3). Nenhum registrável/cosmético tocado; nenhuma imutabilidade geral (Bloco C); migrations congeladas e do Bloco B intocadas.

## Os três bloqueantes — causa raiz e solução

### B1 — Par de entrega bidirecional
- **Causa raiz:** o trigger de M150 cobria só a direção seleção→DELIVERED; `markReportDelivered`/PostgREST alcançavam relatório entregue com seleção em DRAFT.
- **Solução:** migration `20260802154000_par_de_entrega_bidirecional.sql` (ledger **74/74**; rollback colável no arquivo) — trigger `enforce_report_delivery_requires_delivered_selection` (BEFORE UPDATE em `curadoria_reports`, transição `delivered_at` null→valor) exigindo a seleção DELIVERED. **O caminho oficial passa por desenho**: verificado em M150 que a RPC entrega a seleção *antes* do relatório na mesma transação — M150 não foi tocada. `markReportDelivered` mantida com decisão documentada: a guarda é do banco; os ~16 usos de teste já entregam a seleção antes (caminho honesto, nenhum alterado); caller desonesto novo recebe erro de domínio do trigger.
- **Gate novo B17** (ataque + pino do caminho oficial): vermelho antes (`delivered_at do Relatório após o ataque: …467+00:00 — expected null not to be null`), verde depois; nenhuma metade muda em falha; PostgREST direto recusado. B12 não foi alterado.

### B2 — Erro de leitura no provisionamento
- **Causa raiz:** `conversion-actions.ts:120` descartava `error` — falha de banco virava "não existe" e reabria o beco do e-mail duplicado em silêncio.
- **Solução:** novo `getProvisioningOperation` (patient-account-repository) — erro de SELECT **lança**, nunca vira ausência; a action envolve em try/catch → `falhaParaUsuario("crm.convertLead.retomada.leitura")` com referência rastreável e **zero efeitos** (nenhum `createUser`); ausência legítima segue o fluxo. Preferência do B.5 (retomada na RPC) avaliada e recusada com justificativa documentada: a decisão precisa ocorrer antes do `createUser`, quando não há `profile_id`, e o passo evitado vive fora do banco.
- **Gate novo B18** (×2, client fake): vermelho antes (defeito estrutural — não havia onde o erro propagar), verde depois. Sem substring de mensagem.

### B3 — Idempotência real do caminho admin
- **Causa raiz:** `operation_key = patient-account:<profileId>` derivada do id gerado na própria tentativa — nomeava, não deduplicava.
- **Solução:** **chave estável fornecida na submissão** — `operationKey: uuid` obrigatória no schema, gerada no *render* do formulário (`useState(() => crypto.randomUUID())`, hidden field). Racional documentado no código: id nasce durante a tentativa (o defeito); e-mail é editável e reutilizável no tempo (chave permanente por e-mail travaria recriação legítima); uuid-por-render define "esta solicitação" como unidade de retry. Novo `provisionPatientAccount` consulta a operação pela chave **antes** do `createUser` (leitura com erro tratado — lição do B2) e devolve resultado discriminado `created`/`already_provisioned`; retry de operação concluída ⇒ resposta de domínio explícita, **sem senha nova**; e-mail duplicado de outra solicitação ⇒ `ContaComEsteEmailJaExisteError` por **código** (`email_exists`/422), nunca substring. **Nenhuma migration necessária** (unique de `operation_key` já existia).
- **Gate novo B19** (×3): as 7 exigências provadas — mesma chave repetida ⇒ mesmo resultado/1 conta; mesma chave **em paralelo** ⇒ exatamente 1 criação; chave diferente + mesmo e-mail ⇒ recusa clara com original intacta; falha intermediária + retry ⇒ recupera; zero órfão; credenciais só na execução que concluiu.

## Verificação independente do orquestrador

`git diff tests/remediacao/` = **+309/−0** (só os 3 gates; zero oráculo tocado) · suíte `test:remediacao` = **14 verdes (C8+B11–B16+B17–B19) / 19 vermelhos** — exatamente os C/D pelas mensagens originais, re-executada pelo orquestrador · HEAD intacto até os commits oficiais (zero commits do agente) · porteiro 2/2 · unit 1719+FS-03 intencional · components 399+FS-02 intencional · integração relacionada 80/80 · typecheck limpo · ledger 74/74.

## AT-05 — reaberto e reencerrado com transparência

Reaberto no início do bloco (o encerramento do B apoiava-se em idempotência inexistente — B3). **Reencerrado agora** com a garantia real: gate B19 verde incluindo concorrência; registro atualizado no `REGISTRO_UNICO_DE_ACHADOS.md` com o histórico completo (encerrado → reaberto → reencerrado), sem apagar nada.

## Riscos residuais

(1) Corrida da mesma chave: o perdedor pode receber a recusa de e-mail em vez de recuperação imediata — o retry seguinte recupera; gate prova "exatamente 1 criação". (2) Par invertido **legado** pré-154000 não é reescrito (detectável pela consulta de fechamento da migration). (3) INSERT de relatório já-entregue e reescrita de carimbos: Bloco C (C6/C7), simétrico à M150. (4) 422 sem `code` da Admin API tratado como e-mail duplicado (fallback GoTrue antigo documentado). (5) Banco-limpo-do-zero (74) só no CI efêmero.

## Declaração final

Com B1/B2/B3 verdes, B11–B16 preservados, C/D vermelhos pelo motivo correto e AT-05 honestamente reencerrado:

> **O BLOCO C pode assumir a fundação transacional.**

(Veredicto do `BLOCO_B_VALIDACAO_ARQUITETURAL.md` atualizado com adendo datado; as exceções que o C ainda não pode assumir permanecem as declaradas — §9 do B.5 menos os 3 bloqueantes.)
