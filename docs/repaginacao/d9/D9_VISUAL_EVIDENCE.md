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

## EV-D9-005 e EV-D9-006 — Jornada da paciente

**Cenário sintético recriado** (missão D-9F): banco local resetado pelo
mecanismo oficial, 117 de 117 migrations, contas e Case reconstruidos pelo seed.
Paciente sintetica `validacao-mesa@example.test`; credencial emitida pelo
proprio seed e nao reproduzida aqui. Case `7451d110-46ee-4ff5-b017-42bb994c260a`.

| | EV-D9-005 | EV-D9-006 |
|---|---|---|
| rota | `/paciente` | `/paciente` |
| role | paciente | paciente |
| `meeting_held_at` | **nulo** | **presente** |
| `meeting_scheduled_at` | nulo | nulo |
| `understanding_confirmed_at` | nulo | nulo |
| `validated_at` | presente | presente |
| status do Perfil | `VALIDATED` | `VALIDATED` |
| viewports | 1440x900 e 390x844 | 1440x900 e 390x844 |

**A unica diferenca material entre as duas e `meeting_held_at`**, registrado
entre as capturas pela **UI real do Curador** — nao por SQL. O banco confirmou
depois: `meeting_held_at is not null = true`.

As imagens **diferem** (hash MD5 distinto nos dois viewports), entao a mudanca
chegou a tela.

Arquivos: `EV-D9-005__antes__jornada__{desktop,mobile}.png` e
`EV-D9-006__depois__jornada__{desktop,mobile}.png`.

### Dois achados colhidos na captura

**1 · overflow horizontal a 390px** na Home da paciente, medido em ambos os
estados. Nao pertence a D-9 e nao foi corrigido — fica para a Trilha A.

**2 · D-11** — os mapas ja constavam `VALIDATED` num Case novo sem encontro
agendado, sem encontro realizado e sem historia reconhecida. Detalhado em
[D11_ORDEM_ENCONTRO_VALIDACAO.md](D11_ORDEM_ENCONTRO_VALIDACAO.md).

---
## §4 · ACHADO — os mapas foram validados sem prova do encontro

Durante a captura, o Case `fc07b1a1…` apresentava:

| fato | estado |
|---|---|
| `understanding_confirmed_at` | presente |
| `validated_at` | presente |
| `meeting_held_at` | **nulo** — até a captura de EV-D9-002 |

Ou seja: **os mapas de prioridades foram validados enquanto o Primeiro Encontro
não tinha prova de realização.** A regra de produto diz que a validação
definitiva dos mapas ocorre no Primeiro Encontro — então ou o fluxo permite
validar antes, ou o encontro aconteceu sem ser registrado.

**Registrado, não corrigido**, conforme §4. É o mesmo padrão dos outros gaps
da D-9: o produto existe, o evento não tem prova, e ninguém deveria inferir um
do outro.