export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="flex items-center gap-3">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-400" />
        <span className="text-sm uppercase tracking-[0.2em]">Chargement</span>
      </div>
    </div>
  );
}
