"use client";

import { useEffect, useState } from "react";

import { CartaCaminho } from "@/components/paciente/caminhos/carta-caminho";
import { ComparacaoCaminhos } from "@/components/paciente/caminhos/comparacao-caminhos";
import { ComparacaoNaoIniciada } from "@/components/paciente/experiencia/estados-vazios";
import { FaixaDoComum } from "@/components/paciente/caminhos/faixa-do-comum";
import { Limiar } from "@/components/paciente/experiencia/limiar";
import type { PatientCuradoria } from "@/modules/curadoria/patient-curadoria";

/**
 * Os três caminhos — o ambiente inteiro, com memória.
 *
 * Guarda quais cartas a pessoa já abriu (localStorage, por Curadoria): quem
 * volta dias depois vê onde parou em vez de recomeçar do zero. É memória de
 * navegação, nunca de decisão — a escolha continua sendo um ato só, registrado
 * na Connection.
 *
 * Uma carta aberta por vez: duas abertas voltariam a ser comparação
 * simultânea, que é justamente o que a leitura sequencial evita.
 */
export function CaminhosPanel({ curadoria }: { curadoria: PatientCuradoria }) {
  const chaveMemoria = `aliviar:caminhos-conhecidos:${curadoria.curatedSelectionId}`;

  const [aberta, setAberta] = useState<string | null>(null);
  const [conhecidas, setConhecidas] = useState<string[]>([]);
  const [comparando, setComparando] = useState<string[]>([]);

  // A memória só é lida no cliente: o servidor não sabe (nem precisa saber)
  // o que esta pessoa já leu.
  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(chaveMemoria);
      if (guardado) setConhecidas(JSON.parse(guardado) as string[]);
    } catch {
      // Navegador sem storage disponível: a experiência funciona igual,
      // apenas sem lembrar entre visitas.
    }
  }, [chaveMemoria]);

  function abrir(id: string) {
    setAberta(id);
    setConhecidas((atual) => {
      if (atual.includes(id)) return atual;
      const proximo = [...atual, id];
      try {
        window.localStorage.setItem(chaveMemoria, JSON.stringify(proximo));
      } catch {
        // sem storage, sem memória — e sem erro na cara da pessoa
      }
      return proximo;
    });
  }

  function alternarComparacao(id: string) {
    setComparando((atual) =>
      atual.includes(id) ? atual.filter((entrada) => entrada !== id) : [...atual, id],
    );
  }

  const selecionadas = curadoria.options.filter((option) => comparando.includes(option.id));
  const todasConhecidas = curadoria.options.every((option) => conhecidas.includes(option.id));

  return (
    <section>
      {/* O eco da Sala Particular: prosa com ar, nenhuma moldura de painel.
          O que uma pessoa escreveu é serifa (R3); nada aqui é clicável. */}
      <div className="max-w-[40rem] space-y-4">
        <h2 className="font-serif text-2xl font-normal text-[var(--patient-ink)]">
          Seus três caminhos
        </h2>
        <p className="max-w-prose text-sm leading-relaxed text-[var(--color-ink-muted)]">
          Preparados para o seu caso. Os três são legítimos — a ordem é de apresentação, não de
          preferência.
        </p>
        {curadoria.compositionRationale ? (
          <p className="max-w-prose font-serif text-base leading-[1.65] text-[var(--patient-ink)]">
            {curadoria.compositionRationale}
          </p>
        ) : null}
      </div>

      <Limiar nome="A Mesa" />

      {/* O Terreno Comum abre a Mesa, sempre — antes de existir qualquer
          coluna, existe uma superfície inteira (O1). É ordem de apresentação,
          nunca de liberação: nada abaixo fica trancado. */}
      <FaixaDoComum curatorName={curadoria.curatorName} />

      <div className="patient-cartas mt-8">
        {curadoria.options.map((option) => (
          <CartaCaminho
            key={option.id}
            option={option}
            aberta={aberta === option.id}
            jaConhecida={conhecidas.includes(option.id)}
            onAbrir={() => abrir(option.id)}
            onFechar={() => setAberta(null)}
            selecionadaParaComparar={comparando.includes(option.id)}
            onAlternarComparacao={() => alternarComparacao(option.id)}
          />
        ))}
      </div>

      <div className="mt-8">
        {selecionadas.length >= 2 ? (
          <ComparacaoCaminhos options={selecionadas} />
        ) : (
          <ComparacaoNaoIniciada />
        )}
      </div>

      {/* A Conversa Consigo (A_MESA §3.4): um lugar, não uma ferramenta.
          Perguntas breves que nada exigem, espaço, releitura. Nada aqui
          coleta, armazena ou dispara coisa alguma. (A saída "nenhum dos
          três" pertence ao domínio e está registrada como candidata à v1.1 —
          nenhuma superfície nova nesta fase.) */}
      {todasConhecidas && !curadoria.decision ? (
        <div className="mt-16 max-w-prose space-y-4 lg:mt-24">
          <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">
            Daqui em diante o trabalho é seu, e ninguém o apressa. Se ajudar a pesar: do que você
            não abre mão? Com qual deles você se imaginou conversando?
          </p>
          <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">
            Reler qualquer carta, quantas vezes precisar, faz parte — comparar de novo também.
          </p>
        </div>
      ) : null}

      {/* A porta da Decisão só aparece depois que ela conheceu os três —
          convidar antes seria apressar. E o convite não declara suficiência:
          quem percebe que já viu o bastante é ela (A Mesa §7; Linguagem §6).
          Depois dele, o maior vazio da página: o espaço abaixo de uma escolha
          fica vazio, porque preencher ali é empurrar. */}
      {todasConhecidas && !curadoria.decision ? (
        <div className="mt-10 max-w-prose">
          <p className="font-serif text-base leading-[1.65] text-[var(--patient-ink)]">
            Não há pressa, e nenhum deles está pré-escolhido. Quando você quiser, a escolha está
            logo adiante — e voltar aqui continua possível a qualquer momento.
          </p>
        </div>
      ) : null}
    </section>
  );
}
