export function Carte({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/20 ${className}`}>
      {children}
    </div>
  );
}
