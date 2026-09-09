export function LyricsPanel({ lyrics }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-slate-200">
      {lyrics || "Paroles non disponibles."}
    </div>
  );
}
