# 14 · Consolidação de duplicações

**Vinte e quatro duplicações**: D-1..D-15 (Rodada 1, estrutura) e D2-1..D2-9
(Rodada 2, só visíveis com conteúdo).

> **Nada sai sem prova de uso zero.** A Rodada 1 produziu essa prova para D-11 e
> D-12; os demais exigem varredura própria antes de qualquer remoção.

---

## 1. Estruturais — Rodada 1

| # | A × B | Tipo | Ação | Risco |
|---|---|---|---|---|
| **D-1** | quatro cascas | shell | **consolidar em três** (§03) | médio |
| **D-2** | `ui/` × `ads/` | primitivos | **`ui/` canônico**, `ads/` deprecado | médio |
| **D-3** | quatro cartões | componente | **um** com variantes | baixo |
| **D-4** | três cabeçalhos | componente | **um por shell** | baixo |
| **D-5** | três/quatro vazios | componente | **um** `EmptyState` | baixo |
| **D-6** | três abas, **oficial órfã** | componente | **adotar a oficial** | baixo |
| **D-7** | quatro sobreposições | componente | **um** `Dialog` + **um** `Drawer` | médio |
| **D-8** | dois botões | componente | **um** | médio |
| **D-9** | três carregamentos | componente | **um** | baixo |
| **D-10** | `paciente/` × `patient/` | rota/pasta | **`paciente/` canônico** | **alto** — mexe em rota |
| **D-11** | **três landings mortas** | tela | **remover** — uso zero provado | **baixo** |
| **D-12** | **22 órfãos** | componente | **remover** — uso zero provado | **baixo** |
| **D-13** | três dicionários de token | token | **um** (§12) | médio |
| **D-14** | duas rotas de Atendimento | rota | **consolidar** | médio |
| **D-15** | dois menus + rodapé duplicando nav | navegação | **um menu**; rodapé sem nav | baixo |

## 2. Com conteúdo — Rodada 2

| # | Duplicação | Ação | Onde |
|---|---|---|---|
| **D2-1** | a jornada existe **duas vezes** | **consolidar** | §04.2 |
| **D2-2** | status da Curadoria dito em **três lugares** | **uma fonte** | §13 |
| **D2-3** | dois caminhos para o mesmo relatório (Curador) | **consolidar** | §10 |
| **D2-4** | justificativa do conjunto **duas vezes na mesma tela** | **remover a segunda** | §05.3 |
| **D2-5** | juízo e parecer pedem a mesma leitura | **oferecer, nunca duplicar** | §05.3 |
| **D2-6** | informação da paciente repetida ao Curador | **consolidar no contexto lateral** | §05 |
| **D2-7** | duas contagens do mesmo universo | **uma** | §11 V-C2 |
| **D2-8** | estado do Relatório divergente | **uma fonte** | §13 |
| **D2-9** | pendências que existem de um lado só | **não é duplicação: é ausência** | §06 H-2 |

> **D2-9 está classificada errada no nome.** Não é duplicação — é a pendência
> existir só para o Curador. **Tratada como lacuna de handoff.**

## 3. Ordem segura

**1.** remover o que tem uso zero provado (**D-11, D-12**) — ganho imediato, risco
mínimo, e **limpa o campo** para o resto.
**2.** unificar tokens (**D-13**).
**3.** unificar primitivos (**D-3, D-5, D-8, D-9, D-7, D-6, D-4**).
**4.** unificar shells (**D-1, D-15**).
**5.** rotas (**D-10, D-14**) — **por último**, com redirects.

## 4. Preservar

Divergência **funcional** entre shells (densidade, navegação) · vocabulário
próprio do Método na Mesa · a rota de impressão como **destino de download**
(§10) · **tudo que a Rodada 2 registrou como acerto**.
