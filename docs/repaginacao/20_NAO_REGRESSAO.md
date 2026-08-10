# 20 · Matriz de não-regressão

> **Nenhuma melhoria estética justifica quebrar o que funciona.** Vários itens
> desta lista foram **confirmados pela Rodada 2 como acertos** — e é exatamente
> por isso que estão aqui.

---

## 1. Domínio e segurança — intocáveis

| Item | Verificação |
|---|---|
| autenticação e autorização | login, logout, papéis |
| **RLS** | nenhuma policy alterada; nenhuma rota nova sem gate |
| autoria do Curador | `author_id` continua dele |
| `curator_judgments` append-only | versões preservadas |
| recusa de editar relatório emitido | **confirmada pela simulação G** |
| guardas da Curadoria 2.0 | G-2.3-*, G-2.4-*, C-01*, CD-1, R-1 |
| ausência de ranking/score | em todos os papéis |
| rastreabilidade e proveniência | evidência → juízo → parecer → relatório |

## 2. Fluxos que precisam continuar funcionando

História (preenchimento, **autosave**, envio) · upload de documentos · fila ·
Acolhimento · declaração de área · **eliminação com justificativa** · os nove
juízos · seleção dos três · pareceres · emissão · **entrega** · visão da paciente
após entrega · impressão/PDF · perfil · consentimentos.

## 3. Comportamentos que a Rodada 2 registrou como acertos

| Comportamento | Por que preservar |
|---|---|
| contexto sempre visível ao Curador | *"não foi preciso abrir outra guia nem memorizar nada"* |
| bloqueios **nominais** em português comum | dizem **o que** falta |
| *"aguarda você"* × *"depende de outra etapa"* | responsabilidade explícita |
| *"é sua, nunca do sistema"* | autoria |
| *"julgar com a incompletude visível é legítimo"* | **P-04** na interface |
| **silêncio** durante o avanço interno | deliberado — a paciente não vê cada juízo |
| a paciente **nunca** vê número, nota, score ou ranking | o Método sobrevive à operação |
| nenhuma etapa **bloqueia**; quem não pode diz **do que depende** | condução, não trava |

> **Esta seção é a mais importante do documento.** É a lista do que a
> repaginação existe para **não** estragar.

## 4. Público

SEO da Landing · rotas públicas e legais · analytics existentes · vídeo
institucional · deploy.

## 5. Regra de rota

**Nenhuma rota some sem redirect.** `patient/` → `paciente/` e a consolidação de
Atendimento (**D-10, D-14**) entram **por último** (§18) e **com redirect
permanente**.

## 6. Como se verifica

**Por bloco**, não no fim: cada PR roda a suíte existente **e** confere os itens
desta matriz que toca. **Bloco que quebre qualquer item é revertido, não
remendado.**
