import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Simulatore Obiezioni — Scavolini",
  description:
    "Allenati nella gestione delle obiezioni con un cliente simulato che reagisce davvero alle tue parole.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className={`${inter.className} bg-slate-100 text-slate-900 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
