import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { cookies } from "next/headers";
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

const geologica = localFont({
  src: "../../Geologica/static/Geologica-Regular.ttf",
  variable: "--font-geologica",
  display: "swap",
  weight: "400",
});

export const metadata = {
  title: "Audiva",
  description: "Lecteur musical intelligent avec bibliothèque locale, streaming et communauté.",
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const initialTheme = cookieStore.get("audiva-color-theme")?.value === "apple" ? "apple" : "audiva";
  return (
    <html lang="fr" data-theme={initialTheme} suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} ${limelight.variable} ${geologica.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try { var savedTheme = localStorage.getItem("audiva-color-theme"); if (savedTheme === "apple" || (!savedTheme && document.cookie.split("; ").includes("audiva-color-theme=apple"))) document.documentElement.dataset.theme = "apple"; else document.documentElement.dataset.theme = "audiva"; } catch {}` }} />
        <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/3.0.0/uicons-regular-rounded/css/uicons-regular-rounded.css" />
      </head>
      <body className="min-h-full bg-black text-slate-100"><ThemeProvider /><AuthProvider><OfflineSupport /><NavigationProgress /><AuthInteractionGate /><BarreSuperieure /><ApplicationShell>{children}</ApplicationShell><LecteurPersistant /></AuthProvider></body>
    </html>
  );
}
