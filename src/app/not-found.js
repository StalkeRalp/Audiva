import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center text-slate-100">
      <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">404</p>
      <h1 className="text-4xl font-bold">Page introuvable</h1>
      <p className="max-w-md text-slate-300">
        Cette ressource n’existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
      >
        Retour à l’accueil
      </Link>
    </div>
  );
}
