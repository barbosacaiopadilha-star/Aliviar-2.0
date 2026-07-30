/**
 * Estados vazios da Mesa — orientam, nunca parecem erro.
 *
 * @metodo Experience §3 — o copiloto sinaliza a lacuna e nunca bloqueia o caminho sem explicar
 * @metodo Engine §5.5 — lacuna aparece como lacuna
 *
 * Por que existe: área de trabalho vazia é onde o Curador mais precisa saber
 * o que fazer, e é onde a maioria dos produtos entrega uma caixa cinza. Cada
 * estado diz o que está acontecendo, de que depende e qual é o próximo passo
 * concreto.
 *
 * O que nunca faz: usar cor ou ícone de erro para uma situação legítima —
 * uma Curadoria sem elegíveis é um resultado válido, não uma falha.
 */

export function MesaVazio({
  titulo,
  corpo,
  proximoPasso,
}: {
  titulo: string;
  corpo: string;
  proximoPasso?: string;
}) {
  return (
    <div className="mesa-vazio">
      <h3 className="font-serif text-lg font-medium text-ink">{titulo}</h3>
      <p className="mt-2 max-w-reading text-sm leading-relaxed text-ink-muted">{corpo}</p>
      {proximoPasso ? (
        <p className="mt-3 text-sm font-medium text-ink">{proximoPasso}</p>
      ) : null}
    </div>
  );
}

export function RedeVazia() {
  return (
    <MesaVazio
      titulo="Nenhum profissional alcança este Case."
      corpo="A Rede operacional mostra apenas quem está publicado, sem divergência crítica em aberto e compatível com o tipo deste Case. Uma Curadoria sem elegíveis é um resultado válido — não um erro da tela."
      proximoPasso="O caminho é ampliar a Rede: cadastro e verificação acontecem no Admin."
    />
  );
}

export function CompatibilidadeNaoIniciada({ motivo }: { motivo: string }) {
  return (
    <MesaVazio
      titulo="A compatibilidade ainda não tem o que mostrar."
      corpo={motivo}
      // M4: antes prometia "os dois resultados" — dois cruzamentos que o
      // Método vigente não tem. A leitura é uma só, por subcritério.
      proximoPasso="Assim que houver, a leitura aparece aqui, subcritério a subcritério."
    />
  );
}

export function RelatorioNaoGerado() {
  return (
    <MesaVazio
      titulo="O Relatório ainda não existe."
      corpo="Ele nasce dos três caminhos selecionados. Você pode escrevê-lo do zero ou gerar um rascunho assistido a partir do que já declarou — em ambos os casos, a versão final é sua."
      proximoPasso="Selecione os três caminhos para abrir o Relatório."
    />
  );
}

export function AvaliacaoSemElegiveis() {
  return (
    <MesaVazio
      titulo="Ainda não há quem avaliar."
      corpo="A avaliação técnica acontece sobre quem passou pela área de atuação e pelos filtros do Case."
      proximoPasso="Declare a compatibilidade de área na etapa Rede elegível."
    />
  );
}
