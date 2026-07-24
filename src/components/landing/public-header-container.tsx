import { PublicHeader } from "@/components/landing/public-header";
import { getAuthState } from "@/modules/auth/session";
import { getAuthenticatedPortalCta } from "@/modules/auth/role-home";

export async function PublicHeaderContainer() {
  const auth = await getAuthState();
  const portalCta = auth ? getAuthenticatedPortalCta(auth.roles) : null;

  return <PublicHeader portalCta={portalCta} />;
}
