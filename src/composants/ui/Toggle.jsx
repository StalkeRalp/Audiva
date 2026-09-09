export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-200">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-cyan-500" : "bg-slate-700"}`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`}
        />
      </button>
    </label>
  );
}
