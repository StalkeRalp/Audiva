export function InformationsTitre({ track }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <h3 className="text-lg font-semibold text-slate-100">{track?.title || "Aucun titre"}</h3>
      <p className="text-sm text-slate-400">{track?.artist || "Artiste inconnu"}</p>
    </div>
  );
}
