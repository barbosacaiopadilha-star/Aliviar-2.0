import { err, ok, type Result } from "@/domain/shared/result";
import type { DomainError } from "@/domain/shared/errors/domain-error";
import {
  EtapaInvalidaError,
  EtapaForaDeSequenciaError,
  EtapaObrigatoriaNaoConcluidaError,
  JornadaBloqueadaError,
  JornadaJaConcluidaError,
  ReidratacaoInvalidaError,
} from "./errors/jornada-errors";
import {
  criarEtapaBloqueada,
  criarEtapaConcluida,
  criarEtapaRetomada,
  criarJornadaConcluida,
  criarJornadaIniciada,
  type JornadaDomainEvent,
} from "./events";
import {
  indiceDaEtapa,
  proximaEtapaOficial,
  SEQUENCIA_OFICIAL_ETAPAS,
  todasEtapasAnterioresConcluidas,
} from "./sequencia-etapas";
import type { EventoExternoJornada } from "./contracts/eventos-externos";
import { BloqueioDaJornada } from "./value-objects/bloqueio-da-jornada";
import {
  EtapaDaJornada,
  type EtapaDaJornadaCodigo,
} from "./value-objects/etapa-da-jornada";
import { EstadoDaEtapa } from "./value-objects/estado-da-etapa";
import { MarcoDaJornada } from "./value-objects/marco-da-jornada";
import {
  ResponsavelDaJornada,
  type ResponsavelDaJornadaCodigo,
} from "./value-objects/responsavel-da-jornada";

export interface JornadaDoPacienteSnapshot {
  id: string;
  pacienteId: string;
  etapaAtual: EtapaDaJornadaCodigo;
  etapasConcluidas: EtapaDaJornadaCodigo[];
  bloqueios: Array<{
    id: string;
    etapa: EtapaDaJornadaCodigo;
    motivo: string;
    criadoEm: string;
    ativo: boolean;
  }>;
  historico: Array<{
    id: string;
    tipo: "JORNADA_INICIADA" | "ETAPA_CONCLUIDA" | "ETAPA_BLOQUEADA" | "ETAPA_RETOMADA" | "EVENTO_EXTERNO_REGISTRADO" | "JORNADA_CONCLUIDA";
    etapa: EtapaDaJornadaCodigo | null;
    descricao: string;
    ocorridoEm: string;
    metadados?: Record<string, string>;
  }>;
  responsavelAtual: ResponsavelDaJornadaCodigo;
  iniciadaEm: string;
  atualizadaEm: string;
  concluidaEm: string | null;
}

export interface IniciarJornadaParams {
  id: string;
  pacienteId: string;
  iniciadaEm: string;
  marcoId: string;
}

export class JornadaDoPaciente {
  private readonly _eventos: JornadaDomainEvent[] = [];

  private constructor(
    readonly id: string,
    readonly pacienteId: string,
    private _etapaAtual: EtapaDaJornada,
    private _etapasConcluidas: EtapaDaJornada[],
    private _bloqueios: BloqueioDaJornada[],
    private _historico: MarcoDaJornada[],
    private _responsavelAtual: ResponsavelDaJornada,
    readonly iniciadaEm: string,
    private _atualizadaEm: string,
    private _concluidaEm: string | null,
  ) {}

  static iniciar(params: IniciarJornadaParams): JornadaDoPaciente {
    const etapaInicial = EtapaDaJornada.primeiraDuvida();
    const responsavelInicial = ResponsavelDaJornada.equipeAliviar();

    const marco = MarcoDaJornada.registrar({
      id: params.marcoId,
      tipo: "JORNADA_INICIADA",
      etapa: etapaInicial,
      descricao: "Jornada do paciente iniciada.",
      ocorridoEm: params.iniciadaEm,
    });

    const jornada = new JornadaDoPaciente(
      params.id,
      params.pacienteId,
      etapaInicial,
      [],
      [],
      [marco],
      responsavelInicial,
      params.iniciadaEm,
      params.iniciadaEm,
      null,
    );

    jornada.registrarEvento(
      criarJornadaIniciada({
        aggregateId: params.id,
        pacienteId: params.pacienteId,
        etapaInicial: etapaInicial.codigo,
        responsavelInicial: responsavelInicial.codigo,
        occurredAt: params.iniciadaEm,
      }),
    );

    return jornada;
  }

  static reidratar(snapshot: JornadaDoPacienteSnapshot): Result<JornadaDoPaciente, DomainError> {
    try {
      const etapaAtual = EtapaDaJornada.fromCodigo(snapshot.etapaAtual);
      const etapasConcluidas = snapshot.etapasConcluidas.map((codigo) =>
        EtapaDaJornada.fromCodigo(codigo),
      );
      const bloqueios = snapshot.bloqueios.map((item) =>
        BloqueioDaJornada.reidratar({
          id: item.id,
          etapa: EtapaDaJornada.fromCodigo(item.etapa),
          motivo: item.motivo,
          criadoEm: item.criadoEm,
          ativo: item.ativo,
        }),
      );
      const historico = snapshot.historico.map((item) =>
        MarcoDaJornada.reidratar({
          id: item.id,
          tipo: item.tipo,
          etapa: item.etapa ? EtapaDaJornada.fromCodigo(item.etapa) : null,
          descricao: item.descricao,
          ocorridoEm: item.ocorridoEm,
          metadados: item.metadados,
        }),
      );

      const jornada = new JornadaDoPaciente(
        snapshot.id,
        snapshot.pacienteId,
        etapaAtual,
        etapasConcluidas,
        bloqueios,
        historico,
        ResponsavelDaJornada.fromCodigo(snapshot.responsavelAtual),
        snapshot.iniciadaEm,
        snapshot.atualizadaEm,
        snapshot.concluidaEm,
      );

      const validacao = jornada.validarInvariantes();
      if (!validacao.ok) {
        return validacao;
      }

      return ok(jornada);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Snapshot inválido.";
      return err(new ReidratacaoInvalidaError(message));
    }
  }

  get etapaAtual(): EtapaDaJornada {
    return this._etapaAtual;
  }

  get etapasConcluidas(): readonly EtapaDaJornada[] {
    return [...this._etapasConcluidas];
  }

  get proximaEtapa(): EtapaDaJornada | null {
    if (this.estaConcluida()) {
      return null;
    }
    return proximaEtapaOficial(this._etapaAtual);
  }

  get responsavelAtual(): ResponsavelDaJornada {
    return this._responsavelAtual;
  }

  get bloqueios(): readonly BloqueioDaJornada[] {
    return [...this._bloqueios];
  }

  get bloqueioAtivo(): BloqueioDaJornada | null {
    return this._bloqueios.find((bloqueio) => bloqueio.ativo) ?? null;
  }

  get historico(): readonly MarcoDaJornada[] {
    return [...this._historico];
  }

  get eventos(): readonly JornadaDomainEvent[] {
    return [...this._eventos];
  }

  get atualizadaEm(): string {
    return this._atualizadaEm;
  }

  get concluidaEm(): string | null {
    return this._concluidaEm;
  }

  estadoDaEtapaAtual(): EstadoDaEtapa {
    if (this.estaConcluida()) {
      return EstadoDaEtapa.concluida();
    }
    if (this.bloqueioAtivo?.etapa.equals(this._etapaAtual)) {
      return EstadoDaEtapa.bloqueada();
    }
    return EstadoDaEtapa.emAndamento();
  }

  estaConcluida(): boolean {
    return this._concluidaEm !== null;
  }

  atribuirResponsavel(
    responsavel: ResponsavelDaJornada,
    ocorridoEm: string,
  ): Result<JornadaDoPaciente, DomainError> {
    const bloqueio = this.garantirPodeMutar();
    if (!bloqueio.ok) {
      return bloqueio;
    }

    this._responsavelAtual = responsavel;
    this._atualizadaEm = ocorridoEm;
    return ok(this);
  }

  concluirEtapaAtual(params: {
    marcoId: string;
    ocorridoEm: string;
  }): Result<JornadaDoPaciente, DomainError> {
    const bloqueio = this.garantirPodeMutar();
    if (!bloqueio.ok) {
      return bloqueio;
    }

    if (this.bloqueioAtivo) {
      return err(
        new JornadaBloqueadaError(
          `A etapa ${this._etapaAtual.codigo} está bloqueada e não pode ser concluída.`,
        ),
      );
    }

    const etapaAtual = this._etapaAtual;
    const proxima = proximaEtapaOficial(etapaAtual);

    this._etapasConcluidas = [...this._etapasConcluidas, etapaAtual];
    this._etapaAtual = proxima ?? etapaAtual;
    this._atualizadaEm = params.ocorridoEm;

    this.adicionarMarco({
      id: params.marcoId,
      tipo: "ETAPA_CONCLUIDA",
      etapa: etapaAtual,
      descricao: `Etapa ${etapaAtual.codigo} concluída.`,
      ocorridoEm: params.ocorridoEm,
    });

    this.registrarEvento(
      criarEtapaConcluida({
        aggregateId: this.id,
        etapa: etapaAtual.codigo,
        proximaEtapa: proxima?.codigo ?? null,
        responsavel: this._responsavelAtual.codigo,
        occurredAt: params.ocorridoEm,
      }),
    );

    if (!proxima) {
      return this.concluirJornada({
        marcoId: `${params.marcoId}-jornada-concluida`,
        ocorridoEm: params.ocorridoEm,
      });
    }

    return ok(this);
  }

  bloquearEtapaAtual(params: {
    bloqueioId: string;
    marcoId: string;
    motivo: string;
    ocorridoEm: string;
  }): Result<JornadaDoPaciente, DomainError> {
    const bloqueio = this.garantirPodeMutar();
    if (!bloqueio.ok) {
      return bloqueio;
    }

    if (this.bloqueioAtivo) {
      return err(new JornadaBloqueadaError("Já existe um bloqueio ativo na jornada."));
    }

    const novoBloqueio = BloqueioDaJornada.criar({
      id: params.bloqueioId,
      etapa: this._etapaAtual,
      motivo: params.motivo,
      criadoEm: params.ocorridoEm,
    });

    this._bloqueios = [...this._bloqueios, novoBloqueio];
    this._atualizadaEm = params.ocorridoEm;

    this.adicionarMarco({
      id: params.marcoId,
      tipo: "ETAPA_BLOQUEADA",
      etapa: this._etapaAtual,
      descricao: params.motivo,
      ocorridoEm: params.ocorridoEm,
    });

    this.registrarEvento(
      criarEtapaBloqueada({
        aggregateId: this.id,
        etapa: this._etapaAtual.codigo,
        bloqueioId: params.bloqueioId,
        motivo: params.motivo,
        occurredAt: params.ocorridoEm,
      }),
    );

    return ok(this);
  }

  retomarEtapaAtual(params: {
    marcoId: string;
    ocorridoEm: string;
  }): Result<JornadaDoPaciente, DomainError> {
    const bloqueio = this.garantirPodeMutar();
    if (!bloqueio.ok) {
      return bloqueio;
    }

    const bloqueioAtivo = this.bloqueioAtivo;
    if (!bloqueioAtivo) {
      return err(new JornadaBloqueadaError("Não há bloqueio ativo para retomar."));
    }

    if (!bloqueioAtivo.etapa.equals(this._etapaAtual)) {
      return err(
        new EtapaForaDeSequenciaError(
          "O bloqueio ativo não corresponde à etapa atual da jornada.",
        ),
      );
    }

    this._bloqueios = this._bloqueios.map((item) =>
      item.id === bloqueioAtivo.id ? item.inativar() : item,
    );
    this._atualizadaEm = params.ocorridoEm;

    this.adicionarMarco({
      id: params.marcoId,
      tipo: "ETAPA_RETOMADA",
      etapa: this._etapaAtual,
      descricao: `Etapa ${this._etapaAtual.codigo} retomada.`,
      ocorridoEm: params.ocorridoEm,
    });

    this.registrarEvento(
      criarEtapaRetomada({
        aggregateId: this.id,
        etapa: this._etapaAtual.codigo,
        bloqueioId: bloqueioAtivo.id,
        occurredAt: params.ocorridoEm,
      }),
    );

    return ok(this);
  }

  concluirJornada(params: {
    marcoId: string;
    ocorridoEm: string;
  }): Result<JornadaDoPaciente, DomainError> {
    if (this.estaConcluida()) {
      return err(new JornadaJaConcluidaError("A jornada já foi concluída."));
    }

    const faltantes = SEQUENCIA_OFICIAL_ETAPAS.filter(
      (etapa) => !this._etapasConcluidas.some((concluida) => concluida.equals(etapa)),
    );

    if (faltantes.length > 0) {
      return err(
        new EtapaObrigatoriaNaoConcluidaError(
          `Etapas obrigatórias pendentes: ${faltantes.map((etapa) => etapa.codigo).join(", ")}.`,
        ),
      );
    }

    this._concluidaEm = params.ocorridoEm;
    this._atualizadaEm = params.ocorridoEm;

    this.adicionarMarco({
      id: params.marcoId,
      tipo: "JORNADA_CONCLUIDA",
      etapa: EtapaDaJornada.relacionamento(),
      descricao: "Jornada do paciente concluída.",
      ocorridoEm: params.ocorridoEm,
    });

    this.registrarEvento(
      criarJornadaConcluida({
        aggregateId: this.id,
        pacienteId: this.pacienteId,
        totalEtapasConcluidas: this._etapasConcluidas.length,
        occurredAt: params.ocorridoEm,
      }),
    );

    return ok(this);
  }

  receberEventoExterno(params: {
    evento: EventoExternoJornada;
    marcoId: string;
  }): Result<JornadaDoPaciente, DomainError> {
    const bloqueio = this.garantirPodeMutar();
    if (!bloqueio.ok) {
      return bloqueio;
    }

    if (params.evento.pacienteId !== this.pacienteId) {
      return err(
        new EtapaInvalidaError("Evento externo não pertence ao paciente desta jornada."),
      );
    }

    this.adicionarMarco({
      id: params.marcoId,
      tipo: "EVENTO_EXTERNO_REGISTRADO",
      etapa: this._etapaAtual,
      descricao: params.evento.descricao,
      ocorridoEm: params.evento.ocorridoEm,
      metadados: {
        origem: params.evento.origem,
        tipo: params.evento.tipo,
      },
    });

    this._atualizadaEm = params.evento.ocorridoEm;
    return ok(this);
  }

  toSnapshot(): JornadaDoPacienteSnapshot {
    return {
      id: this.id,
      pacienteId: this.pacienteId,
      etapaAtual: this._etapaAtual.codigo,
      etapasConcluidas: this._etapasConcluidas.map((etapa) => etapa.codigo),
      bloqueios: this._bloqueios.map((bloqueio) => ({
        id: bloqueio.id,
        etapa: bloqueio.etapa.codigo,
        motivo: bloqueio.motivo,
        criadoEm: bloqueio.criadoEm,
        ativo: bloqueio.ativo,
      })),
      historico: this._historico.map((marco) => ({
        id: marco.id,
        tipo: marco.tipo,
        etapa: marco.etapa?.codigo ?? null,
        descricao: marco.descricao,
        ocorridoEm: marco.ocorridoEm,
        metadados: marco.metadados,
      })),
      responsavelAtual: this._responsavelAtual.codigo,
      iniciadaEm: this.iniciadaEm,
      atualizadaEm: this._atualizadaEm,
      concluidaEm: this._concluidaEm,
    };
  }

  private garantirPodeMutar(): Result<void, DomainError> {
    if (this.estaConcluida()) {
      return err(new JornadaJaConcluidaError("Jornada concluída não pode ser alterada."));
    }
    return ok(undefined);
  }

  private adicionarMarco(params: {
    id: string;
    tipo: "JORNADA_INICIADA" | "ETAPA_CONCLUIDA" | "ETAPA_BLOQUEADA" | "ETAPA_RETOMADA" | "EVENTO_EXTERNO_REGISTRADO" | "JORNADA_CONCLUIDA";
    etapa: EtapaDaJornada | null;
    descricao: string;
    ocorridoEm: string;
    metadados?: Record<string, string>;
  }): void {
    const marco = MarcoDaJornada.registrar(params);
    this._historico = [...this._historico, marco];
  }

  private registrarEvento(evento: JornadaDomainEvent): void {
    this._eventos.push(evento);
  }

  private validarInvariantes(): Result<void, DomainError> {
    if (this._concluidaEm && this._etapasConcluidas.length !== SEQUENCIA_OFICIAL_ETAPAS.length) {
      return err(
        new ReidratacaoInvalidaError(
          "Jornada concluída exige todas as etapas oficiais concluídas.",
        ),
      );
    }

    if (!todasEtapasAnterioresConcluidas(this._etapaAtual, this._etapasConcluidas)) {
      return err(
        new ReidratacaoInvalidaError(
          "Etapa atual viola a sequência oficial: etapas anteriores obrigatórias não concluídas.",
        ),
      );
    }

    const concluidasSemDuplicata = new Set(
      this._etapasConcluidas.map((etapa) => etapa.codigo),
    );
    if (concluidasSemDuplicata.size !== this._etapasConcluidas.length) {
      return err(new ReidratacaoInvalidaError("Histórico de etapas concluídas contém duplicatas."));
    }

    for (let i = 0; i < this._etapasConcluidas.length; i += 1) {
      const etapa = this._etapasConcluidas[i]!;
      const esperada = SEQUENCIA_OFICIAL_ETAPAS[i];
      if (!esperada || !esperada.equals(etapa)) {
        return err(
          new ReidratacaoInvalidaError(
            "Etapas concluídas fora da ordem oficial ou com lacunas.",
          ),
        );
      }
    }

    const etapaAtualJaConcluida = this._etapasConcluidas.some((etapa) =>
      etapa.equals(this._etapaAtual),
    );
    if (!this.estaConcluida() && etapaAtualJaConcluida) {
      return err(
        new ReidratacaoInvalidaError("Etapa atual não pode estar também entre as concluídas."),
      );
    }

    const bloqueiosAtivos = this._bloqueios.filter((bloqueio) => bloqueio.ativo);
    if (bloqueiosAtivos.length > 1) {
      return err(new ReidratacaoInvalidaError("Jornada não pode ter mais de um bloqueio ativo."));
    }

    if (bloqueiosAtivos[0] && !bloqueiosAtivos[0].etapa.equals(this._etapaAtual)) {
      return err(
        new ReidratacaoInvalidaError("Bloqueio ativo deve referenciar a etapa atual."),
      );
    }

    for (let i = 1; i < this._historico.length; i += 1) {
      const anterior = this._historico[i - 1]!;
      const atual = this._historico[i]!;
      if (new Date(atual.ocorridoEm).getTime() < new Date(anterior.ocorridoEm).getTime()) {
        return err(new ReidratacaoInvalidaError("Histórico deve ser cronologicamente append-only."));
      }
    }

    if (!this.estaConcluida()) {
      if (indiceDaEtapa(this._etapaAtual) !== this._etapasConcluidas.length) {
        return err(
          new ReidratacaoInvalidaError(
            "Índice da etapa atual é inconsistente com etapas concluídas.",
          ),
        );
      }
    }

    return ok(undefined);
  }
}
