export function MiniCarte({ title, subtitle, action }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
      <p className="text-sm text-slate-400">{subtitle}</p>
      <h3 className="mt-1 text-base font-semibold text-slate-100">{title}</h3>
      {action}
    </div>
  );
}
