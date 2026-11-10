export function StatCard({ label, value, accent = "cyan" }) {
  const accents = {
    cyan: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
    emerald: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    violet: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  };

  return (
    <div className={`rounded-2xl border p-4 ${accents[accent]}`}>
      <p className="text-sm text-slate-300">{label}</p>
      <h3 className="mt-2 text-2xl font-bold">{value}</h3>
    </div>
  );
}
