export function EnteteApplication({ title, action }) {
  return (
    <header className="mb-6 flex items-center justify-between gap-4 border-b border-slate-800 px-6 py-4">
      <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
      {action}
    </header>
  );
}
