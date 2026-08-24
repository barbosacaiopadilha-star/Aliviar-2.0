"use client";

/**
 * OS DOCUMENTOS DO CASO — o Curador gera, manda no WhatsApp, ela devolve.
 *
 * @metodo Experience §2.5 — a entrega é sempre humana: o Curador manda a peça na conversa, nunca um sistema dispara anexo
 * @metodo Fundamentos §10 — a validação tem liturgia: o consentimento vai preenchido com o caso real, para ser assinado de posse dele
 *
 * Por que existe: a operação roda no WhatsApp do Curador, e ele não tinha
 * onde gerar as peças do caso — imprimia modelos em branco e preenchia nome
 * a nome. Decisão do Fundador (23/08): o papel do kit vai para a paciente
 * pelo WhatsApp, não por upload. Então o que falta no produto não é uma tela
 * de envio para ela — é uma tela de GERAÇÃO para ele: as peças já com o nome
 * dela, o nome de quem cuida do caso e a data, prontas para salvar em PDF
 * pelo próprio navegador (Ctrl+P → "Salvar como PDF") e mandar.
 *
 * Nenhuma dependência nova: é o mesmo caminho de impressão que a Curadoria
 * da paciente já usa. E nada aqui inventa dado — o que não veio do Caso
 * fica em branco, para ser preenchido à mão na conversa.
 */
export function DocumentosDoCaso({
  patientName,
  curatorName,
  abertoEm,
}: {
  patientName: string;
  curatorName: string;
  abertoEm: string;
}) {
  /* Fuso FIXO: sem ele, o servidor (UTC) e o navegador de quem imprime
     escrevem datas diferentes — e o React acusa hidratação inconsistente.
     A data do documento é a do Brasil, onde ele é assinado. */
  const FUSO = { timeZone: "America/Sao_Paulo" } as const;
  const hoje = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...FUSO,
  });
  const aberto = new Date(abertoEm).toLocaleDateString("pt-BR", FUSO);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-11 items-center rounded-md bg-brand-primary px-5 text-sm font-medium text-on-dark shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          Salvar em PDF
        </button>
        <p className="text-sm text-ink-muted">
          Na janela de impressão, escolha <strong>Salvar como PDF</strong> — depois é só enviar por
          WhatsApp.
        </p>
      </div>

      {/* PEÇA 1 · O consentimento que ela assina */}
      <article className="documento-do-caso">
        <header className="documento-cabecalho">
          <p className="documento-marca">Aliviar — Curadoria Médica Independente</p>
          <h2 className="documento-titulo">Consentimento e uso de informações</h2>
        </header>

        <dl className="documento-campos">
          <div>
            <dt>Paciente</dt>
            <dd>{patientName}</dd>
          </div>
          <div>
            <dt>Quem cuida do caso</dt>
            <dd>{curatorName}</dd>
          </div>
          <div>
            <dt>Caso aberto em</dt>
            <dd>{aberto}</dd>
          </div>
          <div>
            <dt>Documento gerado em</dt>
            <dd>{hoje}</dd>
          </div>
        </dl>

        <div className="documento-corpo">
          <p>
            Autorizo a Aliviar a registrar a minha história, as minhas prioridades e os documentos
            que eu entregar, para preparar a minha Curadoria — a análise de profissionais à luz do
            que eu declarei importar.
          </p>
          <p>
            Entendo que a Aliviar <strong>não</strong> dá diagnóstico, <strong>não</strong> escolhe
            por mim e <strong>não</strong> vende posição em ranking; que a decisão continua sendo
            minha; e que posso pedir a qualquer momento para ver, corrigir ou apagar o que está
            registrado sobre mim.
          </p>
          <p className="documento-nota">
            Este documento é assinado em papel e devolvido a quem cuida do seu caso. Nada aqui
            substitui a Política de Privacidade da Aliviar.
          </p>
        </div>

        <div className="documento-assinaturas">
          <div>
            <span className="documento-linha" />
            <p>{patientName}</p>
            <p className="documento-legenda">Assinatura da paciente · data</p>
          </div>
          <div>
            <span className="documento-linha" />
            <p>{curatorName}</p>
            <p className="documento-legenda">Quem recebeu · data</p>
          </div>
        </div>
      </article>

      {/* PEÇA 2 · A ficha que o Curador preenche na conversa */}
      <article className="documento-do-caso">
        <header className="documento-cabecalho">
          <p className="documento-marca">Aliviar — Curadoria Médica Independente</p>
          <h2 className="documento-titulo">Ficha da Paciente — Consulta Inicial</h2>
        </header>

        <dl className="documento-campos">
          <div>
            <dt>Paciente</dt>
            <dd>{patientName}</dd>
          </div>
          <div>
            <dt>Curador</dt>
            <dd>{curatorName}</dd>
          </div>
          <div>
            <dt>Data da conversa</dt>
            <dd className="documento-vazio">&nbsp;</dd>
          </div>
        </dl>

        <div className="documento-corpo">
          {/* Campos em branco de propósito: a conversa é escrita à mão,
              com as palavras dela — nunca pré-preenchida pelo sistema. */}
          {[
            "O que trouxe você até aqui",
            "O que já foi tentado",
            "O que mais importa para você nesta decisão",
            "Do que você não abre mão",
            "O que você prefere evitar",
            "Como você quer ser cuidada",
            "Perguntas que você quer fazer ao médico",
          ].map((campo) => (
            <section key={campo} className="documento-campo-aberto">
              <h3>{campo}</h3>
              <span className="documento-pauta" />
              <span className="documento-pauta" />
              <span className="documento-pauta" />
            </section>
          ))}
        </div>

        <div className="documento-assinaturas">
          <div>
            <span className="documento-linha" />
            <p>{patientName}</p>
            <p className="documento-legenda">
              Reconheço que este registro corresponde ao que eu disse · data
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
