export function Liste({ items, renderItem, emptyText = "Aucun élément." }) {
  if (!items?.length) {
    return <p className="text-sm text-slate-400">{emptyText}</p>;
  }

  return <div className="space-y-3">{items.map(renderItem)}</div>;
}
