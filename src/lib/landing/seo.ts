import type { Metadata } from "next";

import { getSiteUrl } from "@/lib/site/url";

const LANDING_TITLE = "Aliviar";
const LANDING_DESCRIPTION =
  "Você não precisa navegar a saúde sozinho. A luz ficou acesa.";

export const landingPageMetadata: Metadata = {
  title: LANDING_TITLE,
  description: LANDING_DESCRIPTION,
  metadataBase: new URL(getSiteUrl()),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Aliviar",
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  category: "health",
};

export const landingJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Aliviar",
  description: LANDING_DESCRIPTION,
  url: getSiteUrl(),
} as const;
