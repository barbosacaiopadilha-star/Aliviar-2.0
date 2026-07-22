import { redirect } from "next/navigation";

import { LandingSurface } from "@/components/canonical/surfaces/LandingSurface";
import { mapLandingExperienceModel } from "@/experience-layer/mappers/landing";
import { loadJornadaView } from "@/experience-layer/fixtures/jornada-fixtures";
import { resolveCanonicalRoute } from "@/experience-layer/resolve-canonical-experience";

export default function HomePage() {
  const fixtureId = null;
  const view = loadJornadaView(fixtureId);

  if (view) {
    const route = resolveCanonicalRoute(view);
    if (route !== "/") {
      redirect(route);
    }
  }

  return <LandingSurface model={mapLandingExperienceModel()} />;
}
