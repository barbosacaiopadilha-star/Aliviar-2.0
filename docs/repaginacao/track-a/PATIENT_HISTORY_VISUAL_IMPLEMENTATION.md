# A5 · Sua História — repaginação visual

**Base:** `8cd5f80` · **Objeto:** o conteúdo interno do wizard.
**Fora de escopo:** perguntas, ordem, validações, autosave, persistência,
retomada, server actions, RLS. A5 é visual.

---

## 1 · A auditoria começou pela captura, não pela suposição

O `StoryStepLayout` já era editorial antes desta missão: progresso por traços
finos (não stepper), "Passo X de Y" só para leitor de tela, título em serifa,
uma ação principal e "Voltar" como link discreto. A premissa de "formulário
SaaS" precisava ser verificada na tela — e a tela mostrou outra coisa.

### O defeito real: **dois cabeçalhos empilhados**

Desde a A2B, quando "Sua História" passou a vestir o `PatientShell`, a página
renderizava **duas molduras**:

| | |
|---|---|
| topo público | logotipo Aliviar + botão "Minha Jornada" |
| topo privado | logotipo Aliviar + navegação da casa + menu da conta |

Duas marcas, uma sobre a outra, e **duas navegações concorrentes** — a de cima
levando para fora da conversa, na tela em que a pessoa conta o que está
vivendo.

**O precedente já existia no próprio arquivo.** `PublicFooterGate` resolvia
exatamente isso para o rodapé, com a justificativa escrita: *"a campanha não
entra no quarto onde alguém se abre"*. O topo nunca recebeu o mesmo
tratamento, e a assimetria não tinha guarda nenhuma.

**Correção:** `PublicHeaderGate`, irmão simétrico do gate do rodapé. Nenhuma
rota muda, o layout continua único, o `<main>` fica no lugar.

---

## 2 · O campo narrativo

O `Textarea` da casa é primitivo compartilhado (Mesa, admin, portal): mexer
nele para melhorar a Recepção mudaria dezenas de telas. O tratamento vai por
cima dele, e só nas **três perguntas abertas** (`motivo`, `historia`,
`informacoes`).

| | antes | depois |
|---|---|---|
| superfície | `bg-surface` = **branco puro** flutuando sobre a arquitetura | papel quente (`--color-bg-canvas-warm`), opaco |
| borda | cinza de formulário | fio de dourado a 28% |
| altura | `min-h-44` / `min-h-36` | `min-h-56`, `lg:min-h-64` |
| corpo | 14px | 17px, entrelinha de leitura |

O campo opaco também é o que permite **manter a atmosfera atrás sem disputar a
leitura** — que é o que o §16 pede ("área de formulário em papel sólido").

---

## 3 · Preservado

Perguntas, ordem, `required`/opcional, validações, autosave, persistência,
retomada, revisão, conclusão, server actions, autenticação e RLS: **intocados**.
Progresso, títulos, hierarquia de ações e acessibilidade do `StoryStepLayout`
permanecem como estavam — eles já estavam certos.

**D-9:** nada aqui toca `meetingHeldAt`. Concluir "Sua História" continua sem
implicar Primeiro Encontro realizado.

---

## 4 · Guardas

`tests/components/a5-sua-historia-moldura.test.tsx` — 14:

- o topo público **não** renderiza em nenhum dos oito passos;
- a Landing e as demais rotas públicas **continuam** com ele;
- os dois gates decidem pela **mesma condição de rota** (a assimetria era o
  defeito — se divergirem de novo, aparece aqui);
- o gate está de fato **usado** pelo layout, não só declarado;
- as três perguntas abertas usam o mesmo tratamento de campo, e ele é papel
  quente sem material proibido.

---

## 5 · Mobile e overflow

`scrollWidth == clientWidth` em **390 / 430 / 768 / 1440**, em todos os passos
medidos, sem `overflow-x: hidden`.

A sonda foi corrigida duas vezes durante a missão, e as duas correções valem
como aprendizado:

1. **elementos recortados** (`sr-only`, `clip`) não empurram a página;
2. **`position: fixed`** sai do fluxo — o menu lateral do `PatientShell`,
   fechado, fica fora da tela à direita e era acusado como estouro em 390px
   **com o documento medindo 390/390**.

---

## 6 · Gaps registrados

- **Mensagem de autosave contraditória.** Na captura, o rodapé do campo diz
  ao mesmo tempo *"Sua última resposta ainda não foi salva — o texto está
  guardado neste dispositivo"* e *"Esta história já foi enviada e não pode
  mais ser editada"*. São dois avisos de origens diferentes colidindo. É
  **copy/semântica**, não repaginação, e a A5 não deveria decidir sozinha o
  que uma delas passa a dizer.
- **Os outros cinco passos** (`para-quem`, `preferencias`, `continuar`,
  `revisao`, capa) receberam a correção de moldura, mas não uma passagem de
  densidade campo a campo. O frame está resolvido; o interior de cada passo
  pode render mais.
- **Conclusão (EV-A5-006)** não capturada: a história da paciente sintética já
  está enviada, e reenviar exigiria fabricar estado.
