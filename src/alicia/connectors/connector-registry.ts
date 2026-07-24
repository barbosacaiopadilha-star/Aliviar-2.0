import type { SourceConnector } from "./ports/source-connector";

export class ConnectorRegistry {
  private readonly connectors = new Map<string, SourceConnector>();

  register(connector: SourceConnector): void {
    if (this.connectors.has(connector.id)) {
      throw new Error(`Conector já registrado: ${connector.id}`);
    }
    this.connectors.set(connector.id, connector);
  }

  registerOrReplace(connector: SourceConnector): void {
    this.connectors.set(connector.id, connector);
  }

  unregister(connectorId: string): boolean {
    return this.connectors.delete(connectorId);
  }

  get(connectorId: string): SourceConnector | undefined {
    return this.connectors.get(connectorId);
  }

  has(connectorId: string): boolean {
    return this.connectors.has(connectorId);
  }

  list(): SourceConnector[] {
    return [...this.connectors.values()].sort((left, right) => left.priority - right.priority);
  }

  listIds(): string[] {
    return this.list().map((connector) => connector.id);
  }

  size(): number {
    return this.connectors.size;
  }

  clear(): void {
    this.connectors.clear();
  }
}
