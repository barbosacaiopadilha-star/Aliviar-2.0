# Aliviar — Production Notes

**Versão:** 1.0  
**Status:** Canônico — referência de produção do palco  
**Escopo:** Landing / Limiar — ambiente onde o filme institucional vive  
**Autoridade:** Subordinado a `CREATIVE_DIRECTION_1.0.md`. Em conflito, a Constituição Criativa prevalece.

**Implementação de referência:** `src/components/experience/limiar/stage-tokens.ts` · `src/app/globals.css` (bloco `.limiar`)

---

## Princípio do palco

O filme é o protagonista. Todo o restante é cenário.

Antes de adicionar ou manter qualquer elemento, perguntar:

> *Se o filme desaparecesse agora, este elemento ainda faria sentido?*

Se a resposta for não, o elemento compete com o filme e deve ser removido.

O palco deve ser **invisível** — não interface, não demonstração técnica, não animação pela animação.

---

## Curva de animação oficial

| Token | Valor |
|-------|-------|
| `STAGE_EASE` | `cubic-bezier(0.22, 1, 0.36, 1)` |

Usar em todas as entradas, crossfades e revelações de voz. Não introduduzir curvas alternativas no limiar sem revisão deste documento.

---

## Tempos oficiais (ms)

| Fase | Token | Duração | Descrição |
|------|-------|---------|-----------|
| Chegada | `arrival` | **2800** | Fade-in do palco |
| Luz — delay | `lampDelay` | **1900** | Silêncio antes da lâmpada |
| Luz — entrada | `lampIn` | **2200** | A lâmpada aparece |
| Frase — delay | `lineDelay` | **4900** | Silêncio antes da primeira frase |
| Frase — revelação | `lineIn` | **1350** | *"A luz ficou acesa."* |
| Presença — início | `presenceBegin` | **7200** | Vazamento de luz lateral |
| Presença — chão delay | `presenceFloorDelay` | **7800** | Calor no piso |
| Presença — chão entrada | `presenceFloorIn` | **4500** | Fade do gradiente inferior |
| Gesto disponível | `gestureReady` | **11000** | Visitante pode tocar a luz |
| Filme — abertura | `filmOpening` | **1800** | Crossfade limiar → filme |
| Filme — assimilação | `filmAssimilation` | **4800** | Silêncio após o filme |
| Consolidação — delay | `consolidationDelay` | **600** | Pausa antes da linha final |
| Consolidação — revelação | `consolidationIn` | **1400** | *"Isso fica com você."* |

### Sequência emocional (inalterável)

```
Chegada → Luz → Frase → Presença → Gesto → Filme → Assimilação → Consolidação
```

Nenhuma fase é pulada. Nenhum conteúdo novo compete durante o filme.

---

## Durações de fade (CSS)

| Token CSS | Valor | Uso |
|-----------|-------|-----|
| `--stage-duration-arrival` | 2800ms | Entrada do palco |
| `--stage-duration-reveal` | 1350ms | Revelação de voz (frase e consolidação) |
| `--stage-duration-cross` | 1800ms | Crossfade para o filme; recuo do cenário |
| `--stage-duration-release` | 2200ms | Retorno do cenário após o filme |
| `--stage-duration-breathe` | 8s | Respiração única de luz (sala e lâmpada) |

---

## Regras de fade

### Entrada (threshold)

- O palco surge em fade único — sem movimento lateral, sem parallax.
- Lâmpada e frase entram em sequência, nunca em paralelo competitivo.

### Abertura do filme (opening → film)

- Limiar textual desaparece em `--stage-duration-cross`.
- Atmosfera recua para `--stage-opacity-atmosphere-film` — não desaparece; permanece como cenário.
- Filme emerge no mesmo `--paper` — sem moldura, sem card, sem player.

### Assimilação (film → assimilation → after)

- Filme dissolve em `--stage-duration-release` — mais lento que a abertura; respeito ao processamento.
- **Nenhum conteúdo novo** durante `filmAssimilation` (4800ms).
- Consolidação só após o silêncio.

### Proibido

- Autoplay de áudio sem gesto do visitante.
- Fade com curva diferente de `STAGE_EASE` no limiar.
- Elementos que reaparecem competindo com o filme durante a reprodução.

---

## Comportamento da luz

### Sala (`--stage-opacity-room-min` / `max`)

| Token | Valor |
|-------|-------|
| Mínimo | **0.24** |
| Máximo | **0.30** |

Uma única respiração lenta (`8s`). Sem deriva, sem segundo movimento, sem escala acima de `1.02`.

### Lâmpada (`--stage-opacity-lamp-min` / `max`)

| Token | Valor |
|-------|-------|
| Mínimo | **0.70** |
| Máximo | **0.92** |

Mesmo ciclo de respiração da sala (`8s`), defasado em 2400ms. Halo e núcleo compartilham o mesmo ritmo — não animações independentes.

### Durante o filme

| Token | Valor |
|-------|-------|
| `--stage-opacity-atmosphere-film` | **0.28** |

A luz recua; o filme domina. Presença lateral e piso **não** aparecem durante opening/film.

### Presença (antes do gesto)

| Elemento | Opacidade máxima |
|----------|------------------|
| Vazamento lateral | **0.18** |
| Calor no piso | **0.12** |

Entrada em fade estático — **sem deriva** após aparecer.

---

## Comportamento do silêncio

| Momento | Comportamento |
|---------|---------------|
| Antes da frase | Silêncio visual total — só luz |
| Após a frase | Presença entra sem texto |
| Antes do gesto | Casa habitada, sem pedir ação |
| Antes do filme | Visitante decide — Aliviar espera |
| Após o filme | 4800ms sem nenhuma linha nova |
| Após consolidação | Palco permanece aberto — sem CTA |

O silêncio é narrativa. Não preencher.

---

## Comportamento das pausas

1. **Pausa de chegada** (0–2800ms) — corpo desacelera antes de qualquer palavra.
2. **Pausa entre luz e frase** (~1900–4900ms) — o visitante vê antes de ler.
3. **Pausa entre frase e presença** (~6250–7200ms) — a frase assenta.
4. **Pausa antes do gesto** (7200–11000ms) — presença sem cobrança.
5. **Pausa de assimilação** (4800ms pós-filme) — obrigatória; não negociável.
6. **Pausa pré-consolidação** (600ms) — uma linha, não um bloco.

---

## Tipografia do palco

Classe única: `.limiar__voice`

| Propriedade | Valor |
|-------------|-------|
| Família | Fraunces (`var(--font-serif)`) |
| Tamanho | `clamp(1.1875rem, 3.8vw, 1.4375rem)` |
| Peso | 450 |
| Line-height | 1.65 |
| Cor | `var(--ink-soft)` |
| Deslocamento na entrada | `0.2rem` (`--stage-shift-reveal`) |

Frase inicial e consolidação usam a mesma voz tipográfica.

---

## Ritmo global

| Superfície | Ritmo |
|------------|-------|
| Palco (pré-filme) | Lento, contemplativo |
| Filme | Protagonista — cenário congelado |
| Pós-filme | Silêncio longo, depois uma linha |

---

## Reduced motion

Com `prefers-reduced-motion: reduce`:

- Todas as animações desligadas.
- Opacidades finais aplicadas imediatamente.
- Transições de fase desligadas.
- Ordem emocional e conteúdo **inalterados**.

---

## Checklist de revisão

- [ ] O filme é protagonista durante a reprodução?
- [ ] Nenhum CTA, card ou benefício compete na tela?
- [ ] Todos os tempos vêm de `stage-tokens.ts`?
- [ ] Todas as curvas usam `STAGE_EASE`?
- [ ] A assimilação pós-filme está respeitada?
- [ ] A transição pareceria respeitosa em um cinema?

---

*Este documento é a referência operacional da equipe para o palco. Alterações exigem alinhamento com `CREATIVE_DIRECTION_1.0.md`.*
