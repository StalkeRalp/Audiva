export function Avatar({ src, alt, size = "md" }) {
  const sizes = {
    sm: "h-10 w-10",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div className={`overflow-hidden rounded-full border border-slate-700 bg-slate-800 ${sizes[size]}`}>
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-200">
          {alt?.slice(0, 2)?.toUpperCase() || "A"}
        </div>
      )}
    </div>
  );
}
