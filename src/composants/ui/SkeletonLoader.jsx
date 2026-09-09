"use client";

export function AlbumCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-white/5 p-3">
      <div className="aspect-square w-full rounded-xl bg-white/10 mb-3" />
      <div className="h-4 bg-white/10 rounded mb-2" />
      <div className="h-3 bg-white/5 rounded w-3/4" />
    </div>
  );
}

export function TrackRowSkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-3 px-4 py-3">
      <div className="w-8 h-5 bg-white/10 rounded" />
      <div className="w-12 h-12 rounded-md bg-white/10" />
      <div className="flex-1">
        <div className="h-4 bg-white/10 rounded mb-2" />
        <div className="h-3 bg-white/5 rounded w-2/3" />
      </div>
      <div className="hidden sm:block w-10 h-4 bg-white/10 rounded" />
    </div>
  );
}

export function ArtistCardSkeleton() {
  return (
    <div className="animate-pulse text-center">
      <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-white/10" />
      <div className="h-4 bg-white/10 rounded mx-auto w-16 mb-2" />
      <div className="h-3 bg-white/5 rounded mx-auto w-12" />
    </div>
  );
}
