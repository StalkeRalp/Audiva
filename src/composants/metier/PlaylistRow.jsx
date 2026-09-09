export function PlaylistRow({ playlist }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div>
        <p className="font-semibold text-slate-100">{playlist.name}</p>
        <p className="text-sm text-slate-400">{playlist.tracksCount} titres</p>
      </div>
      <span className="text-xs uppercase tracking-[0.25em] text-cyan-400">{playlist.visibility}</span>
    </div>
  );
}
