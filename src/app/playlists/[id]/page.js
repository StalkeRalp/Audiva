export default function PlaylistDetailPage({ params }) {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold text-slate-100">Playlist</h1>
      <p className="mt-2 text-slate-400">Détail de la playlist : {params.id}</p>
    </main>
  );
}
