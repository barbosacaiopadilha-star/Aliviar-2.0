# 41 · OPS-R3A1 — runbook do rate-limit na borda

A porta pública `/solicitar-atendimento` tem duas proteções, e elas são
**complementares, nunca substitutas**:

| Camada | Onde | O que faz |
|---|---|---|
| **Aplicação** | `POST /api/solicitacoes-atendimento` | honeypot · validação de conjunto fechado · idempotência atômica de 24 h no banco |
| **Borda** | Vercel Firewall | rate-limit por IP, **só** neste POST |

**O aplicativo não guarda IP** — nem bruto, nem derivado, nem hasheado. Foi
decisão do responsável, e é o que torna a camada de borda necessária: contar
requisições por origem exige conhecer a origem, e esse conhecimento fica fora
do banco.

> ⚠️ **Contadores de borda podem ser regionais.** Um atacante distribuído entre
> regiões passa pelo limite. Por isso a idempotência do servidor **não é
> opcional**: ela é a defesa que não depende de geografia. Se um dia alguém
> propuser remover a janela de 24 h "porque o WAF já protege", esta linha é a
> resposta.

## 1 · Estado atual

Firewall do projeto `aliviar-2-0`: **não configurado**. Zero regras, zero
drafts, Attack Mode off. Verificado com `vercel firewall overview`.

Capacidades confirmadas no CLI **58.10.0** (`vercel firewall rules add --help`):
`--action rate_limit` · `--rate-limit-keys ip` · janela **10–3600 s** ·
`--rate-limit-requests` 1–10 000 000 · `fixed_window` / `token_bucket` ·
`--rate-limit-action log | deny | challenge`. Regras nascem **draft**;
`publish` é comando separado.

## 2 · A regra

```bash
npx vercel firewall rules add ops-r3a1-solicitacao-atendimento-ratelimit \
  --scope aliviar --project aliviar-2-0 \
  --action rate_limit \
  --rate-limit-action log \
  --rate-limit-algo fixed_window \
  --rate-limit-keys ip \
  --rate-limit-requests 10 \
  --rate-limit-window 600 \
  --condition '{"type":"path","op":"eq","value":"/api/solicitacoes-atendimento"}' \
  --condition '{"type":"method","op":"eq","value":"POST"}' \
  --description "OPS-R3A1: conta POST por IP na porta publica" \
  --yes
```

**Dez pedidos por dez minutos, por IP.** Generoso de propósito: quem erra o
telefone e reenvia três vezes não é atacante, e uma porta de saúde que recusa
alguém em pânico erra pior do que uma que aceita ruído.

⛔ **Nada de regra sobre o `GET` da página** — visitar não é pedir.
⛔ **Nada global**, nada sobre `/login`, nada sobre rota autenticada.

## 3 · Rollout, em fases

1. **Production `log`** — a regra acima, como está. Conta e registra; **não bloqueia**;
2. **revisão do tráfego real** — quantos IPs chegam perto de 10/600 s? Se gente comum encostar no limite, o limite está errado, não a gente;
3. **Preview com `rate_limit`** — trocar `--rate-limit-action` para `rate_limit`, só em Preview;
4. **teste de excesso e de falso positivo** — provar que o 11.º pedido é barrado e que o 10.º não;
5. **Production `log` de novo** — confirmar que a mudança não alterou o tráfego legítimo;
6. **Production 429**, após aprovação explícita.

Cada passagem é missão própria. ⛔ **Nenhuma delas pertence à OPS-R3A1.**

## 4 · O que esta missão fez, e o que não fez

**Fez:** validou o comando acima no CLI real — ele parseou, renderizou
*"Rate Limit (10/600s) · Keys: ip · If exceeded: log"* e pediu confirmação.

**Não fez:** não publicou, e **não deixou draft pendente**. O draft nasce na
missão de deploy, depois de o endpoint existir em Production — uma regra
apontando para path inexistente é ruído perigoso: parece proteção e não é.

Para conferir antes de qualquer publicação:

```bash
npx vercel firewall diff --scope aliviar
```

## 5 · Reversão

Draft: `npx vercel firewall discard`. Regra já publicada:
`npx vercel firewall rules disable ops-r3a1-solicitacao-atendimento-ratelimit`
seguido da publicação da mudança. Desabilitar preserva a regra e o histórico;
remover apaga os dois.
