import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aliviar Conexão",
  description: "Plataforma de conexão humana e cuidado",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
