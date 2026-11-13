import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { BarreSuperieure } from "@/composants/layout/BarreSuperieure";
import { LecteurPersistant } from "@/composants/layout/LecteurPersistant";
import { ApplicationShell } from "@/composants/layout/ApplicationShell";
import { NavigationProgress } from "@/composants/layout/NavigationProgress";
import AuthProvider from "@/domaines/authentification/composants/AuthProvider";
import AuthInteractionGate from "@/domaines/authentification/composants/AuthInteractionGate";
import OfflineSupport from "@/composants/layout/OfflineSupport";
import ThemeProvider from "@/composants/layout/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const limelight = localFont({
  src: "../../Limelight/Limelight-Regular.ttf",
  variable: "--font-limelight",
  display: "swap",
  weight: "400",
});

export const metadata = {
  title: "Audiva",
  description: "Lecteur musical intelligent avec bibliothèque locale, streaming et communauté.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} ${limelight.variable} h-full antialiased`}>
      <head>
        <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/3.0.0/uicons-regular-rounded/css/uicons-regular-rounded.css" />
      </head>
      <body className="min-h-full bg-black text-slate-100"><ThemeProvider /><AuthProvider><OfflineSupport /><NavigationProgress /><AuthInteractionGate /><BarreSuperieure /><ApplicationShell>{children}</ApplicationShell><LecteurPersistant /></AuthProvider></body>
    </html>
  );
}
