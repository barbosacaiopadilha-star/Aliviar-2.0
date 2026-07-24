# AliCIA — Métricas de Catálogo

**Versão:** 1.1  
**Status:** Canônico — inteligência operacional interna  
**Data de referência:** 23 de julho de 2026  
**Fonte de dados:** `catalog.seed.json` · `ES_COVERAGE_REPORT.md` · Ciclos Operacionais 001, 002 e Epic 08  
**Documento complementar:** [`OPERATIONAL_DASHBOARD.md`](./OPERATIONAL_DASHBOARD.md)

---

## Como ler este documento

Este arquivo é o **snapshot quantitativo** do catálogo AliCIA.  
Não altera Protocolo, Operação, produto ou código.  
Atualizar após cada ciclo operacional ou regeneração do seed (`npm run alicia:seed` + `npm run alicia:coverage`).

**Regra:** números aqui devem ser reproduzíveis a partir do seed e dos relatórios de ciclo. Se dois analistas divergirem, prevalece o seed versionado no repositório.

---

## 1. Snapshot geral

| Métrica | Valor atual |
|---------|-------------|
| Total de perfis publicados | **34** |
| Ortopedia | **17** |
| Neurocirurgia | **17** |
| Cidades com ≥ 1 perfil | **10** de 11 prioritárias |
| Instituições mapeadas | **36** |
| Média de fontes por perfil | **5,0** |
| Perfis Nível A (operacional) | **16** |
| Perfis Nível B (operacional) | **18** |
| Perfis com `lastUpdated` nos últimos 180 dias | **34** (100%) |
| Duplicidades detectadas | **0** |

### Definição operacional de Nível A / B

Classificação **interna**, alinhada aos Ciclos 001, 002, Epic 08 e ao Protocolo AliCIA 1.0 (Cap. 7). Não é exibida ao paciente.

| Nível | Critério resumido |
|-------|-------------------|
| **A** | Graduação e residência confirmadas (fontes 1–3 ou site oficial cruzado); RQE/TEOT documentado quando exigido; campos pendentes limitados a períodos e produção científica |
| **B** | Elegível e publicado, mas com ≥ 1 campo obrigatório de formação ou atuação ainda em verificação |

---

## 2. Métricas por especialidade

### Ortopedia (17 perfis)

| Métrica | Valor |
|---------|-------|
| Nível A | 10 (58,8%) |
| Nível B | 7 (41,2%) |
| Média de fontes | 4,76 |
| Com RQE ou TEOT | 17 (100%) |
| Com residência verificada | 10 (58,8%) |
| Com fonte institucional (nível 2–3) | 17 (100%) |
| Graduação pendente | 7 |

**Distribuição por cidade (cidade primária do perfil):**

| Cidade | Perfis |
|--------|--------|
| Vitória | 8 |
| Guarapari | 1 |
| Linhares | 1 |
| Colatina | 1 |
| Cachoeiro de Itapemirim | 1 |
| São Mateus | 1 |
| Aracruz | 1 |
| Vila Velha | 1 |
| Serra | 1 |
| Cariácica | 1 |

### Neurocirurgia (17 perfis)

| Métrica | Valor |
|---------|-------|
| Nível A | 6 (35,3%) |
| Nível B | 11 (64,7%) |
| Média de fontes | 5,24 |
| Com RQE documentado | 17 (100%) |
| Com residência verificada | 6 (35,3%) |
| Com fonte institucional (nível 2–3) | 17 (100%) |
| Graduação pendente | 11 |

**Distribuição por cidade (cidade primária do perfil):**

| Cidade | Perfis |
|--------|--------|
| Vitória | 6 |
| Serra | 3 |
| Guarapari | 1 |
| Linhares | 1 |
| Colatina | 1 |
| Cachoeiro de Itapemirim | 1 |
| São Mateus | 1 |
| Aracruz | 1 |
| Vila Velha | 1 |
| Cariácica | 1 |

---

## 3. Métricas por cidade (11 prioritárias)

Legenda de cobertura por célula **cidade × especialidade**:

- ✅ = ≥ 1 perfil publicado  
- ❌ = zero perfis  
- ⚠️ = apenas Nível B ou lacuna em uma das duas especialidades

| Cidade | Ortopedia | Neurocirurgia | Cobertura (2 especialidades) | Total perfis |
|--------|-----------|---------------|------------------------------|--------------|
| **Vitória** | ✅ 8 | ✅ 6 | **100%** | 14 |
| **Vila Velha** | ✅ 1 | ✅ 1 | **100%** | 2 |
| **Serra** | ✅ 1 | ✅ 3 | **100%** | 4 |
| **Cariácica** | ✅ 1 | ✅ 1 | **100%** | 2 |
| **Guarapari** | ✅ 1 | ✅ 1 | **100%** | 2 |
| **Linhares** | ✅ 1 | ✅ 1 | **100%** | 2 |
| **Colatina** | ✅ 1 | ✅ 1 | **100%** | 2 |
| **Cachoeiro de Itapemirim** | ✅ 1 | ✅ 1 | **100%** | 2 |
| **São Mateus** | ✅ 1 | ✅ 1 | **100%** | 2 |
| **Aracruz** | ✅ 1 | ✅ 1 | **100%** | 2 |
| **Viana** | ❌ | ❌ | **0%** | 0 |

**Cobertura agregada (11 cidades × 2 especialidades = 22 células):** 20 células preenchidas = **90,9%**

**Cobertura Grande Vitória (4 cidades × 2 especialidades = 8 células):** 8 células preenchidas = **100%**

---

## 4. Métricas de qualidade

### 4.1 Campos pendentes

| Tipo de pendência | Perfis afetados | % do catálogo |
|-------------------|-----------------|---------------|
| Qualquer campo em verificação | 34 | 100% |
| Graduação não confirmada | 18 | 52,9% |
| Residência não confirmada | 17 | 50,0% |
| Apenas períodos / produção científica | 16 | 47,1% |

### 4.2 Registro e especialidade

| Indicador | Valor | Observação |
|-----------|-------|------------|
| Perfis sem CRM nas fontes | 0 | Todos documentados |
| Perfis sem RQE/TEOT | 0 | 100% com registro de especialista |
| Perfis sem residência verificada | 17 | Inclui 10 novos perfis interior |
| Perfis sem fonte institucional | 0 | Todos possuem ≥ 1 fonte nível 2–3 ou equivalente |

### 4.3 Duplicidades

| Verificação | Resultado |
|-------------|-----------|
| IDs duplicados | 0 |
| CRM duplicado entre perfis | 0 |
| Homônimos não resolvidos | 0 no catálogo |

### 4.4 Perfis Nível B (18)

Inclui os 10 perfis metropolitanos anteriores mais 10 novos perfis do interior (Epic 08). Lista completa no [`EPIC_08_RELATORIO_OPERACIONAL.md`](./EPIC_08_RELATORIO_OPERACIONAL.md).

---

## 5. Métricas de fontes

| Faixa de fontes | Quantidade de perfis |
|----------------|----------------------|
| 4 fontes | 1 |
| 5 fontes | 31 |
| 6 fontes | 2 |

| Especialidade | Mínimo | Máximo | Média |
|---------------|--------|--------|-------|
| Ortopedia | 4 | 5 | 4,76 |
| Neurocirurgia | 5 | 6 | 5,24 |
| **Total** | 4 | 6 | **5,0** |

**Tipos de fonte mais frequentes:** Registro profissional (CRM) · RQE/TEOT · Instituição nível 2 · Sociedade médica nível 3 · Site oficial nível 5 · Registro público CNES/CliniGuia nível 4.

---

## 6. Instituições mapeadas (36)

Principais redes com múltiplos vínculos:

| Instituição | Perfis vinculados (primário ou secundário) |
|-------------|---------------------------------------------|
| Hospital Meridional | 11 |
| Instituto Capixaba de Ortopedia e Traumatologia (ICOT) | 7 |
| Hospital Metropolitano | 3 |
| Instituto Neurológico do Espírito Santo (INEST) | 2 |
| Instituto de Neurocirurgia | 2 |
| Hospital Estadual Central (HEC) | 2 |
| Hospital Bento Ferreira | 2 |
| Policlínica Endocenter | 2 |
| Hospital Doutor Roberto Arnizaut Silvares | 2 |
| Demais (27) | 1–2 cada |

---

## 7. Histórico de evolução (baseline)

| Data | Evento | Perfis | Ortopedia | Neurocirurgia | Média fontes |
|------|--------|--------|-----------|---------------|--------------|
| Pré-Ciclo 001 | Catálogo piloto | 10 | 5 | 5 | ~2,0 |
| Pós-Ciclo 001 | Grande Vitória Ortopedia | 15 | 10 | 5 | ~3,2 |
| Pós-Ciclo 002 | Grande Vitória Neurocirurgia | 21 | 10 | 11 | 4,33 |
| Pós-Epic 08 | Expansão interior ES | **34** | **17** | **17** | **5,0** |
| Pós-Ciclo 004 | Revisão neuro metro (pesquisa) | **34** | **17** | **17** | **5,0** |

**Ciclo 004 (23/07/2026):** Pesquisa de elevação B → A para `andre-faria-teixeira` e `paulo-melo-jacques`. **0 elevações** — graduação/residência não confirmáveis em fontes nível 1–3 (Lattes bloqueado por CAPTCHA; site médico e DOI insuficientes isoladamente). Catálogo público **não alterado**.

---

## 8. Lacunas documentadas (não inventar)

| Lacuna | Evidência | Prioridade derivada |
|--------|-----------|----------------------|
| **Viana** sem perfil | 0 perfis em ortopedia e neurocirurgia | Alta |
| Interior com 1 perfil por célula | Cobertura mínima, não profundidade | Média |
| 18 perfis com graduação pendente | Seed `graduation.verified = false` | Média |
| 17 perfis sem residência verificada | Seed `residency` vazio ou não confirmado | Média |
| 10 novos perfis Nível B | Epic 08 — formação a confirmar | Média |

---

## 9. Como atualizar

1. Executar ciclo operacional conforme `OPERACAO_ALICIA_1.0.md`
2. Regenerar seed: `npm run alicia:seed`
3. Regenerar cobertura: `npm run alicia:coverage`
4. Atualizar seções 1–8 deste documento com novos números
5. Atualizar [`OPERATIONAL_DASHBOARD.md`](./OPERATIONAL_DASHBOARD.md) — Capítulo 7 (executivo) e Capítulo 8 (roadmap)

---

*Última atualização: 23 de julho de 2026 — snapshot pós Ciclo 004 (pesquisa KPI-Q07, 0 elevações).*
