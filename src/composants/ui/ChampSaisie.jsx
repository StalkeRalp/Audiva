export function ChampSaisie({ label, type = "text", ...props }) {
  return (
    <label className="block space-y-2 text-sm text-slate-300">
      {label && <span>{label}</span>}
      <input
        type={type}
        {...props}
        className="w-full rounded-2xl border border-white/10 bg-white/[.045] px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-[#76eee9] focus:ring-0"
      />
    </label>
  );
}
