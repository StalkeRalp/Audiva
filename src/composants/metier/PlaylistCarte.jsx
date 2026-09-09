export function PlaylistCarte({ playlist }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-3 h-32 rounded-xl bg-gradient-to-br from-cyan-500/20 via-slate-800 to-violet-500/20" />
      <p className="font-semibold text-slate-100">{playlist.name}</p>
      <p className="text-sm text-slate-400">{playlist.owner}</p>
    </div>
  );
}
