const memory = new Map(), pending = new Map();
let chain = Promise.resolve(), nextRequest = 0;
const normalize = value => (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
export const lyricsKey = track => JSON.stringify([normalize(track.title), normalize(track.artist), normalize(track.album), Math.round(track.duration || 0)]);
export function parseLrc(text = '') {
  const offset = Number(text.match(/\[offset:([+-]?\d+)\]/i)?.[1] || 0) / 1000;
  return text.split(/\r?\n/).flatMap(line => {
    const stamps = [...line.matchAll(/\[(\d+):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
    const words = line.replace(/\[[^\]]*\]/g, '').trim();
    return stamps.filter(m => Number(m[2]) < 60).map(m => ({ time: Math.max(0, Number(m[1])*60+Number(m[2])+Number(`0.${m[3] || 0}`)+offset), text: words }));
  }).sort((a,b) => a.time-b.time);
}
function database() { return new Promise((resolve,reject) => { const r=indexedDB.open('audiva-lyrics',1);r.onupgradeneeded=()=>r.result.createObjectStore('lyrics',{keyPath:'key'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error); }); }
async function cached(key) { if(memory.has(key))return memory.get(key);try{const db=await database();return await new Promise((resolve,reject)=>{const tx=db.transaction('lyrics');const r=tx.objectStore('lyrics').get(key);r.onsuccess=()=>{if(r.result)memory.set(key,r.result);resolve(r.result);};r.onerror=()=>reject(r.error);tx.oncomplete=()=>db.close();});}catch{return null;} }
export async function saveLyrics(track, data) { const record={...data,offlineAvailable:false,key:lyricsKey(track),metadata:{title:track.title,artist:track.artist,album:track.album,duration:track.duration},retrievedAt:Date.now()};memory.set(record.key,record);try{const db=await database();await new Promise((resolve,reject)=>{const tx=db.transaction('lyrics','readwrite');const stored={...record,offlineAvailable:true};tx.objectStore('lyrics').put(stored);if(track.id)tx.objectStore('lyrics').put({...stored,key:`track:${track.id}`});tx.oncomplete=()=>{record.offlineAvailable=true;memory.set(record.key,record);if(track.id)memory.set(`track:${track.id}`,record);db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};});}catch{/* Private mode must never block playback. */}return record; }
function request(path, params) { const run=chain.catch(()=>{}).then(async()=>{if(typeof navigator!=='undefined'&&!navigator.onLine)throw new Error('offline');const wait=nextRequest-Date.now();if(wait>0)await new Promise(r=>setTimeout(r,wait));const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);try{const response=await fetch(`https://lrclib.net/api/${path}?${new URLSearchParams(params)}`,{signal:controller.signal,headers:{'Lrclib-Client':'Audiva/0.1 (local music player)'}});if(response.status===429||response.status===503){const retry=response.headers.get('Retry-After');const delay=Number(retry)*1000||Date.parse(retry)-Date.now()||60000;nextRequest=Date.now()+Math.max(delay,1000)*1.15;throw new Error('rate-limit');}if(response.status===404)return null;if(!response.ok)throw new Error('unavailable');return await response.json();}finally{clearTimeout(timer);nextRequest=Math.max(nextRequest,Date.now()+1500);}});chain=run;return run; }
export function lyricsRecord(record, source='LRCLIB') { const lines=parseLrc(record.syncedLyrics || '');return { status:record.instrumental?'instrumental':lines.length||record.plainLyrics?'found':'missing',source,plainLyrics:record.plainLyrics || '',syncedLyrics:record.syncedLyrics || '',lines,type:lines.length?'synced':'plain',match:{title:record.trackName,artist:record.artistName,album:record.albumName,duration:record.duration} }; }
export async function searchLyrics(title, artist) {return (await request('search',{track_name:title, ...(artist?{artist_name:artist}:{})})) || [];}
export function fetchLyrics(track) {
  const key=lyricsKey(track);if(pending.has(key))return pending.get(key);
  const task=(async()=>{const old=await cached(key) || (track.id ? await cached(`track:${track.id}`) : null);if(old&&(old.status!=='missing'||Date.now()-old.retrievedAt<86400000||(typeof navigator!=='undefined'&&!navigator.onLine)))return old;
    if(Array.isArray(track.lyrics)&&track.lyrics.length)return saveLyrics(track,{status:'found',type:'synced',lines:track.lyrics,source:'Métadonnées locales'});
    if(track.tags?.lyrics){const embedded=lyricsRecord({syncedLyrics:track.tags.lyrics,plainLyrics:track.tags.lyrics},'Métadonnées locales');return saveLyrics(track,embedded);}
    if(typeof navigator!=='undefined'&&!navigator.onLine)return {status:'offline',lines:[]};
    if(!track.title||!track.artist||/inconnu/i.test(track.artist))return {status:'metadata',lines:[]};
    const params={track_name:track.title,artist_name:track.artist};if(track.album&&!/inconnu/i.test(track.album))params.album_name=track.album;if(track.duration>=1&&track.duration<=3600)params.duration=track.duration;
    let record=await request('get',params);
    if(!record){const results=await searchLyrics(track.title,track.artist);record=results.filter(r=>normalize(r.trackName)===normalize(track.title)&&normalize(r.artistName)===normalize(track.artist)&&(!track.duration||Math.abs(r.duration-track.duration)<=2)).sort((a,b)=>Number(Boolean(b.syncedLyrics))-Number(Boolean(a.syncedLyrics)))[0];}
    return saveLyrics(track,record?lyricsRecord(record):{status:'missing',lines:[],source:'LRCLIB'});
  })().finally(()=>pending.delete(key));pending.set(key,task);return task;
}
export function prefetchLyrics(tracks) { for(const track of tracks)fetchLyrics(track).catch(()=>{}); }
