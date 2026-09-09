export function TitreSection({ children, action }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-xl font-semibold text-slate-100">{children}</h2>
      {action}
    </div>
  );
}
