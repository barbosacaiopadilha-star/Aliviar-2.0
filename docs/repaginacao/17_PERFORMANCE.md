# 17 · Performance

> **Não otimizar por hipótese.** Este documento define **medições** e **limites**,
> não palpites.

---

## 1. O risco medido

| Fato | Valor |
|---|---|
| **vídeo institucional** | **5,0 MB** (`video-institucional-aliviar.webm`) |
| cenas arquitetônicas | 2 (`recepcao-bright.jpg`, `grand-finale.jpg`) |
| landing viva | 6 componentes |
| **código morto** | **~20 arquivos** (3 landings + 22 órfãos) |

**O vídeo é o único risco de peso confirmado por medição.** O resto é hipótese
até medir.

## 2. Regras

| Recurso | Regra |
|---|---|
| **vídeo** | `preload="none"` · **poster obrigatório** · carrega **ao clique** · **nunca autoplay** · **nunca é o LCP** |
| **imagens** | `next/image`, AVIF/WebP, `sizes` correto, `lazy` fora da primeira dobra |
| **fontes** | manter o conjunto atual; **acrescentar peso exige justificativa** |
| **client components** | só onde há interação; **arquitetura de servidor preservada** |
| **CLS** | `aspect-ratio` reservado para vídeo e imagem **antes** de carregar |
| **fundo em interface operacional** | **não existe** (§12) — economia estrutural |

## 3. Medições

**Antes e depois de cada bloco**, na mesma máquina, em produção local:

| Métrica | Onde | Limite |
|---|---|---|
| **LCP** | Landing, Início, Minha Curadoria | **não piorar**; alvo ≤ 2,5s em 4G simulado |
| **CLS** | as mesmas | **≤ 0,1** |
| **peso da rota** | todas as tocadas | **não crescer** sem justificativa |
| **JS do cliente** | por rota | **não crescer** — a consolidação deve **reduzir** |
| **imagens transferidas** | Landing | medir antes/depois |

> **Critério honesto:** a repaginação **não pode piorar** nenhuma métrica. Onde
> houver ganho — remover ~20 arquivos mortos, unificar primitivos —, **medir e
> registrar**.

## 4. O que provavelmente melhora sozinho

Remover as três landings mortas e os 22 órfãos (**D-11, D-12**) reduz superfície
de build. **Não prometo número: mando medir.**

## 5. Fora deste contrato

CDN, cache de borda, otimização de banco, orçamento de performance em CI.
**Recomendados, registrados, não incluídos.**
