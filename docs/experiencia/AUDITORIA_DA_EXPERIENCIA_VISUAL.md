# Auditoria da Experiência Visual — Projeto Experiência Visual · Etapa 7

> **Status:** auditoria. Nenhuma linha de código alterada; nenhum texto corrigido; nenhum componente criado.
> **Pergunta central:** *a plataforma inteira já parece pertencer à mesma casa?*
> **Resposta curta:** **o miolo da casa da paciente, sim — da Recepção à Mesa. Os extremos (Continuidade, Decisão percebida), os fundos e o Sistema Visual transversal, ainda não.**
> **Fontes:** Narrativa · Travessia · Linguagem · Arquitetura dos Componentes · A_MESA · F1–F4 (L1–L14, R1–R18) · inventário das 56 telas · commits `f10f308`, `9f64ddc`, `aea02c0`, `c56b264` · varredura factual do código em HEAD (toda evidência abaixo cita arquivo:linha) · capturas por papel feitas nesta auditoria.
> **Data:** 2026-08-01

---

# 1 · Critério de corte declarado

Três classes, por evidência — nunca por gosto:

- **VERDE** — obedece às fontes congeladas naquilo que já foi implementado como etapa; ressalvas apenas transversais (abaixo).
- **AMARELA** — obedece em parte; resíduos concretos do RC1 anterior, nomeados.
- **VERMELHA** — ainda lê como sistema/dashboard/portal/CRUD, ou é código legado sem papel na planta.

**Ressalva transversal (não rebaixa tela individual):** a **caixa-alta com tracking** dos eyebrows e `patient-section-title` (`patient-dashboard.css:263-269`, `patient-primitives.tsx:38,61`, `ambient-hero.tsx:41` e ~50 ocorrências em toda a plataforma) viola F2 §6.2 em **todas** as áreas ao mesmo tempo — é dívida do Sistema Visual (Onda 6), não de uma tela. O mesmo vale para o **blur** do `PatientCard` (`patient-dashboard.css:152-153` — o próprio arquivo o proíbe na linha 360 para a carta) e para as **três paletas concorrentes** (globals × patient-dashboard × landing-editorial).

---

# 2 · Contagem e mapa das 56 telas

**VERDE: 7 · AMARELA: 39 · VERMELHA: 10**

## A planta dela

| Rota | Ambiente | Класс | Evidência principal |
|---|---|---|---|
| `/` | Entrada | 🟡 | hero revisado (aea02c0) ✓; mas vídeo em loop autônomo (`hero-editorial.tsx:60-62`), blur no header público (`public-header.tsx:33`), gradientes decorativos (`landing-editorial.css:170-224`), "A equipe analisa"/"nossa equipe" (`editorial-sections.tsx:47`, `faq-compact.tsx:10`) |
| `/login` · `/recuperar-senha` · `/nova-senha` | Entrada | 🟡 | funcionais e sóbrias, mas ainda cartão de sistema — não a porta com a luz de dentro (Narrativa §8); intocadas pelos 4 commits |
| `/sua-historia` (capa) | Limiar | 🟢 | revisada em aea02c0 ("uma pessoa, com nome, lê") |
| `continuar` · `para-quem` · `motivo` · `historia` · `preferencias` | Recepção | 🟢 | uma pergunta por vez, progresso sem número, autosave discreto — a Recepção exemplar |
| `informacoes` · `revisao` | Recepção | 🟡 | "nossa equipe" ×4 (`informacoes:18`, `revisao:26,32,80`) — responsabilidade sem rosto na hora mais sensível |
| `/paciente` | corredor | 🟢 | Recepção implementada (aea02c0): Curador nomeado, como-funciona reabrigado, pulso removido |
| `/paciente/curadoria` | Sala→Mesa→Decisão→Acomp. | 🟡 | Travessia+Mesa 🟢 (9f64ddc, c56b264); a metade Decisão/Continuidade segue pré-etapa: título imperativo "Confirme sua escolha", `PatientCard` com blur, 6 títulos repetidos inline (`connection-progress-panel.tsx:87-224`) |
| `/paciente/curadoria/imprimir` | documento | 🟡 | intocada; formato do relatório legado |
| `/paciente/documentos` | Sala (arquivo) | 🟡 | "acesso só seu e da nossa equipe" (`documentos/page.tsx:25`) |
| `/paciente/linha-do-tempo` | Acompanhamento | 🟡 | 4 ícones lucide como estado (incl. `Sparkles`, `linha-do-tempo/page.tsx:96-102`), rótulos de registro, vazio sem a família |
| `/paciente/perfil` | Recepção | 🟡 | única tela da área sem cabeçalho; formulário de sistema |
| `/portal-paciente` ×3 | — | 🔴 | mortas por 301 (`next.config.ts:35-36`); conteúdo já reabrigado — a desaparecer |

## Os fundos da casa

| Rota(s) | Papel | Класс | Evidência principal |
|---|---|---|---|
| `/coa/curadoria` (fila) | Curador | 🟡 | serifa e vazios calmos ✓; mas rodapé **"Ambiente de construção da experiência — dados de demonstração"** em superfície viva, caixa-alta no subtítulo (`portal-shell.tsx:67`) |
| `/coa/curadoria/casos/[id]` + `[etapa]` | Curador | 🟡 | denso legítimo; ~20 caixas-altas (conduction-panel, step-method-reference), badges de status |
| `/coa/curadoria/.../curadoria_tecnica` (Mesa do Curador) | Curador | 🟡 | núcleo exemplar (zero verde/vermelho, zero gradiente, estados por textura — `evidencia-chips.tsx:18`); resíduos: blur no topo (`mesa-curador.css:32-33`), 6 seletores caixa-alta, **bug**: `comparacao-premium.tsx:59-60,75` emite classes inexistentes no CSS (`mesa-celula--sem-dado`, `--neutro`, `mesa-comparacao`) |
| `/atendimento` + `[leadId]` | Atendente | 🟡 | idioma de jornada ✓; "Meus leads", "transformar contato em Assistido" — vocabulário de funil |
| `/acompanhamento` | Concierge | 🟡 | calmo, honesto ✓; mas **"Visível por vínculo anterior"** (`acompanhamento/page.tsx:76`) é RLS cru na tela, "o mais frio primeiro" (`:52`), rodapé de obra, shell montado na página |
| `/coa` (hub) | equipe | 🟡 | "Nível 1/2/3" em caixa-alta; sem shell |
| `/coa/atendimento` · `/coa/concierge` | pipeline | 🔴 | dashboards KPI que **duplicam** as superfícies de trabalho reais (fusão já mapeada na Narrativa §8); botão primário inline (`coa/atendimento:39`, `coa/concierge:77`) |
| `/admin` (painel) | Admin | 🟡 | paleta da casa ✓, números serifados ✓; mas **"SISTEMA OPERACIONAL"** sob o logo (`app-shell.tsx:172`), cartões de número grande (o "primeiro dashboard" da F2 §13.3), `text-error` como cor de **dado** (`admin/page.tsx:75,257`) |
| `/admin/casos` ×2 · `pacientes` ×3 · `profissionais` ×3 · `equipe` · `ace` ×2 | Admin | 🟡 | títulos `font-sans` (`page-header.tsx:33` — o inverso da casa), badges caixa-alta densos, tabelas técnicas (legítimas nos fundos) |
| `/admin/crm` ×8 | Admin/Concierge | 🟡 | funil com `border-error/40` + contador nu por coluna (`crm-funnel-board.tsx:118,127,134`); "Endpoint preparado em POST /api/crm/leads" (`configuracoes:31`) — linguagem de sistema crua |
| `/profissional` | Profissional | 🔴 | `EmptyState` "Ainda não há informações" renderizado **incondicionalmente** acima de conteúdo real (`dashboard-panel.tsx:19-22`) — vazio mentiroso; badges numéricos ("18 de 28 perguntas"); sem cabeçalho da casa |
| `/curador` ×3 | legado ACE | 🔴 | mortas por redirect (`next.config.ts:29-30`); idioma admin antigo |
| `/acesso-negado` | porta errada | 🔴 | HTML cru, zero CSS — a única superfície sem nenhum cuidado |

---

# 3 · Resíduos visuais — inventário com endereço

1. **Blur/vidro (F2 §3 proíbe):** `patient-dashboard.css:152-153` (PatientCard — contradiz o comentário da linha 360), `patient-shell.tsx:74,102`, `app-shell.tsx:196`, `portal-shell.tsx:48`, `public-header.tsx:33`, `mesa-curador.css:32-33`, + landing legada (`video-section.tsx` ×6, `v2/hero-experience:262`, `portal-experience:414`).
2. **Gradientes decorativos:** `patient-dashboard.css:165,170` (variantes do PatientCard), `:188` (`.patient-progress-fill` — **CSS morto**, zero usos em TSX), `:193`; `landing-editorial.css` ×7; landing legada ×12. (Cenas fotográficas/atmosfera: legítimas.)
3. **Animações autônomas:** `globals.css:151` (`slow-zoom` 18s), `:169` (`breathe`), `patient-dashboard.css:232` (`patient-breathe` no hero — a casa ainda respira sozinha); `ui/spinner.tsx:21` e `ui/skeleton.tsx:12` pulsantes coexistindo com o `.p-skeleton` estático da paciente.
4. **Caixa-alta:** transversal (§1) — primitivas da paciente, `ui/badge.tsx:19` (toda badge), shells, ~35 na área do Curador, ~12 no ACE, landing.
5. **Par verde/vermelho na mesma superfície:** `ui/toast.tsx:14-16`, `ui/alert.tsx:14-16`, `ui/form-message.tsx:10-12`, `ads/status-banner.tsx:15-18` — as quatro primitivas oferecem o semáforo completo (R2: o nome existir é o gesto existir). `text-error` como cor de dado: `admin/page.tsx:75,257`, `ace-executions-table:30-31`, `ace-execution-timeline:15` (warning pintado de erro), `crm-funnel-board:127`. Ícone `Check` **verde** no `autosave-indicator.tsx:24` — a única mancha de "sucesso" na Recepção.
6. **Ícones como estado:** `alert`/`status-banner` (mapeados por variante), `cases-table:123` (`AlertTriangle`), `journey-navigator:2` (5 ícones incl. `Lock`), `linha-do-tempo:96-102` (4 por categoria). Contraste: a Mesa do Curador usa glifos tipográficos com rótulo textual — o padrão certo dos fundos.
7. **Chips contáveis:** `patient-chip` **erradicado** ✓; restam `.mesa-chip` (fundos, com estados por textura de borda — aceitável) e badges numéricos empilhados (`mesa-evidencias-panel:157-163` — 7 na mesma linha).
8. **Linguagem de sistema nas superfícies dela:** **zero** em texto de tela ✓ (única ocorrência é comentário de código). Nos fundos: "Endpoint preparado em POST", "Fila de Leads", "Visível por vínculo anterior", rodapé "Ambiente de construção da experiência" (fila do Curador e Acompanhamento — vazamento de obra em produção).
9. **"Nossa equipe" remanescente (D-C1):** paciente — `documentos:25`; wizard — `informacoes:18`, `revisao:26,32,80`; landing viva — `editorial-sections:47`, `faq-compact:10`; landing legada — ×7.
10. **Duplicações:** 5 famílias de estado vazio (ui/, journey/, estados-vazios, mesa-vazios, PatientEmptyState + SemCuradoria); 3+1 famílias de card (Card, PatientCard, LandingCard, `.patient-carta`); 3 navs (nav-items.ts com `getDefaultNavItems` já `@deprecated`, patient-nav-items, PortalNavItem por prop); pastas `paciente/` (13+) × `patient/` (7) — divisão por idioma, não por camada (`patient/` importa de `paciente/`).
11. **Código morto:** `ui/tabs.tsx` (zero imports — o elemento banido já não tem uso), `.patient-progress-track/fill`, `legacy-surface-notice.tsx`, landing `portal-*`/`v2/*`/`golden-thread`/`faq-book`/`video-section`, `/curador` ×3, `/portal-paciente` ×3, `CuradoriaDecisionPanel` (órfão — mecanismo do "nenhum dos três", candidato v1.1).
12. **Bug funcional achado de passagem (não corrigido):** `comparacao-premium.tsx:59-60` emite `mesa-celula--sem-dado`/`--neutro`; o CSS só define `--nao`/`--insuficiente`/`--vazio` (`mesa-curador.css:518-539`) — células da Mesa do Curador sem o tratamento visual projetado.

---

# 4 · Auditoria por papel

**Paciente.** Entrada 🟡 (hero certo, moldura com resíduos) · Recepção/Contar 🟢 (com 2 telas 🟡 por "equipe") · Encontro/Sala 🟢 no corredor (PerfilPanel reabrigado) · Mesa 🟢 · **Sala da Decisão percebida 🟡** · **Continuidade 🟡** — é o trecho mais distante: painéis correto de conteúdo, mas forma de workflow (§5).

**Curador.** A Mesa dele é o melhor fundo da casa — estados por textura, zero semáforo, zero lucide-estado. Resíduos: caixa-alta sistemática, blur no topo sticky, rodapé de obra, bug de classes CSS, badges "X de Y". Dashboard legado `/curador`: morto, a remover.

**Concierge.** `/acompanhamento` já tem o tom (vazios que explicam); trai-se em três frases de sistema ("Visível por vínculo anterior", "o mais frio primeiro", rodapé de obra). `/coa/concierge` é dashboard duplicado 🔴. **Tentativas e notificações internas não têm superfície própria além da worklist** — o que existe é o dashboard; qualquer tela nova é decisão de produto (fora do visual).

**Atendente.** `/atendimento` no idioma da jornada ✓; vocabulário de funil ("leads", "Assistido") e `LeadWorkspace` denso — pertence à instituição, precisa só de língua e coerência.

**Administrador.** Paleta correta, números serifados, gráficos dentro da paleta — pertence à instituição. O que fala "sistema": o rótulo **"Sistema Operacional"**, títulos sans (`page-header.tsx:33` — regra invertida: serifa nos números, sans nos títulos), 7 botões primários reimplementados inline com strings divergentes (`crm/page:30`, `crm/contatos:26`, `coa/atendimento:39`, `coa/concierge:77`, `curador/page:31`, `lead-workspace:369`, `admin/page:165-168`), `text-error` julgando dados.

---

# 5 · Continuidade (§7 da missão) — o veredito

**Já parece continuidade do cuidado? Em conteúdo, sim; em forma, ainda é acompanhamento de workflow.** Evidências:

- `ConnectionProgressPanel` — 6 estados, cada um um card que substitui o outro, com o **mesmo título serifado colado 6 vezes inline** (`:87,103,118,156,193,224`): estrutura de máquina de estados exposta, não de varanda. Conteúdo/linguagem: já auditados e corretos (9B).
- `ContactModePanel` — o contrato em forma de tela ✓; únicas caixas-dentro-de-caixa da família (`:95`) — forma de formulário.
- `RelationshipStatusPanel` — espelho correto; dois tamanhos de corpo no mesmo componente (`:183` vs `text-sm`).
- `PatientNotificationsList` — **a peça mais desalinhada da casa da paciente**: `<ul>` com `divide-y` e tipografia de admin, sem serifa, sem família, botão-texto fora de `ui/button` (`profiles/patient-notifications-list.tsx:30-46`).
- Linha do tempo — medalhões lucide por categoria, datas longas, rótulos de registro: lê como log, não como memória de momentos.

**Só visual:** unificar os 6 estados sob uma varanda única (um título, estados como parágrafos que assentam), tirar blur do card, fundir notificações + linha do tempo na **Memória de Momentos** (linguagem de momento, âncora tipográfica em vez de ícone-estado), remover caixas-dentro-de-caixa, harmonizar corpos. **Exige domínio (fora do escopo, registrar):** qualquer superfície nova de tentativas/notificações para a paciente; "nenhum dos três"; a frase dela na decisão; as duas portas (dúvida/conversar) — não há canal implementado; qualquer promessa sobre o Concierge assumir.

---

# 6 · Sala da Decisão (§8) — auditoria sem implementar

- **Celebra?** Não ✓. **Pressiona?** Não ✓. **Declara prontidão?** Não (convite corrigido na Mesa) ✓.
- **Imperativo residual:** título "Confirme sua escolha" (`connection-choice-panel.tsx:116`) — a Linguagem §2 pede eco, não comando.
- **Reversibilidade:** a única frase enunciada é a verdadeira ("enquanto não iniciar o contato") ✓ — e só nasce na revisão, onde a pergunta nasce ✓.
- **Antecipação de fato:** nenhuma ("aviso ≠ visibilidade" respeitado) ✓.
- **Burocrático:** "Essa escolha será registrada" é registro honesto; a forma (card branco de formulário, sem o vazio de 70%, sem as quatro verdades reunidas) ainda não é o cômodo vazio — é a lacuna perceptiva da Onda 2.
- **Pós-confirmação:** silêncio ✓ (refresh assenta, zero parabéns).

---

# 7 · Componentes × árvore da Arquitetura

| Componente | Família correta | Estado | Destino |
|---|---|---|---|
| FaixaDoComum · Limiar · Correspondência (frase+textura) · CartaCaminho · Retrato · eco do Curador | Mesa/Casa | 🟢 nasceram na família certa | manter |
| JourneyWalk (+como-funciona) · ProfileCard/PerfilPanel (+prioridades) · wizard · AutosaveIndicator | Acompanhamento/Espelho/Pergunta | 🟢 | manter (autosave: tirar o Check verde — adaptar) |
| PatientCard | Cartão dela | blur + gradiente nas variantes | **adaptar** (pele de papel fosco, como a carta) |
| ConnectionChoice/Progress/ContactMode/Relationship | Escolha/Confirmação/Acompanhamento | conteúdo certo, forma de workflow | **adaptar** (Ondas 1-2) |
| PatientNotificationsList + linha do tempo inline | Memória de Momentos | duas gramáticas | **fundir** |
| 5 estados vazios | Estado Vazio único | duplicação declarada e violada | **fundir** |
| ui/tabs.tsx · .patient-progress-* · legacy-surface-notice · landing portal/v2 · CuradoriaDecisionPanel · /curador ×3 · /portal-paciente ×3 | — | mortos/órfãos | **eliminar/legado** (remoção física = engenharia) |
| ui/toast · ui/alert · ui/form-message · ads/status-banner | Confirmação/fala | oferecem o semáforo completo | **adaptar** (retirar `success` das superfícies dela; fundos mantêm o necessário) |
| ui/skeleton · ui/spinner | espera | pulsantes | **adaptar** (padrão `.p-skeleton`: forma + palavra) |
| Card (ui) · badges · tabelas · KpiCard · charts | fundos | legítimos nos fundos | manter (coerência na Onda 5) |
| mesa/* do Curador | fundos-Mesa | melhor fundo; bug de classes | **adaptar** (Onda 4) |
| paciente/ × patient/ | — | idiomas, não camadas | **fundir** (engenharia, Onda 6) |

**Vazamentos de ambiente detectados: nenhum novo** — a regra de fronteira (§6 da Arquitetura) está sendo respeitada nos quatro commits; o `ui/Card` dentro do `PerfilPanel` foi o último e já foi trocado (aea02c0).

---

# 8 · Evidências capturadas

Nesta auditoria (esperas por elemento, nunca `networkidle`; interface intocada): `audit-entrada` · `audit-paciente-home` (🟢) · `audit-paciente-linha` (🟡) · `audit-curador-fila` (🟡 — rodapé de obra visível) · `audit-concierge-acompanhamento` (🟡) · `audit-concierge-dashboard` (🔴) · `audit-atendente-fila` · `audit-admin-painel` (🟡 — "SISTEMA OPERACIONAL", KPIs) · `audit-admin-crm-funil` · `audit-acesso-negado` (🔴). Somam-se as capturas antes/depois das etapas Travessia, Recepção e Mesa (🟢).

---

# 9 · Mapa de implementação — as ondas

| Onda | Escopo | Telas/Componentes | Risco | Ganho perceptivo | Tamanho |
|---|---|---|---|---|---|
| **1 · Continuidade da paciente** | varanda única: Progress/ContactMode/Relationship como estados que assentam; Memória de Momentos (linha do tempo + notificações); pele do PatientCard sem blur | `/paciente/curadoria` (metade final), `/paciente/linha-do-tempo`, 4 painéis + notifications-list | baixo (textos já auditados pelo 9B — não tocar promessas) | alto — é o trecho onde ela mais volta | média |
| **2 · Sala da Decisão** | o cômodo vazio: 70% de vazio, título sem imperativo, quatro verdades reunidas, Mesa assentada atrás | bloco decisão de `/paciente/curadoria` (`ConnectionChoicePanel`) | baixo | alto | pequena |
| **3 · Concierge** | língua ("Visível por vínculo anterior" → frase humana; "o mais frio primeiro"), remover rodapé de obra, fundir percepção `/coa/concierge` → `/acompanhamento`, shell por layout | `/acompanhamento`, `/coa/concierge`, `/coa` | baixo/médio (fusão de rota = engenharia) | médio | média |
| **4 · Curador e Atendente** | caixa-alta da Mesa, blur do topo, **fix do bug de classes da comparacao-premium**, rodapé de obra, vocabulário de funil no atendimento | `/coa/curadoria` ×4, `/atendimento` ×2 | médio (superfície de trabalho ativa) | médio | grande |
| **5 · Administração e fundos** | "Sistema Operacional" → rótulo institucional; títulos com a regra serifa/sans correta; 7 botões inline → `ui/button`; `text-error` deixa de julgar dado; `/profissional` (vazio mentiroso, cabeçalho); `/acesso-negado` | `/admin` ×20, `/profissional`, `/acesso-negado`, hub `/coa` | médio | médio — pertencimento institucional | grande |
| **6 · Consolidação do Sistema Visual** | unificar tokens (3 paletas → 1 por material), erradicar blur/gradiente/pulso restantes, caixa-alta transversal, Estado Vazio único, famílias de card, skeleton/spinner com palavra, remoção dos mortos (tabs, progress-*, landing legada, /curador, /portal-paciente, pastas paciente×patient) | transversal | médio/alto (regressão ampla — exige suíte inteira) | alto — é o que fecha a "mesma casa" | grande |

Ordem sustentada pela evidência: a Continuidade é hoje o trecho mais desalinhado da jornada dela (a peça pior da casa é a lista de notificações), e a Decisão depende da varanda existir para o silêncio pós-ato ter destino.

---

# 10 · Bloqueios de escopo (registrar, não propor)

**Exige decisão de produto/domínio — fora do projeto visual:** "nenhum dos três" na superfície viva (mecanismo órfão em `CuradoriaDecisionPanel`; **candidata à v1.1, já registrada por ordem do Engenheiro Líder**) · a frase dela na decisão (`note` existe no domínio, sem superfície) · as duas portas dúvida/conversar (nenhum canal implementado; WhatsApp oficial é iniciado por ela) · superfícies de tentativas/notificações para a paciente · qualquer promessa sobre responsabilidade do Concierge · remoção física de rotas/pastas legadas · fusão de rotas `/coa/*` · renomeação `paciente/`×`patient/`.

**Pode ser corrigido por experiência visual:** todo o resto deste documento — texto, composição, hierarquia, ritmo, estilo, agrupamento, revelação, pele de componentes.

---

# 11 · Conclusão

1. **Verdes: 7.** 2. **Amarelas: 39.** 3. **Vermelhas: 10.**
4. **A experiência da paciente já parece uma casa única?** No miolo — do contar à Mesa — **sim**, e as capturas antes/depois provam a virada. Nos extremos, ainda não: a Entrada guarda moldura de marketing, e a Continuidade ainda é workflow com conteúdo certo.
5. **Os fundos pertencem à mesma instituição?** Pela paleta e pelos vazios que explicam, **sim**; pela voz, ainda não — "Sistema Operacional", "Endpoint preparado", "Visível por vínculo anterior" e um rodapé de obra dizem "software" onde a casa diria "instituição".
6. **Próxima implementação necessária:** **Onda 1 — Continuidade da paciente.**
7. **Continuidade deve ser a próxima etapa? Sim** — é o trecho de maior retorno dela com o maior desalinhamento restante, e destrava a Onda 2.
8. **Bloqueio de domínio que não deve entrar no projeto visual:** sim, os do §10 — nenhum deles impede as Ondas 1–6.

---

> **A casa existe. O que falta não é construir — é terminar de mudar a percepção dos cômodos que já funcionam, e ensinar os fundos a falar como a instituição que a fachada promete.**
