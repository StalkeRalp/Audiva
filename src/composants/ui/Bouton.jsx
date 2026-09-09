export function Bouton({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-cyan-500 text-slate-950 hover:bg-cyan-400",
    secondary: "bg-slate-800 text-slate-50 hover:bg-slate-700",
    ghost: "bg-transparent text-slate-300 hover:bg-slate-800",
  };

  return (
    <button
      {...props}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
