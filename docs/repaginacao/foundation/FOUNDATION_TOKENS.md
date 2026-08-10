# Fundação · Tokens

> **O ponto de partida não era vazio.** A auditoria falava em "três dicionários"
> (D-13). Medindo, o quadro é melhor do que isso — e o defeito real é outro.

## As três camadas, e elas já existem

| Camada | Onde | Quem consome |
|---|---|---|
| **escala** `--scale-*` | `globals.css` | só a camada semântica |
| **semântica** `--color-*`, `--radius-*`, `--shadow-*`, `--duration-*`, `--ease-*` | `globals.css` | **a UI** |
| **atmosfera / sotaque** `--landing-*`, `--p-*`, `--mesa-*` | folhas por ambiente | o próprio ambiente |

**135 variáveis** em `globals.css`, 14 na Landing, 31 no paciente, 6 na Mesa.

## O que a medição desmentiu

**O motion já estava consolidado.** Os dicionários locais **derivam** do
canônico, não competem com ele:

```css
--p-motion-instant: var(--duration-instant);
--p-motion-interaction: var(--duration-fast);
--p-ease: var(--ease-standard);
--ease-natural: var(--ease-standard);
```

Valores genuinamente locais são três, e todos justificados: `--p-motion-ambient`
(14s, respiração de fundo), `--duration-walk` e `--ease-walk` (a travessia da
Landing). **Nada a consolidar aqui.**

## A divergência real

```css
--color-attention: var(--scale-argila);   /* #955530 — deriva da escala */
--color-warning:   #8a5a1f;               /* hex cru — não deriva de nada */
```

Dois marrons para a mesma ideia, e um deles **pula a camada de escala**. Em uso:
`--color-attention` 11×, `--color-warning` 7×.

**Não troquei o valor.** Trocar mudaria pixel em tela viva, e esta missão não
migra tela. O que a Fundação faz é **nomear a regra e travá-la**: `attention` é
o token de ato humano; `warning` fica marcado como divergência a resolver na
migração tela a tela, quando a mudança de cor puder ser vista e aceita.

## Gramática cromática de estado

Cinco papéis, certificados na Mesa (ESSENCIAL · E-2, Rodadas 1 e 2), **agora do
produto**: `estrutura` · `resolvido` · `atencao` · `impedimento` · `neutro`.

As classes `.mesa-estado--*` saíram de `mesa-curador.css` e entraram em
`globals.css`. Os tokens que elas consomem sempre foram globais; só as regras
estavam presas a uma superfície. O nome `mesa-` permanece por ora: renomear
classe é migração de tela, e teria custo sem ganho nesta missão.

**Verde é processual — nunca desfecho favorável. Vermelho é impedimento — nunca
divergência.**

## Congelado (§19)

escala · semântica de cor · raio · sombra · motion · foco · os cinco papéis.

Extensão exige registro; não se inventa cor, raio ou tempo dentro de uma trilha.
