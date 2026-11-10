export function spotifyAlbumsFromTracks(tracks,normalize){return [...new Map(tracks.filter(t=>t.album?.album_type==='album').map(t=>[t.album.id,{...normalize({...t.album,artists:t.album.artists||t.artists},'albums'),trackCount:t.album.total_tracks,releaseDate:t.album.release_date,albumType:'album'}])).values()];}
export const albumNameKey = name => String(name || '').normalize('NFKC').replace(/[’‘]/g,"'").trim().replace(/\s+/g,' ').toLocaleLowerCase('fr-FR');
export function localAlbumsFromTracks(tracks){
 const groups=new Map(),seenIds=new Set();
 for(const track of tracks){
  const albumName=track.album||track.tags?.album;
  const key=albumNameKey(albumName);
  if(!key||['album inconnu','unknown album'].includes(key))continue;
  if(track.id&&seenIds.has(track.id))continue;
  if(track.id)seenIds.add(track.id);
  let album=groups.get(key);
  if(!album){album={id:`local:${key}`,title:String(albumName).replace(/[’‘]/g,"'").trim().replace(/\s+/g,' '),artist:'',cover:null,year:track.year,trackCount:0,provider:'local',songs:[],artists:new Set()};groups.set(key,album);}
  album.songs.push(track);album.trackCount++;if(track.artist)album.artists.add(track.artist);
  const cover=track.cover||track.image;
  if(cover&&(!album.cover||album.cover.includes('/placeholders/')))album.cover=cover;
  if(!album.year&&track.year)album.year=track.year;
 }
 return [...groups.values()].map(({artists,...album})=>({...album,artist:artists.size>1?'Artistes variés':[...artists][0]||'Artiste inconnu',songs:[...album.songs].sort((a,b)=>(a.trackNumber||a.tags?.track?.no||0)-(b.trackNumber||b.tags?.track?.no||0))}));
}
export function uniquePlaylists(...collections){return [...new Map(collections.flat().filter(p=>p?.id).map(p=>[p.id,p])).values()];}

// Next route parameters may already be decoded. Decode only an encoded provider
// prefix, keeping literal percent characters in actual album names intact.
export function normalizeCollectionId(value){let id=String(value||'');for(let i=0;i<3&&/^(local|spotify|audius|jamendo)%/i.test(id);i++){try{const decoded=decodeURIComponent(id);if(decoded===id)break;id=decoded;}catch{break;}}return id;}
export function findLocalAlbum(tracks,value){const id=normalizeCollectionId(value),raw=id.replace(/^local:/i,'');let name=raw;try{const legacy=JSON.parse(raw);if(Array.isArray(legacy))name=legacy[0];}catch{}const albums=localAlbumsFromTracks(tracks);const exact=albums.find(a=>albumNameKey(a.title)===albumNameKey(name));if(exact)return exact;try{const decoded=decodeURIComponent(name);return albums.find(a=>albumNameKey(a.title)===albumNameKey(decoded))||null;}catch{return null;}}
export function albumResourceId(album){if(album.provider==='spotify'||String(album.id).startsWith('spotify:'))return `spotify:${album.providerId||String(album.id).split(':').pop()}`;if(String(album.id).startsWith('local:'))return album.id;return `local:${albumNameKey(album.songs?.[0]?.album||album.title)}`;}
