"use client";
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {finishSpotify} from '@/domaines/statistiques/services/spotify';
let completion;
export default function SpotifyCallback(){const [message,setMessage]=useState('Connexion Spotify en cours…');useEffect(()=>{let alive=true;completion ||= finishSpotify();completion.then(({returnTo})=>{if(alive)location.replace(returnTo);}).catch(e=>{if(alive)setMessage(e.message);});return()=>{alive=false;};},[]);return <main className="p-10 text-white"><p role="status">{message}</p><Link className="mt-6 block text-[#76eee9]" href="/bibliotheque?vue=statistiques">Retour aux statistiques</Link></main>;}
