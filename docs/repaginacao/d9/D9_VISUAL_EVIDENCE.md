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

A Jornada da paciente mudou de verdade: o marco do Primeiro Encontro deixou de
concluir por `understanding_confirmed_at`. Capturar o antes/depois exige uma
sessão da PACIENTE dona de um Case com os fatos certos — e é aí que trava.

| conta | Cases | serve? |
|---|---|---|
| `paciente.teste@…` (permanente, em `test-users.local.json`) | **0** | não — a Jornada dela é o estado vazio |
| `validacao-mesa@example.test` (sintética do seed) | 1, com os fatos certos | **sim, mas** a senha só é emitida quando o seed a CRIA |

O seed reaproveita a conta existente e, nesse caminho, não imprime credencial.
Recriá-la significaria apagar a paciente e o Case — destruindo justamente os
fatos que a evidência precisa. E fabricar uma senha para a conta não é algo que
eu faça.

**A mudança está provada por teste**: cinco provas derrubam a mutação que
devolve o critério ao produto, e o oráculo olha o `status` do estágio, não a
frase. **Não está provada por pixel.**

**Como destravar:** rodar o seed a partir de um banco sem a conta
`validacao-mesa@example.test` — ele então cria a paciente e imprime o login.
Com essa credencial, as duas capturas saem em uma passagem.

---

## §4 · ACHADO — os mapas foram validados sem prova do encontro

Durante a captura, o Case `fc07b1a1…` apresentava:



Ou seja: **os mapas de prioridades foram validados enquanto o Primeiro Encontro
não tinha prova de realização.** A regra de produto diz que a validação
definitiva dos mapas ocorre no Primeiro Encontro — então ou o fluxo permite
validar antes, ou o encontro aconteceu sem ser registrado.

**Registrado, não corrigido**, conforme §4. É o mesmo padrão dos outros gaps
da D-9: o produto existe, o evento não tem prova, e ninguém deveria inferir um
do outro.