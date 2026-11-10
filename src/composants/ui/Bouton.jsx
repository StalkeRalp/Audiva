export function Bouton({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "audiva-button-primary text-[#06151b]",
    secondary: "audiva-glass text-slate-50 hover:bg-white/10",
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
