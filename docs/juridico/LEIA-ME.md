# Documentos jurídicos — os cinco instrumentos

**Recebidos do advogado e guardados aqui em 31/08/2026.** Até esta data eles
existiam só em e-mail e na pasta de downloads — e documento jurídico que só
existe no e-mail some com o e-mail.

## O que tem aqui

| Arquivo | O que é | Destinatário |
|---|---|---|
| `1-contrato-de-prestacao-de-servicos.md` | O instrumento principal: objeto, preço, vigência, foro | Assistido |
| `2-anexo-i-lgpd-do-contratante.md` | Consentimento, incluindo o **destacado para dados sensíveis** | Assistido |
| `3-procuracao-particular.md` | Mandato para representação perante operadora/ANS | **Terceiro** (operadora, ouvidoria, ANS) |
| `4-termo-lgpd-do-medico.md` | Dados, imagem e currículo do profissional | Médico parceiro |
| `5-termo-de-idoneidade.md` | Veracidade dos dados declarados pelo médico | Médico parceiro |

`originais/` guarda os `.docx` **exatamente como o escritório enviou**. Os `.md`
são extração fiel do texto, produzida por `scripts/extrair-docx.mjs` — servem
para ler, comparar e, quando chegarem as respostas, publicar em
`legal_documents`.

**Se divergirem, o `.docx` é o original.** Regenerar o `.md`:

```
node scripts/extrair-docx.mjs "docs/juridico/originais/ARQUIVO.docx" "docs/juridico/N-nome.md"
```

## O estado deles

**Nenhum está publicado**, e nenhum pode ser antes das respostas do advogado —
todos têm campos em branco (`[RAZÃO SOCIAL]`, `R$ [XXX]`, `[prazo]`,
`[cidade/UF]`, `[XXX] meses`). O inventário do que falta está em
`PENDENCIAS_JURIDICAS_PARA_IMPLEMENTACAO_DOCUMENTAL.md`; a leitura técnica de
cada pendência, em `LEITURA_TECNICA_DAS_PENDENCIAS_JURIDICAS.md`.

**A Política de Privacidade e os Termos de Uso do site NÃO estão entre os
cinco** — eles regem a relação de serviço, não o uso do site. Ver o ponto `[9]`
do documento de pendências.

## O que a leitura dos originais confirmou e corrigiu

**Confirmou** cada citação de cláusula feita no documento de pendências: preço e
forma de pagamento em branco na 9.1, vigência na 10.1, foro na 15.1, o fecho com
"duas vias e 2 (duas) testemunhas", a cláusula 11.1 reconhecendo assinatura
eletrônica, e o prazo do mandato em branco na 4.1 da Procuração. Quem escreveu
as perguntas leu os documentos com eles na mão.

**Corrigiu uma leitura minha.** Eu tinha apontado a cláusula de foro como risco
de abusividade perante o CDC. O texto real já se protege: *"sem prejuízo das
regras protetivas eventualmente aplicáveis ao consumidor"*. O alarme foi
retirado — está registrado na seção 7 da leitura técnica.
