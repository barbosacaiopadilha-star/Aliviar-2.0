# Análise de Review Cases — Piloto ES

**Gerado em:** 2026-07-24T03:57:08.792Z

---

## Distribuição de decisões

| Decisão | Quantidade | % |
|---------|----------:|--:|
| HUMAN_REVIEW | 6 | 100% |
| AUTO_PUBLISH | 0 | 0% |
| REJECT | 0 | 0% |

---

## Candidatos em HUMAN_REVIEW

### Dr. Ricardo Almeida (Ortopedia, Vitória)

- Confiança discovery: 0.92
- Regras pendentes: FORM-001, FORM-002
- Cobertura evidência: 100%
- Conflitos: 1

### Dra. Fernanda Lopes (Neurocirurgia, Serra)

- Confiança discovery: 0.9
- Regras pendentes: ELIG-007, FORM-001, FORM-002
- Cobertura evidência: 100%
- Conflitos: 1

### Dr. Paulo Mendes (Ortopedia, Cariácica)

- Confiança discovery: 0.86
- Regras pendentes: FORM-001, FORM-002
- Cobertura evidência: 100%
- Conflitos: 1

### Dra. Camila Rocha (Ortopedia, Vila Velha)

- Confiança discovery: 0.84
- Regras pendentes: FORM-001, FORM-002
- Cobertura evidência: 100%
- Conflitos: 1

### Dr. Gustavo Neri (Neurocirurgia, Vitória)

- Confiança discovery: 0.79
- Regras pendentes: ELIG-007, FORM-001, FORM-002
- Cobertura evidência: 100%
- Conflitos: 1

### Dra. Helena Duarte (Ortopedia, Linhares)

- Confiança discovery: 0.77
- Regras pendentes: FORM-001, FORM-002
- Cobertura evidência: 100%
- Conflitos: 1

---

## Candidatos REJECT

_Nenhum candidato rejeitado nesta execução._

---

## Candidatos AUTO_PUBLISH

_Nenhum candidato com publicação automática nesta execução._

---

## Regras mais frequentes em revisão

1. FORM-001 — Graduação confirmada (Nível A) (6x)
1. FORM-002 — Residência confirmada (Nível A) (6x)
1. ELIG-007 — RQE ou título (neurocirurgia) (2x)

---

## Relatório executivo

### O piloto está pronto para usuários?

**NÃO**

O pipeline automatizado ainda não substitui a curadoria manual para go-live público.

### Bloqueadores reais

- Conector(es) com falha na execução: 1 — CRM real requer ALICIA_CFM_WS_CHAVE configurada
- CRM Estadual ES em modo degradado — chave CFM não configurada (ALICIA_CFM_WS_CHAVE)

### Pendências não bloqueantes

- Discovery automatizado retorna 6 candidatos únicos — volume limitado pelas fontes mock de discovery
- 6 candidatos em HUMAN_REVIEW vs 0 AUTO_PUBLISH — esperado no piloto (residência/RQE/Nível A)
- Catálogo curado com 34 perfis prontos para ingestão editorial; pipeline automatizado publicou 0
- 6 conflito(s) de evidência requerem curadoria

---

## Recomendação operacional

1. **Go-live editorial:** usar seed curado (34 perfis, 14 completos) via ingestão catalog-factory
2. **Go-live automatizado:** configurar CRM real + ampliar fontes de discovery além de mocks
3. **Review queue:** priorizar candidatos com confiança ≥0.8 e regras FORM-002 / PUB-003 pendentes

