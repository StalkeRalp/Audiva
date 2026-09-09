export function ResultatsRecherche({ results = [] }) {
  return (
    <section className="space-y-3">
      {results.length ? results.map((item) => <div key={item.id}>{item.name}</div>) : <p className="text-slate-400">Aucun résultat.</p>}
    </section>
  );
}
