// Keep full track objects in memory: local blob URLs and metadata stay intact.
export const TRACK_DRAG_TYPE = 'application/x-audiva-track';
let draggedTrack = null;
export function startTrackDrag(event, track) {
  draggedTrack = track;
  event.dataTransfer.effectAllowed = 'copy';
  event.dataTransfer.setData(TRACK_DRAG_TYPE, String(track.id));
  event.dataTransfer.setData('text/plain', `${track.title} — ${track.artist}`);
  window.dispatchEvent(new Event('audiva-track-drag'));
}
export function acceptTrackDrag(event) {
  if (!event.dataTransfer.types.includes(TRACK_DRAG_TYPE)) return false;
  event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; return true;
}
export function takeTrackDrop(event) {
  if (!acceptTrackDrag(event)) return null;
  event.stopPropagation();
  const track = draggedTrack?.id != null && String(draggedTrack.id) === event.dataTransfer.getData(TRACK_DRAG_TYPE) ? draggedTrack : null;
  draggedTrack = null;
  return track;
}
