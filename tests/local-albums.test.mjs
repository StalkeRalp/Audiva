import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/domaines/decouverte/utilitaires/collections.js',import.meta.url),'utf8');
const {findLocalAlbum,localAlbumsFromTracks,normalizeCollectionId,albumResourceId}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const tracks=[{id:'1',album:"Numéro d’écrou",artist:'A',trackNumber:2},{id:'2',album:"  NUMÉRO D'ÉCROU ",artist:'B',trackNumber:1},{id:'3',album:'100% Hits',artist:'A'},{id:'4',tags:{album:'Autre album'},artist:'C'},{id:'5',album:'100%20 Hits',artist:'D'}];
test('reported route finds every song with accent/apostrophe variations',()=>{const album=findLocalAlbum(tracks,"local%3Anuméro%20d'écrou");assert.equal(album.trackCount,2);assert.deepEqual(album.songs.map(t=>t.id),['2','1']);});
test('every generated album link resolves back to its complete collection',()=>{for(const album of localAlbumsFromTracks(tracks)){assert.equal(findLocalAlbum(tracks,encodeURIComponent(album.id)).trackCount,album.trackCount);assert.equal(findLocalAlbum(tracks,album.id).id,album.id);}});
test('legacy pair IDs keep the whole album across different artists',()=>{assert.equal(findLocalAlbum(tracks,`local:${JSON.stringify(["Numéro d'écrou",'A'])}`).trackCount,2);});
test('literal percent and encoded-looking names remain distinct',()=>{assert.equal(findLocalAlbum(tracks,'local:100% Hits').songs[0].id,'3');assert.equal(findLocalAlbum(tracks,'local:100%20 Hits').songs[0].id,'5');assert.equal(findLocalAlbum(tracks,'local%3A100%2520%20Hits').songs[0].id,'5');});
test('fallback tags, unknown IDs and encoded provider prefixes',()=>{assert.equal(findLocalAlbum(tracks,'local:autre album').songs[0].id,'4');assert.equal(findLocalAlbum(tracks,'local:missing'),null);assert.equal(normalizeCollectionId('spotify%3Aabc'),'spotify:abc');});

test('album cards resolve real destinations even for legacy generated IDs',()=>{assert.equal(albumResourceId({id:'old-display-id',title:"Numéro d'écrou"}),"local:numéro d'écrou");assert.equal(albumResourceId({id:'spotify:albums:abc',provider:'spotify',providerId:'abc'}),'spotify:abc');assert.equal(albumResourceId({id:'local:actual',title:'Other'}),'local:actual');});
