"use client";
import {useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {HugeiconsIcon} from '@hugeicons/react';
import {ArrowRight01Icon,CompassIcon,MusicNote01Icon,FavouriteIcon,LibraryIcon} from '@hugeicons/core-free-icons';
export const browseCategories=[
 {name:'Pop',query:'genre:pop',group:'styles',color:'#276d60',image:'/hero-recommandation.jpg',note:'Des refrains qui restent'},
 {name:'Hip-hop',query:'genre:hip-hop',group:'styles',color:'#654a27',image:'/hero-tendances.jpg',note:'Le rythme et les mots'},
 {name:'R&B & Soul',query:'genre:r-n-b',group:'styles',color:'#634659',image:'/favoris1.jpg',note:'Au plus près des émotions'},
 {name:'Afro',query:'genre:afrobeat',group:'styles',color:'#a05430',image:'/hero-decouverte.jpg',note:'Un mouvement sans frontières'},
 {name:'Électronique',query:'genre:electronic',group:'styles',color:'#315a91',image:'/hero-playlist.jpg',note:'Fréquences et horizons'},
 {name:'Rock',query:'genre:rock',group:'styles',color:'#755143',image:'/recherche.jpg',note:'Brut, libre, électrique'},
 {name:'Jazz',query:'genre:jazz',group:'styles',color:'#79683c',image:'/hero-recommandation.jpg',note:'La liberté dans chaque note'},
 {name:'Amapiano',query:'genre:amapiano',group:'styles',color:'#466453',image:'/hero-tendances.jpg',note:'Une autre façon de vibrer'},
 {name:'Classique',query:'genre:classical',group:'styles',color:'#586a77',image:'/hero-decouverte.jpg',note:'Les œuvres qui traversent le temps'},
 {name:'Reggae',query:'genre:reggae',group:'styles',color:'#536b34',image:'/hero-playlist.jpg',note:'Un souffle de liberté'},
 {name:'K-pop',query:'genre:k-pop',group:'styles',color:'#755183',image:'/favoris1.jpg',note:'Toute une nouvelle énergie'},
 {name:'Latin',query:'genre:latin',group:'styles',color:'#9a4a39',image:'/recherche.jpg',note:'La chaleur du rythme'},
 {name:'Concentration',query:'focus instrumental',group:'moods',color:'#326561',image:'/hero-playlist.jpg',note:'Votre espace, votre cadence'},
 {name:'Chill',query:'chill',group:'moods',color:'#506880',image:'/hero-recommandation.jpg',note:'Le temps de ralentir'},
 {name:'Sport',query:'workout',group:'moods',color:'#7a5836',image:'/hero-tendances.jpg',note:'L’énergie du prochain effort'},
 {name:'Soirée',query:'party',group:'moods',color:'#604b82',image:'/hero-decouverte.jpg',note:'La nuit ne fait que commencer'},
 {name:'Voyage',query:'road trip',group:'moods',color:'#3b706b',image:'/recherche.jpg',note:'Le son des grands départs'},
 {name:'Sommeil',query:'sleep ambient',group:'moods',color:'#364a69',image:'/hero-playlist.jpg',note:'Tout doucement, ailleurs'},
 {name:'Acoustique',query:'acoustic',group:'moods',color:'#746346',image:'/hero-recommandation.jpg',note:'L’essentiel, sans détour'},
 {name:'Bonne humeur',query:'feel good',group:'moods',color:'#7c7739',image:'/hero-tendances.jpg',note:'Quelques notes, et tout change'},
];
export default function BrowseCategories(){const [filter,setFilter]=useState('all');const categories=browseCategories.filter(c=>filter==='all'||c.group===filter);return <><section className="db-browse"><header><div><span className="db-section-label"><HugeiconsIcon strokeWidth={1.8} icon={CompassIcon} size={16}/>DES UNIVERS À EXPLORER</span><h2>Trouvez votre prochaine vibration.</h2><p>Un style, une humeur, une envie. Choisissez votre point de départ.</p></div><div className="db-browse-filters" aria-label="Filtrer les catégories">{[['all','Tout'],['styles','Styles musicaux'],['moods','Ambiances']].map(([id,label])=><button key={id} aria-pressed={filter===id} onClick={()=>setFilter(id)}>{label}</button>)}</div></header><div className="db-category-grid">{categories.map(c=><Link href={c.group === "styles" ? `/recherche?q=${encodeURIComponent(c.name)}&genre=${encodeURIComponent(c.query.replace(/^genre:/, ""))}` : `/recherche?q=${encodeURIComponent(c.query)}`} key={c.name} className="db-category-card" style={{'--category-color':c.color}} aria-label={`Explorer ${c.name}`}><span className="db-category-kicker">{c.group==='styles'?'STYLE MUSICAL':'POUR VOTRE MOMENT'}</span><h3>{c.name}</h3><p>{c.note}</p><Image src={c.image} alt="" width={220} height={220} className="db-category-cover"/><span className="db-category-arrow"><HugeiconsIcon strokeWidth={1.8} icon={ArrowRight01Icon} size={18}/></span></Link>)}</div></section><section className="db-shortcuts" aria-label="Votre espace musical">{[{href:'/favoris',title:'Vos coups de cœur',text:'Les titres que vous avez aimés',icon:FavouriteIcon},{href:'/bibliotheque',title:'Votre collection',text:'Votre musique, toujours à portée de main',icon:LibraryIcon},{href:'/statistiques',title:'Votre empreinte',text:'Découvrez vos habitudes d’écoute',icon:MusicNote01Icon}].map(item=><Link key={item.href} href={item.href}><span><HugeiconsIcon strokeWidth={1.8} icon={item.icon} size={25}/></span><div><h3>{item.title}</h3><p>{item.text}</p></div><HugeiconsIcon strokeWidth={1.8} icon={ArrowRight01Icon} size={18}/></Link>)}</section></>;}
