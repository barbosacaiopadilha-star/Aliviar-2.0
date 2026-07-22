export interface ApiDomainEvent {
  type: string;
  occurred_at: string;
  payload: Record<string, unknown>;
}
