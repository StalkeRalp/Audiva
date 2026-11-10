export function Carte({ children, className = "" }) {
  return (
    <div className={`audiva-glass rounded-3xl p-5 ${className}`}>
      {children}
    </div>
  );
}
