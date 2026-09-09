export default function AmiDetailPage({ params }) {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold text-slate-100">Profil ami</h1>
      <p className="mt-2 text-slate-400">Identifiant : {params.id}</p>
    </main>
  );
}
