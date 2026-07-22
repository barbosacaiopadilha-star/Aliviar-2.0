# AliCIA v1.0.0-beta — Release Notes

**Versão:** 1.0.0-beta  
**Data:** 22 de julho de 2026  
**Codinome:** Soft Launch  
**Tag Git:** `v1.0.0-beta`

---

## O que é a AliCIA

A AliCIA é uma referência pública sobre **formação e trajetória profissional** de cirurgiões no Espírito Santo.

Ela organiza informações verificáveis — com fontes citadas e incertezas visíveis — para que pacientes decidam com mais clareza. **Não recomenda médicos. Não ranqueia. Não avalia qualidade de atendimento.**

> A AliCIA informa. O paciente decide.

---

## O que esta versão contém

### Produto público (`/alicia`)

| Recurso | Descrição |
|---------|-----------|
| **Home** | Apresentação da proposta e acesso ao mapa e metodologia |
| **Mapa** | 34 médicos no Espírito Santo com busca, filtros e lista sincronizada |
| **Perfis** | Trajetória formativa, fontes, áreas de atuação e campos em verificação |
| **Metodologia** | Explicação pública de como a AliCIA verifica informações |
| **Estados vazios** | Página 404 para perfis inexistentes |

### Catálogo

| Métrica | Valor |
|---------|-------|
| Perfis publicados | **34** |
| Ortopedia | 17 |
| Neurocirurgia | 17 |
| Cidades com perfil | 10 de 11 prioritárias |
| Média de fontes por perfil | 5,0 |
| CRM documentado | 100% |
| RQE/TEOT documentado | 100% |

### AliCIA Studio (`/alicia/studio`) — interno

Workspace operacional MVP para acelerar triagem, coleta, verificação e revisão de candidatos. **Não vinculado ao produto público** — uso interno da equipe.

### Documentação canônica

- Protocolo AliCIA 1.0
- Operação AliCIA 1.0
- Autoridade AliCIA 1.0
- Moat AliCIA 1.0
- Fábrica AliCIA 1.0
- Métricas e cobertura do catálogo

---

## Escopo geográfico e clínico

| Dimensão | Escopo desta versão |
|----------|---------------------|
| **Estado** | Espírito Santo (ES) |
| **Especialidades** | Ortopedia · Neurocirurgia |
| **Cidades com perfil** | Vitória, Vila Velha, Serra, Cariacica, Guarapari, Linhares, Colatina, Cachoeiro de Itapemirim, São Mateus, Aracruz |
| **Cidade sem perfil** | Viana |

---

## Limitações conhecidas (beta)

### Produto

| # | Limitação | Severidade |
|---|-----------|------------|
| L1 | Copy da home diz "Piloto" — catálogo já cobre 10 cidades do estado | Cosmética |
| L2 | Viana aparece no filtro de cidades, mas não há perfis publicados | Esperada |
| L3 | URLs de fontes no perfil não são links clicáveis | Cosmética |
| L4 | 18/34 perfis têm campos de formação ainda em verificação ("Estamos verificando") | Conteúdo — por design |
| L5 | Sem login, favoritos, comparação ou IA | Fora de escopo |
| L6 | Sem agendamento ou transação comercial | Fora de escopo |

### Studio

| # | Limitação | Severidade |
|---|-----------|------------|
| S1 | Sem autenticação — acesso por URL direta | MVP |
| S2 | Persistência em `localStorage` — não sincroniza com catálogo público | MVP |
| S3 | Não publica automaticamente no catálogo ao marcar "Publicado" | MVP |

### Operação

| # | Limitação | Severidade |
|---|-----------|------------|
| O1 | KPIs de tempo por caso (TMP) ainda não instrumentados automaticamente | Planejado (Fábrica Onda 1) |
| O2 | Piloto real (PILOTO_REAL_001) ainda não executado | Próxima fase |

---

## Critérios de qualidade atendidos

| Verificação | Resultado |
|-------------|-----------|
| Build de produção | ✅ 65 rotas |
| Typecheck | ✅ |
| Lint | ✅ 0 erros |
| Testes AliCIA | ✅ 85/85 |
| Jornada pública completa | ✅ Home → Mapa → Perfil → Metodologia → Voltar |
| Catálogo estrutural | ✅ 34 perfis · 0 inconsistências CRM/RQE/cidade |
| Rotas HTTP públicas | ✅ 200 (válidas) · 404 (inexistente) |

---

## Como acessar

```bash
npm run build
npm run start
```

| Ambiente | URL |
|----------|-----|
| Produto público | `http://localhost:3000/alicia` |
| Studio (interno) | `http://localhost:3000/alicia/studio` |

---

## Próximos passos pós-beta

1. Executar PILOTO_REAL_001 com usuários reais
2. Instrumentar TMP operacional (Fábrica Onda 1)
3. Cobertura de Viana
4. Elevação de perfis Nível B → A
5. Autenticação do Studio em produção

---

*AliCIA v1.0.0-beta — Soft Launch · 22 de julho de 2026*
