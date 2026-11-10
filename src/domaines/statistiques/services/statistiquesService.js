export function aggregateListening(days, since = '') {
  const tracks=new Map(),artists=new Map();let seconds=0;
  const daily=Object.entries(days).filter(([date])=>date>=since).sort(([a],[b])=>a.localeCompare(b));
  for(const [,day] of daily){seconds+=day.seconds;for(const track of Object.values(day.tracks)){tracks.set(track.id,{...track,seconds:(tracks.get(track.id)?.seconds || 0)+track.seconds});artists.set(track.artist,(artists.get(track.artist)||0)+track.seconds);}}
  return {seconds,tracks:[...tracks.values()].sort((a,b)=>b.seconds-a.seconds),artists:[...artists].sort((a,b)=>b[1]-a[1]),daily};
}
