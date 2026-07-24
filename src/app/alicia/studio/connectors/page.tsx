import { getConnectorMonitorSnapshot } from "@/alicia/connectors/studio-adapter";
import { ConnectorMonitor } from "@/components/alicia/studio/ConnectorMonitor";

export default async function AliciaStudioConnectorsPage() {
  const snapshot = await getConnectorMonitorSnapshot();
  return <ConnectorMonitor snapshot={snapshot} />;
}
