# Auditoria de Unificação da Experiência (MISSÃO 206)

**Estado**: auditoria executada; correções aplicadas; pendências registradas.

**O que esta missão fez**: nenhuma funcionalidade nova. Consolidação, consistência e acabamento — mais a verificação honesta do que está pronto para atendimento real e do que não está.

---

## 1. Rupturas encontradas e corrigidas

### R1 — A Jornada era inalcançável *(a mais grave)*

**Sintoma**: os dois convites "Acessar minha Jornada" da Landing 2.0 apontavam para `/login`, que leva ao `/paciente` antigo — autenticado, lendo o banco, com outra gramática visual.

**Por que é grave**: era exatamente a fronteira que a missão proíbe. Quem já é paciente saía da Landing 2.0 e caía em outro produto.

**Correção**: ambos apontam para `/portal-paciente`. Guardado por teste.

### R2 — Dois shells divergentes

**Sintoma**: `portal-curador/layout.tsx` e `portal-paciente/layout.tsx` desenhavam cabeçalhos próprios, escritos separadamente — um com navegação, outro sem; um com identidade de quem usa, outro não; estruturas de flex diferentes.

**Correção**: `PortalShell` único, com o que varia declarado por parâmetro (rótulo, navegação, identidade). A estrutura nunca varia.

**Guarda**: um teste falha se qualquer layout de Portal voltar a conter `<header`.

### R3 — Convite sem destino

**Sintoma**: a Jornada exibia "Ler meu Dossiê" como ação do paciente, mas a tela do Dossiê não existe (MISSÃO 204 não foi executada). Um convite que não abre nada é um fim abrupto.

**Correção**: enquanto a tela não existir, a etapa diz o que de fato vai acontecer — *"Helena vai apresentar as opções na conversa de vocês"* — e a ação passa a ser da equipe, não do paciente. Quando a tela existir, volta a ser dele.

---

## 2. Guardas contra regressão

`tests/unit/unificacao-experiencia.test.ts` — 6 testes que impedem a unificação de se desfazer:

| Guarda | O que impede |
|---|---|
| Nenhum layout de Portal desenha cabeçalho próprio | Ressurgimento de shells divergentes |
| O shell único declara origem no Método | Componente sem rastreabilidade |
| O convite à Jornada aponta para a Jornada | Voltar a jogar o paciente para fora |
| Todo link estático dos Portais existe | Beco sem saída |
| Nenhuma superfície do paciente usa vocabulário interno | Vazamento de `ACE`, `P00x`, `score`, `shortlist` |
| O número do WhatsApp tem fonte única | Literal duplicado divergindo |

---

## 3. Consistência verificada

| Item | Estado |
|---|---|
| Marca e tipografia nos dois Portais | Idênticas (`Aliviar` serif + qualificador em versalete) |
| Fundo, borda e espaçamento do cabeçalho | Idênticos (`#FFFFFF`, `#E4E0D8`, `max-w-content`) |
| Navegação | Mesma gramática; rola na horizontal no celular nos dois |
| Tokens | Nenhuma cor literal fora do Design System nas superfícies novas |
| `EvidenceCard` | Reutilizado por Curador e Paciente — a mesma evidência para os dois lados |

---

## 4. Acessibilidade

| Verificação | Resultado |
|---|---|
| Alvos de toque (WCAG 2.5.8) | Nenhum abaixo de 24px em 375px |
| Foco visível | Anel de 2px com offset em todo controle das superfícies novas |
| Semântica | `<nav aria-label>`, `<ol>` para a jornada, `<th scope>` na comparação |
| Informação só por cor | Nenhuma — todo estado tem rótulo textual |
| `prefers-reduced-motion` | Respeitado no Hero da Landing (fallback estático verificado) |
| Sem overflow horizontal | Verificado em 375px e 1265px |

---

## 5. Fluxos verificados no navegador

```
Landing → Acessar minha Jornada → Portal do Paciente → prioridades → como-funciona   ✔
Portal do Curador → caso → fase → Perfil de Prioridades → Mesa de Curadoria           ✔
Mesa: selecionar três → pareceres → encerrar                                          ✔
```

---

## 6. Checklist de preparação para produção

Honesto sobre o que **não** está pronto.

| Item | Estado |
|---|---|
| Suíte de testes | ✅ 794 passando |
| Typecheck | ✅ limpo nos arquivos do produto |
| Lint | ✅ limpo |
| Consistência visual entre Portais | ✅ shell único |
| Acessibilidade das superfícies novas | ✅ auditada |
| Responsividade 375px–1265px | ✅ sem overflow |
| **Persistência** | ❌ **nada é salvo** — Mesa, pareceres, Jornada e decisão vivem em memória do cliente |
| **Autenticação** | ❌ os dois Portais estão em `PUBLIC_PREFIXES` |
| **Schema de destino** | ❌ indefinido desde a MISSÃO 002 (`curadoria` vs `public` no banco unificado) |
| **Dossiê (MISSÃO 204)** | ❌ não construído |
| **Telas 4–7 do Paciente** | ❌ não construídas |
| **Rede de médicos em produção** | ❌ `professional_profiles` com 0 linhas |
| Lighthouse / Core Web Vitals | ❌ não medidos neste ambiente |

---

## 7. Pendências que impedem atendimento real

Em ordem de bloqueio:

1. **Persistência.** Sem banco, uma Curadoria real se perde ao recarregar a página. É o bloqueio absoluto.
2. **Rede de médicos vazia em produção.** Sem profissionais aprovados, a Mesa não tem sobre o que operar.
3. **Autenticação.** Hoje qualquer pessoa abre os dois Portais.
4. **Dossiê.** O produto principal da Aliviar, segundo a própria MISSÃO 204, não existe.
5. **Telas 6 e 7 do Paciente.** Registrar decisão e acompanhamento.

---

## 8. O que esta auditoria não cobriu

- **Lighthouse e Core Web Vitals**: exigem build de produção e ferramenta de medição indisponível aqui. O bundle não foi medido.
- **Tablet, dobráveis e ultrawide**: verifiquei 375px e 1265px. As faixas intermediárias e extremas não foram testadas.
- **Leitor de tela real**: verifiquei semântica e ARIA por inspeção do DOM, não com NVDA/VoiceOver.
- **Portal do Curador antigo (`/curador`) e Paciente antigo (`/paciente`)**: permanecem intocados e com a gramática visual anterior. Enquanto os dois pares coexistirem, a unificação vale para as superfícies novas — a antiga sai de cena na integração.
