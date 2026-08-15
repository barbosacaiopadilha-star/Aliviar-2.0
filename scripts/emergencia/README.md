# Rollback compatível do Corte 7 — modo de emergência

## O que é

Se a aplicação `732d063` (Production) precisar voltar ao ar sobre um banco já em
**127**, ela quebra ao publicar/despublicar: o Corte 7 recusa escrita direta em
`status`/`publication_status`. Este script reaplica a função de guarda **igual à
127, menos essa recusa** — e nada mais.

- **Não deriva ciclo** da escrita legada (derivaria exigir gravar
  `CADASTRO_VALIDADO` sem ato humano — história fabricada).
- **Não toca dados**, motivos, autoria, relógio, trilha, classificação de
  legado, exclusão, enums ou colunas.
- **Não entra no ledger**: `supabase/migrations` fica intocado; o ledger segue
  **127** com o modo ativo.

## Quando usar

Somente durante um rollback emergencial da aplicação para `732d063` com o banco
já publicado em 127 — e somente por decisão humana registrada.

## Quando NÃO usar

- Banco em 121 (não há o que compensar — o script recusa).
- Qualquer outro ledger que não seja exatamente 127 (recusa).
- Como atalho para escrever nos campos legados fora de emergência.

## Como executar

```bash
psql "<conexao-do-banco-alvo>" \
  -v confirmo=COMPENSAR-C7 \
  -v banco=<current_database esperado> \
  -f scripts/emergencia/rollback-compativel-c7.sql
```

Guardas (a execução aborta se qualquer uma falhar): confirmação literal
`COMPENSAR-C7` · `current_database()` igual ao declarado · ledger **= 127** ·
migration `20260815021141` presente · função alvo existente em `SECURITY
INVOKER` com `search_path` fixo · advisory lock contra execução concorrente ·
transação única (tudo-ou-nada) · **idempotente** — segunda execução é no-op sem
marcador duplicado.

A ativação grava um marcador auditável em `curadoria.audit_logs`
(`metadata.evento = 'modo_compativel_ativado'`).

## Enquanto o modo estiver ativo

O ciclo **não acompanha** a escrita legada. O desvio é derivável a qualquer
momento, sem coluna nova:

```sql
select id, ciclo_de_vida, status, publication_status
  from curadoria.professional_profiles
 where (ciclo_de_vida = 'PUBLICADO_ATIVO') is distinct from
       (status = 'ativo' and publication_status = 'publicado');
```

## Caminho de retorno

Na republicação, uma **migration de retorno** (criada só naquele momento,
numerada normalmente) deve: reaplicar `assert_ciclo_do_profissional` exatamente
como na 127 (o corpo de referência está na própria 20260815005024 + 20260815021141);
re-sincronizar os desviados com `disable trigger` → UPDATEs → `enable trigger`,
no padrão das migrations 125/126, **sem** `ciclo_motivo`, `ciclo_alterado_por`
ou `ciclo_alterado_em`; e gravar `modo_compativel_encerrado` na trilha.

⛔ Este README não autoriza nada em Production. A execução real é decisão do
Guardião, com backup e inventário irmãos (ver `scripts/publicacao/`).
