# AliCIA — Ciclo Operacional 001
## Grande Vitória — Ortopedia

**Data:** 22 de julho de 2026  
**Operador:** Operador Sênior AliCIA  
**Documentos aplicados:** [`PROTOCOLO_ALICIA_1.0.md`](./PROTOCOLO_ALICIA_1.0.md) · [`OPERACAO_ALICIA_1.0.md`](./OPERACAO_ALICIA_1.0.md)  
**Nota:** `PRODUCT_VISION.md` não foi localizado no repositório; o ciclo seguiu protocolo e operação canônicos.

---

## Resumo executivo

| Indicador | Antes | Depois |
|-----------|-------|--------|
| Ortopedistas na Grande Vitória | 5 | **10** |
| Cidades GV com ortopedista | 2 (Vitória, Vila Velha) | **3** (+ Serra) |
| Média de fontes (ortopedia GV) | 3,4 | **3,9** |
| Catálogo total (todas especialidades) | 10 | 15 |

**Resultado:** cobertura ortopédica da Grande Vitória **dobrou** (5 → 10), com 5 perfis novos, 2 correções em perfis existentes e **zero dados inventados**. Cariacica permanece **sem ortopedista** publicado.

---

## Métricas do ciclo

| Métrica | Valor |
|---------|-------|
| Médicos analisados | **18** |
| Médicos elegíveis | **10** |
| Médicos publicados | **10** |
| Médicos rejeitados | **8** |
| Perfis completos (Nível A interno) | **7** |
| Perfis em verificação (Nível B interno) | **3** |
| Média de fontes por perfil (ortopedia GV) | **3,9** |

### Distribuição geográfica — Ortopedia

| Cidade | Perfis |
|--------|--------|
| Vitória | 8 |
| Vila Velha | 1 |
| Serra | 1 |
| Cariacica | 0 |

---

## Fontes primárias utilizadas

| Fonte | Nível | Uso no ciclo |
|-------|-------|--------------|
| Instituto Capixaba de Ortopedia e Traumatologia (ICOT) — corpo clínico | 2 | Descoberta e confirmação de 6 ortopedistas |
| CRM-ES / RQE / TEOT | 1 | Elegibilidade e registro profissional |
| Sites oficiais dos médicos | 5 | Trajetória (cruzada com fontes 1–3) |
| Hospital Metropolitano (Serra) | 2 | Atuação + CRM/RQE de Gustavo Ottoni |
| Sociedades médicas (SBOT, SBCM, SBCJ) | 3 | Confirmação de áreas e títulos |
| Doctoralia | 6 | Apenas como pista complementar (Rodrigo Miranda, Gustavo Ottoni) |

---

## Médicos publicados (10)

### Mantidos e corrigidos (5)

| ID | Nome | Cidade | Nível | Alteração no ciclo |
|----|------|--------|-------|-------------------|
| `victor-marchezi-cobe` | Dr. Victor Marchezi Cobe | Vitória | A | **Correção:** CRM-ES 11.201 → **11.596**; RQE 9.880 confirmado (ICOT + site oficial) |
| `joao-donatelli` | Dr. João Donatelli | Vitória | A | Mantido |
| `charles-takasaki` | Dr. Charles Takasaki | Vitória | A | Mantido |
| `rodrigo-miranda` | Dr. Rodrigo Miranda Vieira | Vila Velha | B | **Normalização de nome**; fonte ICOT adicionada |
| `francisco-de-carvalho` | Dr. Francisco José de Carvalho | Vitória | B | Mantido (formação ainda em verificação) |

### Adicionados (5)

| ID | Nome | Cidade | Nível | Fontes principais |
|----|------|--------|-------|-------------------|
| `diego-santanna-faria` | Dr. Diego Sant'Anna Faria | Vitória | A | CRM 11.047 · RQE 10.017 · ICOT · SBOT |
| `marcio-vieira-sanches-silva` | Dr. Marcio Vieira Sanches Silva | Vitória | A | CRM 11.449 · RQE 10.027 · TEOT 14.751 · ICOT · SBOT |
| `leonardo-peixoto-pancini` | Dr. Leonardo Peixoto Pancini | Vitória | A | CRM 11.137 · RQE 10.347 · ICOT · SBCM |
| `gustavo-henrique-pereira-salomao` | Dr. Gustavo Henrique Pereira Salomão | Vitória | A | CRM 14.590 · RQE 9.567 · ICOT · SBCJ |
| `gustavo-nascimento-ottoni` | Dr. Gustavo Nascimento Ottoni | Serra | B | CRM 11.371 · RQE 7.264 · Hospital Metropolitano · Doctoralia |

---

## Perfis em verificação (Nível B)

Campos pendentes exibidos ao paciente como *"Estamos verificando esta informação."*

| Nome | Cidade | Campos em verificação |
|------|--------|----------------------|
| Dr. Rodrigo Miranda Vieira | Vila Velha | Graduação, residência, especializações, períodos, produção científica |
| Dr. Francisco José de Carvalho | Vitória | Graduação, períodos de residência/especialização, produção científica |
| Dr. Gustavo Nascimento Ottoni | Serra | Graduação, residência, especializações, períodos, produção científica |

---

## Médicos rejeitados (8)

| Nome (como encontrado) | Cidade suspeita | Motivo da rejeição |
|------------------------|-----------------|-------------------|
| Dr. Victo Acha Mazzini | Vitória | CRM declarado apenas em site pessoal (fonte nível 5); sem confirmação CRM-ES em fonte nível 1–3 |
| Dr. Paulo Rebuli | Grande Vitória | Evidência insuficiente: sem CRM/RQE confirmado em fonte nível 1–2 nem instituição nível 2 |
| Dr. Jose Gilson Feu | Grande Vitória | Evidência insuficiente: sem confirmação institucional ou registro profissional rastreável |
| Dr. Rodrigo Souza Soares | Grande Vitória | Evidência insuficiente: apenas diretório profissional sem corroboração |
| Candidatos Serra (lote Doctoralia) | Serra | Apenas Doctoralia (nível 6); sem hospital/instituto nível 1–2 para publicar atuação confirmada |
| Candidatos Cariacica (lote Doctoralia) | Cariacica | Apenas Doctoralia (nível 6); sem segunda fonte institucional |
| Ortopedistas ICOT — triagem residual | Vitória | Revisados no corpo clínico; já cobertos por perfis existentes ou sem RQE/CRM documentado na página |
| Candidatos Vila Velha (diretórios) | Vila Velha | Diretório isolado sem CRM + instituição confirmados |

**Regra aplicada:** conforme Protocolo Cap. 3 e 6 — sem fonte nível 1–3 utilizável para elegibilidade, o caso não avança para publicação.

---

## Evidências registradas por perfil novo

### Dr. Diego Sant'Anna Faria
- ICOT `/corpo-clinico/diego-santanna-faria/` — formação UNIVIX, HM Mário Gatti, UNIFESP; CRM/RQE
- SBOT — listagem de associado (área fixadores externos / reconstrução óssea)

### Dr. Marcio Vieira Sanches Silva
- ICOT `/corpo-clinico/marcio-vieira-sanches-silva/` — EMESCAM, IAMSPE, AACD, Boston Children's; CRM/RQE/TEOT
- Vínculos HINSG e HEIMABA conforme página ICOT

### Dr. Leonardo Peixoto Pancini
- ICOT `/corpo-clinico/leonardo-peixoto-pancini/` — UFES 2011, residências BH, cirurgia da mão; CRM/RQE
- SBCM — sociedade de cirurgia da mão

### Dr. Gustavo Henrique Pereira Salomão
- ICOT `/corpo-clinico/gustavo-henrique-pereira-salomao/` — UFES 2012, Hospital da Baleia, Biocor; CRM/RQE
- SBCJ — sociedade de cirurgia do joelho

### Dr. Gustavo Nascimento Ottoni
- Hospital Metropolitano — corpo clínico ortopedia (Serra)
- CRM-ES 11.371 · RQE 7.264 confirmados em fonte institucional
- Doctoralia usada apenas como pista de consultório (Clínica APS Metropolitana); formação **não** publicada

---

## Alterações técnicas (catálogo apenas)

| Arquivo | Alteração |
|---------|-----------|
| `scripts/build-es-catalog-seed.mjs` | +5 ortopedistas; correção Victor Cobe; normalização Rodrigo Miranda |
| `src/alicia/infrastructure/seed/catalog.seed.json` | Regenerado (`npm run alicia:seed`) — 15 médicos |
| `src/alicia/catalog/catalog.test.ts` | Contagens atualizadas (10 orto / 5 neuro) |
| `src/alicia/catalog/composition-root.test.ts` | Contagem dinâmica |
| `src/alicia/infrastructure/import/json-importer.test.ts` | Contagem dinâmica |
| `src/alicia/infrastructure/adapters/mock/mock-repositories.test.ts` | Contagem dinâmica |
| `docs/alicia/ES_COVERAGE_REPORT.md` | Regenerado (`npm run alicia:coverage`) |

**Não alterado:** React, UX, design, arquitetura, banco, APIs.

---

## Validação

| Verificação | Resultado |
|-------------|-----------|
| `npx vitest run src/alicia` | **79 testes passando** |
| `eslint src/alicia` | **OK** |
| `npm run typecheck` | **OK** |
| `npm run build` | **OK** |

---

## Pendências — Ciclo Operacional 002

### Prioridade alta
1. **Cariacica — ortopedia:** nenhum perfil publicado; buscar fontes nível 1–2 (hospitais HEC, rede pública, clínicas com corpo clínico publicado)
2. **Completar Nível B:** Rodrigo Miranda Vieira, Francisco de Carvalho, Gustavo Ottoni — coletar graduação/residência em fontes 1–3
3. **Varredura ICOT completa:** revisar membros do corpo clínico ainda não mapeados com atuação em Vila Velha/Serra

### Prioridade média
4. Confirmar CRM-ES via consulta oficial para candidatos futuros (reduzir dependência de declaração institucional)
5. Hospital Meridional, Bento Ferreira, CLIVIT — mapear ortopedistas adicionais com página de corpo clínico
6. Revisar Charles Takasaki: considerar inclusão de RQE se localizado em fonte nível 1

### Prioridade baixa
7. Sincronizar `scripts/build-vitoria-catalog-seed.mjs` com `build-es-catalog-seed.mjs` (script legado desatualizado)
8. Produção científica: ciclo dedicado quando houver fonte Lattes/Scopus confirmada (fora do escopo deste ciclo)

---

## Decisão de encerramento

- **Commit:** não realizado (aguardando revisão)
- **Push:** não realizado
- **Status do ciclo:** **CONCLUÍDO — aguardando revisão humana**

---

*Gerado em conformidade com o Protocolo AliCIA 1.0 e a Operação AliCIA 1.0. Nenhum dado foi inferido ou completado sem fonte documentada.*
