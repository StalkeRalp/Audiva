import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useEcouteStore = create(persist((set) => ({
  days: {}, startedAt: null,
  record: (track, seconds, timestamp = Date.now()) => {
    if (!track?.id || !Number.isFinite(seconds) || seconds <= 0 || seconds > 5) return;
    const date = new Date(timestamp);const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    set(state => {const day = state.days[key] || {seconds:0,tracks:{}};const old = day.tracks[track.id] || {id:track.id,title:track.title,artist:track.artist,cover:track.cover || track.image,seconds:0};return {startedAt:state.startedAt || timestamp,days:{...state.days,[key]:{seconds:day.seconds+seconds,tracks:{...day.tracks,[track.id]:{...old,seconds:old.seconds+seconds}}}}};});
  },
  clearHistory: () => set({ days: {}, startedAt: null }),
}), {name:'audiva-listening-statistics'}));
