# 08 · Questionário — antes e depois do envio

> **O achado (P2):** *"`/sua-historia/revisao` mostra só 'Recebemos sua história'.
> O que ela escreveu não é relido, baixado nem impresso."*
>
> A paciente escreveu a coisa mais pessoal do produto — e depois **não tem
> acesso ao que escreveu**.

---

## 1. Dois momentos, duas necessidades

| Momento | Necessidade | Artefato |
|---|---|---|
| **antes do envio** | organizar com calma, consultar exames, conversar com a família | *"Questionário médico Aliviar"* — **em branco** |
| **depois do envio** | reler, guardar, levar à consulta | *"Minha história enviada"* — **preenchida** |

**São artefatos diferentes.** O primeiro é material de apoio; o segundo é
**registro do que ela declarou**. Não se resolvem com o mesmo arquivo.

## 2. Antes do envio

**Onde:** dentro de *Sua História*, discreto — *"Prefere organizar antes? Baixe o
questionário."*

**Regra:** o download é **apoio**, não caminho paralelo. **Não existe upload do
questionário preenchido** — quem preenche o formulário é ela, online. Aceitar um
PDF preenchido criaria uma segunda origem para o mesmo fato e violaria a
rastreabilidade.

**Conteúdo:** derivado das **mesmas perguntas** do fluxo online, **da mesma
fonte**. Duas fontes divergiriam na primeira mudança de pergunta.

## 3. Depois do envio

**Onde:** *Documentos → Questionários e formulários*, e um atalho na tela de
revisão — que hoje é um beco.

**A tela de revisão deixa de ser só uma confirmação:** passa a mostrar **o que
ela escreveu**, com **Baixar cópia**.

| Item | Regra |
|---|---|
| conteúdo | **exatamente o enviado** — nunca a interpretação do Curador |
| versão | se houver complemento, **cada envio é uma versão**, datada |
| identificação | nome, data e *"registro do que você nos contou"* |
| **não contém** | juízo, avaliação, nome de especialista, conclusão da Curadoria |

> **Este documento é dela sobre ela.** Nada do Método entra nele.

## 4. Classificação técnica (§25)

| Item | Nível |
|---|---|
| exibir a história enviada na revisão | **B** — reaproveita dado existente |
| baixar cópia (render + PDF) | **C** — exige rota de geração |
| questionário em branco para download | **C** — geração a partir da mesma fonte |
| versionamento por envio | **D/E** — ⚠️ **só se ainda não houver histórico** |

**Verificar antes de projetar:** se `patient_stories` / `patient_story_versions`
já versionam, o item 4 é **B**, não **E**. **Não desenhar migration por
suposição.**

## 5. Privacidade

Só a própria paciente e quem já tem autoridade sobre o Caso · nada em URL ·
sem indexação · **link de download expira** · **sem envio por e-mail** neste
contrato.

## 6. Decisão pendente

**[D-4 em 21](21_DECISOES_NECESSARIAS.md)** — o PDF é **cópia de conveniência**
ou **documento com valor de registro**? A resposta muda cabeçalho, rodapé,
identificação e retenção. **Provavelmente exige palavra do jurídico.**
