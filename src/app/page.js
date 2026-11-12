import SplashScreen from "@/domaines/accueil/composants/SplashScreen";
import localFont from "next/font/local";

const bungee = localFont({
  src: "../../Bungee/Bungee-Regular.ttf",
  variable: "--font-bungee",
  display: "swap",
  weight: "400",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const metadataBase = siteUrl ? new URL(siteUrl) : undefined;

export const metadata = {
  ...(metadataBase ? { metadataBase, alternates: { canonical: "/" } } : {}),
  title: "Audiva — Votre musique, à votre façon",
  description: "Écoutez, explorez et partagez votre musique dans Audiva. Retrouvez vos morceaux, vos découvertes et votre univers musical au même endroit.",
  applicationName: "Audiva",
  openGraph: {
    ...(metadataBase ? { url: "/" } : {}),
    title: "Audiva — Votre musique, à votre façon",
    description: "Écoutez, explorez et partagez votre musique dans Audiva.",
    siteName: "Audiva",
    type: "website",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary",
    title: "Audiva — Votre musique, à votre façon",
    description: "Écoutez, explorez et partagez votre musique dans Audiva.",
  },
  robots: { index: true, follow: true },
};

export default function LandingPage() {
  return <SplashScreen bungeeClassName={bungee.variable} />;
}
