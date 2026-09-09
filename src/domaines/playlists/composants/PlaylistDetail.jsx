export function PlaylistDetail({ playlist }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">{playlist?.name || "Playlist"}</div>;
}
