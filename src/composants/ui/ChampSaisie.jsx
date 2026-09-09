export function ChampSaisie({ label, type = "text", ...props }) {
  return (
    <label className="block space-y-2 text-sm text-slate-300">
      {label && <span>{label}</span>}
      <input
        type={type}
        {...props}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-500"
      />
    </label>
  );
}
