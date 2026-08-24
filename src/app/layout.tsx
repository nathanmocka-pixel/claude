import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nathan Mocka — Prospection",
  description: "CRM de prospection Nathan Mocka",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
