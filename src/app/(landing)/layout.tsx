import { PublicChrome } from "@/components/landing/public-chrome";

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PublicChrome className="theme-landing-green">{children}</PublicChrome>;
}
