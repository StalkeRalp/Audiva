import { Bouton } from "@/composants/ui/Bouton";
import { Avatar } from "@/composants/ui/Avatar";

export function TrackCard({ track, isLiked, isPlaying, onPlay, onToggleLike }) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <Avatar src={track.coverUrl} alt={track.title} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-100">{track.title}</p>
        <p className="truncate text-sm text-slate-400">{track.artist}</p>
      </div>
      <div className="flex items-center gap-2">
        <Bouton variant={isPlaying ? "primary" : "secondary"} onClick={() => onPlay(track)}>
          {isPlaying ? "Lecture" : "Lire"}
        </Bouton>
        <Bouton variant={isLiked ? "primary" : "ghost"} onClick={() => onToggleLike(track.id)}>
          {isLiked ? "Favori" : "Ajouter"}
        </Bouton>
      </div>
    </article>
  );
}
