export function HistoriqueItem({ item }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div>
        <p className="font-semibold text-slate-100">{item.title}</p>
        <p className="text-sm text-slate-400">{item.artist}</p>
      </div>
      <span className="text-xs text-slate-500">{item.time}</span>
    </div>
  );
}
