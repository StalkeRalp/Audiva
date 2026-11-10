export function FichierAudioItem({ file }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-slate-100">
      {file.name}
    </div>
  );
}
