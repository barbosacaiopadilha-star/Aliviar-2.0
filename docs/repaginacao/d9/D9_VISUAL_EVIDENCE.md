# D-9 · Evidência visual

**Diretório:** `evidencias/repaginacao/d9/` *(gitignored)*
**HEAD:** branch `d9-primeiro-encontro`
**Reprodução:** rota `/portal-curador/casos/<id>/acolhimento`, sessão
`curador_medico`, Case real do banco local. Sem fixture de tela: o teste clicou
no botão de verdade, recarregou a página, e o banco confirmou
`meeting_held_at is not null = true`.

| ID | rota | role | fatos | viewport | resultado | arquivo |
|---|---|---|---|---|---|---|
| **EV-D9-001** | acolhimento | curador | `meeting_held_at = null` | 1440×900 | *"Ainda sem registro de realização"* + ação disponível | `EV-D9-001__antes__acolhimento-nao-realizado__desktop.png` |
| **EV-D9-003** | acolhimento | curador | idem | 1440×900 | o botão *"Registrar encontro como realizado"* | `EV-D9-003__acao-registrar__desktop.png` |
| **EV-D9-002** | acolhimento | curador | após o ato | 1440×900 | *"Registrado como realizado em …"*, ação some | `EV-D9-002__depois__acolhimento-realizado__desktop.png` |
| **EV-D9-004** | acolhimento | curador | após reload | 1440×900 | o estado **persiste** | `EV-D9-004__estado-persistente__desktop.png` |

**Antes × depois com os mesmos fatos:** EV-D9-001 e EV-D9-002 são o mesmo Case,
o mesmo viewport e a mesma rota — a única diferença é o ato.

## EV-D9-005 / EV-D9-006 — NÃO produzidos

A Jornada da paciente mudou de verdade nesta missão: o marco do Primeiro
Encontro deixou de concluir por `understanding_confirmed_at`. Capturar o
antes/depois exigiria sessão da paciente dona deste Case e a régua nos dois
estados, e não foi feito.

**A mudança está provada por teste** — cinco provas derrubam a mutação que
devolve o critério ao produto, e o oráculo olha o `status` do estágio, não a
frase. **Não está provada por pixel**, e digo isso em vez de declarar o pacote
completo.
