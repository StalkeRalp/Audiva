export function AlbumCover({ src, alt, title }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-2">
      <img src={src} alt={alt || title} className="h-40 w-full rounded-xl object-cover" />
      <p className="mt-3 text-sm font-medium text-slate-100">{title}</p>
    </div>
  );
}
