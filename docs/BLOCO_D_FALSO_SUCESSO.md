# BLOCO D — FALSO SUCESSO, FAIL-OPEN E ROUND-TRIP (D1+D2+D3)

**Data:** 2026-08-02 · **Branch:** `remediacao/bloco-d` · Zero migrations; domínio/invariantes/RPCs intocados. **Suíte de remediação: 53/53 verde — a régua do G1 está integralmente fechada nos Blocos B, C e D.**

## 1. Matriz dos fluxos corrigidos

| Fluxo | Defeito (achado) | Correção | Frente |
|---|---|---|---|
| Blocklist da Rede | fail-open: erro ⇒ Set vazio ⇒ profissional bloqueado ofertável (FS-01) | erro lança com causa; Mesa mostra falha com ERR- — Rede inflada impossível | D1 |
| Relatório por seleção | erro ⇒ `null` ⇒ `success:true` (FS-05/AT-01-cauda) | causa propagada; callers nunca convertem em sucesso | D1 |
| Worklist do Concierge | erro ⇒ `[]` ≡ "sem trabalho" (FS-06) | erro ⇒ estado visível com ERR- ("não conseguimos lê-la") | D1 |
| Autosave | recusa ⇒ "Sua resposta foi salva." (FS-02) | estado de erro distinto, texto preservado; **sessão expirada de 1ª classe** (`NaoAutenticadoError` por tipo em 3 camadas; frase própria + `/login?next=`) | D1 |
| Reconhecimento | "Registrando…" eterno com RPC persistida; "Este Perfil não é seu." p/ sessão expirada (UX-02) | timeout 8s com mensagem honesta + botão; 42501-por-sessão distinguido de posse (por código) | D1 |
| Actions da Curadoria | `fail()` devolvia erro cru sem log (OBS-02) | `registrarErro` + `falhaParaUsuario` (domínio 23514/P0001 atravessa; técnico vira frase+ref) | D1 |
| Silêncios | `safe()` mudo; `setEncaminhado` otimista; `case_events` descartados (FS-05/06) | logados/checados; UI só afirma pós-sucesso | D1 |
| Endpoint de leads | morto no middleware; segredo só em produção; vazamento no catch (FUN-01/SEG-05) | rota pública com **segredo obrigatório em todo ambiente**, `timingSafeEqual`, catch com ERR- sem vazamento; teste de integração 5 casos; contrato estático repinado | D2 |
| Schemas | ausência ⇒ `[]` ⇒ apagar (FS-03/D21a) | ausente ⇒ preservar (leitura prévia fail-closed); `[]` explícito limpa; adapters `?.length` | D2 |
| Editor do Relatório | `join(" ")`/`join("\n")` sem inversa; `favorablePoints: []` sempre (FS-04/D21b) | **arrays tipados até a action** (sem FormData delimitado); inversa definida (`relatorio-itens.ts`: 1 item/linha); dirty-tracking (intocado = byte a byte); campo não-editado = ausente; limpar = ato explícito | D3 |

## 2. Contrato de resultado (vigente)

Sucesso só com persistência confirmada (ADR-064 §4) · erro real sempre com causa preservada no log e referência ERR- ao usuário · erro ≠ ausência em toda leitura operacional · ausência no payload preserva; `[]` explícito limpa · arrays sobrevivem ao round-trip (dois pontos continuam dois; ordem preservada; legado sem perda adicional) · sessão expirada é estado discriminado por tipo, nunca substring.

## 3. Gates antes → depois

G1 fixou 8 vermelhos de D. D1: D17/D18/D19/D22+FS-02 verdes (49/4). D2: D20/D21a+FS-03 verdes (51/2). D3: D21b×2 verdes (**53/0**). Oráculos: intocados em D1/D2; em D3, apenas a fixture-espelho da página foi atualizada ao novo contrato (função documentada dela; zero asserções alteradas — verificado pelo orquestrador por diff). B11–B19 e C completos preservados em todas as frentes. Testes novos: sessão-expirada (remediação), endpoint de leads (integração, 5), `report-editor-roundtrip` (components, 10), `relatorio-itens` (unit, 6).

## 4. Riscos residuais e itens adiados

- **K:** duplicação parecer UI×domínio (dois editores p/ o mesmo documento); Mesa sem dirty-tracking (legado com `\n` interno re-tokeniza ao encerrar); guidance "um item por linha" no domínio; `includes("sucesso")` remanescente fora do escopo D (FS-07 parcial); mensagens com "(ref. ERR-…)" exigem comparação por código.
- **F:** superfície de limpeza deliberada de `favorablePoints` (hoje só a regeneração os reescreve); autosave/loading da Mesa (UX-06 restante).
- **I/H:** rate-limit do endpoint de leads; ERR- no runbook; `global-error`.
- **E:** `maybeSingle` duplicata-vira-ausência (8+ leituras — FS-06 restante, casa com fonte única).
- **J:** smoke remoto do endpoint de leads (validação operacional do FUN-01).
- Dev sem o runner local recebe 503 no endpoint (fail-closed intencional).

## 5. Encerramentos no Registro (integralmente cumpridos)

FS-01 · FS-02 · FS-03 · FS-04 · FUN-01 (técnico; smoke remoto → J) · UX-02 · FS-05 (as 4 posições + case_events) · D-gates todos. **Parciais mantidos abertos:** FS-06 (resta `maybeSingle`), FS-07 (resta fora da Curadoria), UX-06 (resta loading/autosave da Mesa), OBS-02 (resta boundary global/runbook).
