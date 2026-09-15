import { Geist, Geist_Mono } from "next/font/google";
import { BarreSuperieure } from "@/composants/layout/BarreSuperieure";
import { LecteurPersistant } from "@/composants/layout/LecteurPersistant";
import { ApplicationShell } from "@/composants/layout/ApplicationShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Audiva",
  description: "Lecteur musical intelligent avec bibliothèque locale, streaming et communauté.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/3.0.0/uicons-regular-rounded/css/uicons-regular-rounded.css" />
      </head>
      <body className="min-h-full bg-black text-slate-100"><BarreSuperieure /><ApplicationShell>{children}</ApplicationShell><LecteurPersistant /></body>
    </html>
  );
}
