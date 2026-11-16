const memory = new Map(), pending = new Map();
let chain = Promise.resolve(), nextRequest = 0;
const normalize = value => (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
export const lyricsKey = track => JSON.stringify([normalize(track.title), normalize(track.artist), normalize(track.album), Math.round(track.duration || 0)]);
export function parseLrc(text = '') {
  text = typeof text === 'string' ? text : '';
  const offset = Number(text.match(/\[offset:([+-]?\d+)\]/i)?.[1] || 0) / 1000;
  return text.split(/\r?\n/).flatMap(line => {
    const stamps = [...line.matchAll(/\[(\d+):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
    const words = line.replace(/\[[^\]]*\]/g, '').trim();
    return stamps.filter(m => Number(m[2]) < 60).map(m => ({ time: Math.max(0, Number(m[1])*60+Number(m[2])+Number(`0.${m[3] || 0}`)+offset), text: words }));
  }).sort((a,b) => a.time-b.time);
}
const lyricTextKeys = ['text','lyric','lyrics','line','lineText','line_text','lyricText','lyric_text','content','body','phrase','caption','value','words','word','syllables','transcript','plainLyrics','plain_lyrics','data'];
export function extractLyricsText(value, depth = 0) {
  if (depth > 6 || value == null) return '';
  if (typeof value === 'string') {
    const text = value.trim();
    return /\[object\s+(?:Object|Array)\]/i.test(text) ? '' : text;
  }
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(item => extractLyricsText(item, depth + 1)).filter(Boolean).join('\n');
  if (typeof value === 'object') {
    for (const key of lyricTextKeys) {
      if (value[key] !== undefined && value[key] !== value) {
        const text = extractLyricsText(value[key], depth + 1);
        if (text) return text;
      }
    }
  }
  return '';
}
function lyricLineTime(line) {
  if (!line || typeof line !== 'object' || line.hasTime === false) return null;
  const fields = ['time','timestamp','startTime','start_time','start','startMs','start_ms','timeMs','time_ms'];
  for (const field of fields) {
    const value = line[field];
    if (value === undefined || value === null) continue;
    if (typeof value === 'number' || /^\d+(?:\.\d+)?$/.test(String(value))) {
      const number = Number(value);
      return Number.isFinite(number) ? (/_ms$/i.test(field) || /Ms$/.test(field) || number > 3600 ? number / 1000 : number) : null;
    }
    const stamp = String(value).trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?$/);
    if (stamp) return Number(stamp[1] || 0) * 3600 + Number(stamp[2]) * 60 + Number(stamp[3]) + Number('0.' + (stamp[4] || 0));
  }
  return null;
}
export function normalizeLyricsLines(value) {
  if (typeof value === 'string') return parseLrc(value).map(line => ({ ...line, hasTime: true }));
  if (!Array.isArray(value)) {
    if (Array.isArray(value?.lines)) return normalizeLyricsLines(value.lines);
    if (Array.isArray(value?.lyrics)) return normalizeLyricsLines(value.lyrics);
    if (Array.isArray(value?.words)) return normalizeLyricsLines(value.words);
    if (value?.syncedLyrics) return normalizeLyricsLines(value.syncedLyrics);
    return [];
  }
  return value.map(item => {
    const time = lyricLineTime(item);
    const text = extractLyricsText(item);
    return text ? { time: time ?? 0, text, hasTime: time !== null } : null;
  }).filter(Boolean);
}
function normalizeLyricsPayload(data = {}) {
  const rawSynced = data.syncedLyrics;
  const structuredPlain = Array.isArray(data.plainLyrics) || data.plainLyrics && typeof data.plainLyrics === 'object';
  const rawLines = data.lines ?? (Array.isArray(rawSynced) || rawSynced && typeof rawSynced === 'object' ? rawSynced : structuredPlain ? data.plainLyrics : undefined);
  let lines = rawLines !== undefined ? normalizeLyricsLines(rawLines) : typeof rawSynced === 'string' ? normalizeLyricsLines(rawSynced) : [];
  const hasTimedLines = lines.some(line => line.hasTime);
  const plainLyrics = extractLyricsText(data.plainLyrics) ||
    (!hasTimedLines ? extractLyricsText(rawSynced) || extractLyricsText(data.lines) : '');
  if (!hasTimedLines) lines = [];
  const found = Boolean(hasTimedLines || plainLyrics);
  return {
    ...data,
    status: data.instrumental ? 'instrumental' : found ? 'found' : data.status === 'found' ? 'missing' : data.status || 'missing',
    plainLyrics,
    syncedLyrics: typeof rawSynced === 'string' ? rawSynced : '',
    lines,
    type: hasTimedLines ? 'synced' : plainLyrics ? 'plain' : data.type || 'plain',
  };
}
function database() { return new Promise((resolve,reject) => { const r=indexedDB.open('audiva-lyrics',1);r.onupgradeneeded=()=>r.result.createObjectStore('lyrics',{keyPath:'key'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error); }); }
async function cached(key) { if(memory.has(key))return memory.get(key);try{const db=await database();return await new Promise((resolve,reject)=>{const tx=db.transaction('lyrics');const r=tx.objectStore('lyrics').get(key);r.onsuccess=()=>{if(r.result)memory.set(key,r.result);resolve(r.result);};r.onerror=()=>reject(r.error);tx.oncomplete=()=>db.close();});}catch{return null;} }
export async function saveLyrics(track, data) { const record={...normalizeLyricsPayload(data),offlineAvailable:false,key:lyricsKey(track),metadata:{title:track.title,artist:track.artist,album:track.album,duration:track.duration},retrievedAt:Date.now()};memory.set(record.key,record);try{const db=await database();await new Promise((resolve,reject)=>{const tx=db.transaction('lyrics','readwrite');const stored={...record,offlineAvailable:true};tx.objectStore('lyrics').put(stored);if(track.id)tx.objectStore('lyrics').put({...stored,key:`track:${track.id}`});tx.oncomplete=()=>{record.offlineAvailable=true;memory.set(record.key,record);if(track.id)memory.set(`track:${track.id}`,record);db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};});}catch{/* Private mode must never block playback. */}return record; }
function request(path, params) { const run=chain.catch(()=>{}).then(async()=>{if(typeof navigator!=='undefined'&&!navigator.onLine)throw new Error('offline');const wait=nextRequest-Date.now();if(wait>0)await new Promise(r=>setTimeout(r,wait));const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);try{const response=await fetch(`https://lrclib.net/api/${path}?${new URLSearchParams(params)}`,{signal:controller.signal,headers:{'Lrclib-Client':'Audiva/0.1 (local music player)'}});if(response.status===429||response.status===503){const retry=response.headers.get('Retry-After');const delay=Number(retry)*1000||Date.parse(retry)-Date.now()||60000;nextRequest=Date.now()+Math.max(delay,1000)*1.15;throw new Error('rate-limit');}if(response.status===404)return null;if(!response.ok)throw new Error('unavailable');return await response.json();}finally{clearTimeout(timer);nextRequest=Math.max(nextRequest,Date.now()+1500);}});chain=run;return run; }
export function lyricsRecord(record, source='LRCLIB') { return normalizeLyricsPayload({...record,source,match:{title:record.trackName,artist:record.artistName,album:record.albumName,duration:record.duration}}); }
export async function searchLyrics(title, artist) {
  const titleText=String(title||'').trim(),artistText=String(artist||'').trim();
  const query=artistText&&normalize(titleText).includes(normalize(artistText))?titleText:[artistText,titleText].filter(Boolean).join(' ').trim();
  if(query){
    try {
      const keywordResults=await request('search',{q:query});
      if(Array.isArray(keywordResults)&&keywordResults.length)return keywordResults;
    } catch(error) {
      if(error?.message==='rate-limit')throw error;
    }
  }
  return (await request('search',{track_name:title, ...(artist?{artist_name:artist}:{})})) || [];
}
function lyricsFieldSimilarity(left, right) {
  const a=normalize(left),b=normalize(right);
  if(!a||!b)return 0;
  if(a===b)return 1;
  if(a.includes(b)||b.includes(a))return .9;
  const leftTokens=new Set(String(left).toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu)||[]);
  const rightTokens=new Set(String(right).toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu)||[]);
  const overlap=[...leftTokens].filter(token=>rightTokens.has(token)).length;
  return overlap/Math.max(1,Math.min(leftTokens.size,rightTokens.size));
}
function chooseKeywordLyrics(track, results) {
  return (Array.isArray(results)?results:[]).map(record=>{
    const titleScore=lyricsFieldSimilarity(track.title,record.trackName||record.name);
    const artistScore=lyricsFieldSimilarity(track.artist,record.artistName);
    const durationGap=Number(track.duration)>0&&Number(record.duration)>0?Math.abs(Number(track.duration)-Number(record.duration)):null;
    const hasLyrics=Boolean(extractLyricsText(record.syncedLyrics)||extractLyricsText(record.plainLyrics));
    return {record,titleScore,artistScore,durationGap,hasLyrics,score:titleScore*5+artistScore*3+(durationGap===null?0:durationGap<=2?2:durationGap<=15?1:0)+Number(Boolean(record.syncedLyrics))*.25};
  }).filter(item=>item.hasLyrics&&item.titleScore>=.55&&item.artistScore>=.2&&(item.durationGap===null||item.durationGap<=90))
    .sort((a,b)=>b.score-a.score)[0]?.record||null;
}
export function fetchLyrics(track) {
  const key=lyricsKey(track);if(pending.has(key))return pending.get(key);
  const task=(async()=>{const old=await cached(key) || (track.id ? await cached(`track:${track.id}`) : null);const cleanedOld=old?normalizeLyricsPayload(old):null;const invalidCachedLyrics=Boolean(old&&cleanedOld?.status==='missing'&&old.status!=='missing');if(old&&!invalidCachedLyrics&&(old.status!=='missing'||Date.now()-old.retrievedAt<86400000||(typeof navigator!=='undefined'&&!navigator.onLine)))return saveLyrics(track,cleanedOld);
    if(track.lyrics && typeof track.lyrics === 'object')return saveLyrics(track,{status:'found',lines:normalizeLyricsLines(track.lyrics),plainLyrics:extractLyricsText(track.lyrics),source:'Métadonnées locales'});
    if(track.tags?.lyrics){const embedded=lyricsRecord({syncedLyrics:track.tags.lyrics,plainLyrics:track.tags.lyrics},'Métadonnées locales');return saveLyrics(track,embedded);}
    if(typeof navigator!=='undefined'&&!navigator.onLine)return {status:'offline',lines:[]};
    if(!track.title||!track.artist||/inconnu/i.test(track.artist))return {status:'metadata',lines:[]};
    const params={track_name:track.title,artist_name:track.artist};if(track.album&&!/inconnu/i.test(track.album))params.album_name=track.album;if(track.duration>=1&&track.duration<=3600)params.duration=track.duration;
    let record=null;
    try { record=await request('get',params); } catch(error) { if(error?.message==='rate-limit')throw error; }
    if(record&&!record.instrumental&&!extractLyricsText(record.syncedLyrics)&&!extractLyricsText(record.plainLyrics))record=null;
    if(!record){
      const results=await searchLyrics(track.title,track.artist);
      record=results.filter(r=>normalize(r.trackName||r.name)===normalize(track.title)&&normalize(r.artistName)===normalize(track.artist)&&(!track.duration||!r.duration||Math.abs(r.duration-track.duration)<=2)).sort((a,b)=>Number(Boolean(b.syncedLyrics))-Number(Boolean(a.syncedLyrics)))[0]||null;
      if(!record)record=chooseKeywordLyrics(track,results);
    }
    return saveLyrics(track,record?lyricsRecord(record):{status:'missing',lines:[],source:'LRCLIB'});
  })().finally(()=>pending.delete(key));pending.set(key,task);return task;
}
export function prefetchLyrics(tracks) { for(const track of tracks)fetchLyrics(track).catch(()=>{}); }
