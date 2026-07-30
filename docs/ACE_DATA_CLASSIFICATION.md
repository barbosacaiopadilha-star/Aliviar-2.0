# ACE DATA CLASSIFICATION — Classificação de toda informação

**Estado**: Proposto (2026-07-25). Par de [`ACE_FOUNDATION.md`](ACE_FOUNDATION.md).

**Regra-mãe**: toda informação que entra no ACE recebe **uma** classe. Informação sem classe não entra. A classe determina o que pode ser feito com ela — como ela é exibida, quem a vê e se ela pode fundamentar uma observação.

---

## 1. As seis classes

| Classe | O que é | Origem possível | Verificável? | Pode fundamentar observação? |
|---|---|---|---|---|
| **F — Fato** | Aconteceu ou existe, objetivamente | Médico (declarado), Fonte pública verificada | Sim | ✅ Sim |
| **P — Preferência declarada** | O que a pessoa disse querer/precisar | Paciente, Médico | Não (é do declarante) | ✅ Sim, como fala |
| **I — Interpretação** | Leitura humana de um contexto | Curador | Não | ⚠️ Sim, **sempre nomeada e datada** |
| **O — Operacional** | Estado do processo | Sistema | Sim | ✅ Sim (viabilidade), nunca como afinidade |
| **V — Verificável não verificado** | Poderia ser fato, ainda não confirmado | Qualquer | Ainda não | ❌ Não — **é lacuna até confirmar** |
| **X — Proibido** | Nunca entra | — | — | ❌ Nunca |

## 2. Detalhamento por classe

### F — FATO
Existe independentemente de quem observa; a pessoa alvo pode confirmar ou corrigir.

**Exemplos**: formação e titulação · tempo de atuação · situação cadastral em conselho · idiomas declarados · endereço do consultório · convênios aceitos · disponibilidade de telemedicina.

**Obrigatório**: origem, data da declaração ou verificação, e — quando é do médico — direito de correção por ele.
**Exibição**: afirmativa direta ("Concluiu residência em [X], [ano]").
**Perde a classe** quando envelhece sem reconfirmação: vira **V**, não continua fato.

### P — PREFERÊNCIA DECLARADA
O que a pessoa disse. Não é verdade sobre o mundo; é verdade sobre o que ela expressou.

**Exemplos**: "preciso entender cada passo antes de decidir" · "não consigo me deslocar longe" · "quero resolver rápido" · "prefiro atendimento em português simples" · (do médico) "dedico a primeira consulta a explicar o plano".

**Obrigatório**: **a fala preservada** (Evidência de Curadoria), origem, data.
**Proibido**: resumir a fala em um rótulo. "Ela disse que precisa entender cada passo" ✅ · "Perfil detalhista" ❌ (vira X por P10).
**Exibição**: sempre citando quem disse.

### I — INTERPRETAÇÃO
Leitura de um humano sobre um contexto. Legítima e necessária — desde que jamais se disfarce de fato.

**Exemplos**: "O Curador [nome] observou, em [data], que a paciente reagiu bem quando o plano foi apresentado por escrito."

**Obrigatório**: autor nomeado, data, escopo de Case (não migra entre Cases — P11), formulada sobre **situação**, nunca sobre essência (P10).
**Exibição**: sempre com o autor no início da frase. Nunca "percebeu-se", nunca voz passiva sem sujeito.
**Revisão**: outro Curador pode registrar leitura diferente; **nada é apagado**, as duas coexistem com data.

### O — OPERACIONAL
Estado do processo, gerado pelo sistema a partir de fatos do Case.

**Exemplos**: fase atual do Case · responsável atual · há agendamento marcado · documento pendente · tempo desde a última interação.

**Obrigatório**: derivado de fato canônico, nunca editado à mão (o padrão da projeção do pipeline — determinística, documentada, com estado indeterminado explícito).
**Uso**: viabilidade e condução. **Nunca** como sinal de afinidade — "paciente demorou a responder" não é traço de pessoa.

### V — VERIFICÁVEL NÃO VERIFICADO
O candidato a fato que ainda não foi confirmado, ou o fato que envelheceu.

**Exemplos**: informação de cadastro antiga sem reconfirmação · dado importado sem origem clara · declaração de terceiro sobre o médico.

**Tratamento**: **é lacuna** (P9). Aparece ao Curador como "não confirmado — vale perguntar", nunca fundamenta observação de alinhamento nem de atenção.
**Caminho**: confirmar com a fonte → vira **F**. Não confirmar → permanece **V** e continua visível como lacuna.

### X — PROIBIDO
Lista fechada em [`ACE_BOUNDARIES.md`](ACE_BOUNDARIES.md) §1: atributos protegidos · proxies · inferência psicológica · reputação informal · redes sociais e marketing · avaliações agregadas · desfechos como métrica de qualidade · incentivos comerciais · dados de terceiros · não verificável/incontestável.

**Tratamento**: não entra, não é armazenado para o ACE, não é inferido. Se aparecer numa fonte, é descartado na entrada — e a tentativa é registrada para auditoria.

## 3. Regras de combinação

1. **Uma observação do ACE só nasce de F, P ou O** — nunca de V, nunca de X, nunca só de I.
2. **Toda observação mostra as duas pontas**: o que o paciente disse (P) × o que o médico declarou (F/P). Uma ponta só não é alinhamento — é ruído.
3. **I nunca é insumo de observação automática**; é contexto humano que acompanha, com autor.
4. **F + F não vira ranking.** Dois fatos comparáveis produzem descrição, jamais ordem de mérito.
5. **A classe mais restritiva vence** numa combinação. Se qualquer parte é X, o resultado é X. Se qualquer parte é V, o resultado é lacuna.
6. **Nada muda de classe sozinho.** F envelhecido → V exige regra explícita e datada; V → F exige confirmação com origem.

## 4. Ciclo de vida

```
entrada → classificação obrigatória → (X? descarta e registra)
        → uso conforme a classe
        → envelhecimento (F sem reconfirmação → V)
        → correção pelo titular a qualquer momento (P8)
        → encerramento do Case: I não migra; F e P permanecem com data
```

## 5. Matriz de visibilidade

| Classe | Paciente | Médico | Curador | Concierge | Admin |
|---|---|---|---|---|---|
| **F** sobre o médico | ✅ o relevante à decisão | ✅ o seu | ✅ | ✅ | ✅ |
| **P** do paciente | ✅ o dele | ❌ (só o necessário no encaminhamento) | ✅ | ✅ | ✅ |
| **P** do médico | ✅ o relevante | ✅ o seu | ✅ | ✅ | ✅ |
| **I** do Curador | ❌ | ❌ | ✅ | ✅ (o operacional) | ✅ |
| **O** | ✅ traduzido em linguagem de jornada | parcial | ✅ | ✅ | ✅ |
| **V** (lacuna) | ❌ | ✅ o próprio, para completar | ✅ | ✅ | ✅ |
| **X** | ❌ | ❌ | ❌ | ❌ | ❌ |

Justificativas em [`ACE_BOUNDARIES.md`](ACE_BOUNDARIES.md) §3.

## 6. Como isto vira verificação (para a implementação)

Seguindo o padrão que a plataforma já usa — invariantes por trigger, append-only por trigger, vocabulário testado:

1. **Classe obrigatória** na entrada — sem classe, rejeita
2. **Guard de vocabulário**: score, nota, ranking, percentual, estrela e adjetivo-sobre-pessoa quebram a suíte
3. **Observação sem justificativa legível** não passa no teste
4. **Observação com uma ponta só** não passa
5. **I sem autor ou sem data** não persiste
6. **I não migra entre Cases** — regra de escopo verificável
7. **Lista X** como teste automatizado sobre nomes de campo e conteúdo de entrada

Princípio que não pode ser verificado é intenção, não princípio (`ACE_PRINCIPLES.md`, fim).
