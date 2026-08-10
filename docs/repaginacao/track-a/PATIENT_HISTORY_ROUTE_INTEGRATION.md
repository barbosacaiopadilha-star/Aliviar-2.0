# A2B · Sua História dentro da experiência privada

## O que a auditoria encontrou — e o que ela desmentiu

A leitura inicial era *"a rota é pública, precisa migrar"*. **Não era.**

| rota | natureza real |
|---|---|
| `/sua-historia` (raiz, exata) | **pública** — página explicativa. O próprio código diz: *"nunca permite preenchimento anônimo"* |
| `/(public)/sua-historia/(wizard)/*` | **já autenticada** — `requireRole("paciente")` no layout, desde antes desta missão (ADR-018) |

O grupo `(public)` é de **organização de arquivos**, não de acesso. O wizard sempre exigiu sessão de paciente.

**Então não houve mudança de rota, de href, de guarda nem de redirect.** O defeito era só de moldura: a paciente clicava em "Minha história" na navegação privada e a Aliviar privada sumia da tela — embora ela continuasse autenticada o tempo todo.

Isso também preserva o §24: a entrada pública de aquisição (`/sua-historia`) fica intacta.

## O que mudou

**1 · O layout do wizard veste o `PatientShell`.** Mesmo componente da A2, mesmo `userMenu`. O calor ambiente do wizard (ADR-031) permanece sob o conteúdo, agora dentro da casa.

**2 · O item ativo passa a reconhecer subpassos.** A comparação era `pathname === href`. "Minha história" aponta para `/sua-historia/continuar`, mas o wizard tem seis passos próprios — e em nenhum deles o item acendia.

A regra passou a ser por **seção**: dentro de `/paciente`, o item é o segundo segmento; fora dela, o primeiro. `/paciente` sozinho continua exato, senão o Início acenderia em toda a casa. Dez casos verificados, incluindo os que a primeira versão da regra errou.

## Verificado no navegador

`/sua-historia/continuar` → redireciona para o passo real (`/revisao`) e:

| | desktop 1440 | mobile 390 |
|---|---|---|
| `PatientShell` renderiza | ✅ | ✅ |
| `<header>` presente | ✅ | ✅ |
| item ativo | **"Minha história"** | **"Minha história"** |
| overflow | 1440/1440 | **390/390** |

O active state foi confirmado num **subpasso**, que é a prova que interessa.

## Gaps

**GAP-A2B-visual** — o wizard ainda não foi repaginado. Ele agora *pertence* à experiência privada, mas sua densidade interna é a de antes. Fica para a fatia visual de Sua História.

**GAP-A4** — Início × Linha do tempo seguem como duas jornadas.
