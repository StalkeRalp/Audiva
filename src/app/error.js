"use client";

export default function Error({ error, reset }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center text-slate-100">
      <h2 className="text-2xl font-bold">Une erreur est survenue</h2>
      <p className="max-w-md text-sm text-slate-300">
        {error?.message || "Impossible de charger cette vue pour le moment."}
      </p>
      <button
        onClick={() => reset()}
        className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
      >
        Réessayer
      </button>
    </div>
  );
}
