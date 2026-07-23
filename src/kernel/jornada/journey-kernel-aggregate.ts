import { err, ok, type Result } from "@/domain/shared/result";
import type { DomainError } from "@/domain/shared/errors/domain-error";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule-error";

import type { OperationalStage } from "./operational-stage";
import { isTerminalStage } from "./operational-stage";
import {
  canBlock,
  canResume,
  evaluateAdvance,
  type TransitionContext,
} from "./state-machine";
import type { JourneyTransitionEvent } from "./transition-events";

export interface JourneyKernelSnapshot {
  id: string;
  patientId: string;
  currentStage: OperationalStage;
  completedStages: OperationalStage[];
  isBlocked: boolean;
  blockReason: string | null;
  closedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJourneyKernelParams {
  id: string;
  patientId: string;
  actorId: string;
  occurredAt: string;
  transitionEventId: string;
}

export class JourneyKernelAggregate {
  private readonly _transitionEvents: JourneyTransitionEvent[] = [];

  private constructor(
    readonly id: string,
    readonly patientId: string,
    private _currentStage: OperationalStage,
    private _completedStages: OperationalStage[],
    private _isBlocked: boolean,
    private _blockReason: string | null,
    private _closedAt: string | null,
    private _version: number,
    readonly createdAt: string,
    private _updatedAt: string,
  ) {}

  static create(params: CreateJourneyKernelParams): JourneyKernelAggregate {
    const aggregate = new JourneyKernelAggregate(
      params.id,
      params.patientId,
      "CADASTRO",
      [],
      false,
      null,
      null,
      1,
      params.occurredAt,
      params.occurredAt,
    );

    aggregate.recordTransition({
      id: params.transitionEventId,
      journeyId: params.id,
      type: "JOURNEY_CREATED",
      fromStage: null,
      toStage: "CADASTRO",
      actorId: params.actorId,
      occurredAt: params.occurredAt,
    });

    return aggregate;
  }

  static rehydrate(snapshot: JourneyKernelSnapshot): Result<JourneyKernelAggregate, DomainError> {
    if (snapshot.closedAt && !isTerminalStage(snapshot.currentStage)) {
      return err(new BusinessRuleError("Jornada fechada exige etapa ENCERRADO."));
    }

    if (isTerminalStage(snapshot.currentStage) && !snapshot.closedAt) {
      return err(new BusinessRuleError("Etapa ENCERRADO exige closedAt."));
    }

    return ok(
      new JourneyKernelAggregate(
        snapshot.id,
        snapshot.patientId,
        snapshot.currentStage,
        [...snapshot.completedStages],
        snapshot.isBlocked,
        snapshot.blockReason,
        snapshot.closedAt,
        snapshot.version,
        snapshot.createdAt,
        snapshot.updatedAt,
      ),
    );
  }

  get currentStage(): OperationalStage {
    return this._currentStage;
  }

  get completedStages(): readonly OperationalStage[] {
    return [...this._completedStages];
  }

  get isBlocked(): boolean {
    return this._isBlocked;
  }

  get blockReason(): string | null {
    return this._blockReason;
  }

  get isClosed(): boolean {
    return this._closedAt !== null;
  }

  get closedAt(): string | null {
    return this._closedAt;
  }

  get version(): number {
    return this._version;
  }

  get updatedAt(): string {
    return this._updatedAt;
  }

  get transitionEvents(): readonly JourneyTransitionEvent[] {
    return [...this._transitionEvents];
  }

  private transitionContext(): TransitionContext {
    return {
      currentStage: this._currentStage,
      isBlocked: this._isBlocked,
      isClosed: this.isClosed,
    };
  }

  advance(params: {
    transitionEventId: string;
    actorId: string;
    occurredAt: string;
  }): Result<JourneyKernelAggregate, DomainError> {
    const evaluation = evaluateAdvance(this.transitionContext());
    if (!evaluation.ok) {
      return err(new BusinessRuleError(evaluation.message));
    }

    const { fromStage, toStage } = evaluation;

    this._completedStages = [...this._completedStages, fromStage];
    this._currentStage = toStage;
    this._updatedAt = params.occurredAt;
    this._version += 1;

    this.recordTransition({
      id: params.transitionEventId,
      journeyId: this.id,
      type: isTerminalStage(toStage) ? "JOURNEY_CLOSED" : "STAGE_ADVANCED",
      fromStage,
      toStage,
      actorId: params.actorId,
      occurredAt: params.occurredAt,
    });

    if (isTerminalStage(toStage)) {
      this._closedAt = params.occurredAt;
    }

    return ok(this);
  }

  block(params: {
    transitionEventId: string;
    actorId: string;
    occurredAt: string;
    reason: string;
  }): Result<JourneyKernelAggregate, DomainError> {
    if (!canBlock(this.transitionContext())) {
      return err(new BusinessRuleError("Jornada n├úo pode ser bloqueada no estado atual."));
    }

    this._isBlocked = true;
    this._blockReason = params.reason;
    this._updatedAt = params.occurredAt;
    this._version += 1;

    this.recordTransition({
      id: params.transitionEventId,
      journeyId: this.id,
      type: "STAGE_BLOCKED",
      fromStage: this._currentStage,
      toStage: this._currentStage,
      actorId: params.actorId,
      occurredAt: params.occurredAt,
      metadata: { reason: params.reason },
    });

    return ok(this);
  }

  resume(params: {
    transitionEventId: string;
    actorId: string;
    occurredAt: string;
  }): Result<JourneyKernelAggregate, DomainError> {
    if (!canResume(this.transitionContext())) {
      return err(new BusinessRuleError("Jornada n├úo possui bloqueio ativo para retomar."));
    }

    this._isBlocked = false;
    this._blockReason = null;
    this._updatedAt = params.occurredAt;
    this._version += 1;

    this.recordTransition({
      id: params.transitionEventId,
      journeyId: this.id,
      type: "STAGE_RESUMED",
      fromStage: this._currentStage,
      toStage: this._currentStage,
      actorId: params.actorId,
      occurredAt: params.occurredAt,
    });

    return ok(this);
  }

  toSnapshot(): JourneyKernelSnapshot {
    return {
      id: this.id,
      patientId: this.patientId,
      currentStage: this._currentStage,
      completedStages: [...this._completedStages],
      isBlocked: this._isBlocked,
      blockReason: this._blockReason,
      closedAt: this._closedAt,
      version: this._version,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }

  private recordTransition(event: JourneyTransitionEvent): void {
    this._transitionEvents.push(event);
  }
}
