import { getDiscoveryInboxSnapshot } from "@/alicia/discovery/studio-adapter";
import { DiscoveryInbox } from "@/components/alicia/studio/DiscoveryInbox";

export default async function AliciaStudioDiscoveryPage() {
  const snapshot = await getDiscoveryInboxSnapshot();
  return <DiscoveryInbox snapshot={snapshot} />;
}
