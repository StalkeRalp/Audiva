export const heroSlides = [
  { id: "afterglow", image: "/hero-recommandation.jpg", position: "object-[58%_40%]", badge: "Recommandé pour vous", overline: "Bonsoir Enoch", title: "Afterglow", artist: "Maya K.", description: "Une voix magnétique et des textures électroniques pour commencer la soirée.", actionLabel: "Écouter maintenant", action: "play", gradient: "from-[#06122e] via-[#07183a]/80 to-[#021427]/30" },
  { id: "nuit-electrique", image: "/hero-playlist.jpg", position: "object-[52%_50%]", badge: "Votre playlist", overline: "Fait pour votre soirée", title: "Nuit électrique", artist: "32 morceaux · 1 h 48", description: "Une sélection pensée à partir de vos écoutes nocturnes et de vos artistes favoris.", actionLabel: "Lire la playlist", action: "playlist", gradient: "from-[#100c2e] via-[#102052]/80 to-[#06152a]/30" },
  { id: "lila-sun", image: "/hero-decouverte.jpg", position: "object-[68%_45%]", badge: "À découvrir · Jamendo", overline: "Artiste indépendant", title: "Lila Sun", artist: "Indie soul · Yaoundé", description: "Découvrez le nouvel univers de Lila Sun, disponible en écoute libre sur Jamendo.", actionLabel: "Découvrir", action: "discover", gradient: "from-[#071d28] via-[#09253f]/80 to-[#02101f]/30" },
  { id: "afro-future", image: "/hero-tendances.jpg", position: "object-[48%_30%]", badge: "Tendances", overline: "Le son du moment", title: "Afro Future", artist: "La sélection Audiva", description: "Les morceaux les plus partagés par la communauté cette semaine.", actionLabel: "Explorer", action: "trending", gradient: "from-[#1a102a] via-[#11264c]/80 to-[#050b18]/30" },
  { id: "atelier-audiva", video: "/videos/5ieme.mp4", badge: "Atelier Audiva", overline: "Ton inspiration mérite sa bande-son", title: "Crée. Partage. Inspire.", artist: "Tes idées deviennent des playlists", description: "Compose une ambiance qui te ressemble, puis fais-la voyager auprès de tes amis et de la communauté Audiva.", action: "community", gradient: "from-[#07122b]/95 via-[#102253]/72 to-[#020815]/55" },
];

export const titresHebdomadaires = [
  { id: "high-hopes", title: "High Hopes", artist: "Panic! At The Disco", gradient: "from-[#c9bca7] to-[#405759]" },
  { id: "lean-on", title: "Lean On", artist: "Major Lazer", gradient: "from-[#8268ed] to-[#3e2f91]" },
  { id: "skin", title: "Skin (LP)", artist: "Flume", gradient: "from-[#cdb6c8] to-[#65546b]" },
  { id: "havana", title: "Havana", artist: "Camila Cabello", gradient: "from-[#e72c4c] to-[#361e34]" },
  { id: "cold-future", title: "Cold ft. Future", artist: "Maroon 5", gradient: "from-[#e9c3b0] to-[#6a2d45]" },
  { id: "nothing-left", title: "Nothing Left To Say", artist: "Imagine Dragons", gradient: "from-[#6e7d8c] to-[#202435]" },
];

export const morceauxClassement = [
  { id: "level-of-concern", title: "Level of Concern", artist: "Twenty One Pilots", duration: "4:56", gradient: "from-[#f8ebd6] to-[#a1b3a0]" },
  { id: "my-future", title: "my future", artist: "Billie Eilish", duration: "3:30", gradient: "from-[#f3bd47] to-[#a1541e]" },
  { id: "soweto", title: "Soweto", artist: "Victony, Tempoe", duration: "3:25", gradient: "from-[#f08d65] to-[#4b2744]" },
];

export const artistesDuMois = [
  { id: "tems", name: "Tems", gradient: "from-[#c151d1] to-[#20152d]" },
  { id: "asake", name: "Asake", gradient: "from-[#80d6e8] to-[#2d5b93]" },
  { id: "burna", name: "Burna Boy", gradient: "from-[#e9bca2] to-[#75384a]" },
  { id: "ayra", name: "Ayra Starr", gradient: "from-[#f6ca34] to-[#86372d]" },
  { id: "omah", name: "Omah Lay", gradient: "from-[#9d6df0] to-[#261a5b]" },
];

// DONNÉES COMPLÈTES POUR TOP ALBUMS
export const topAlbums = [
  {
    id: "blue-hour",
    title: "Blue Hour",
    artist: "Maya K.",
    tracks: 12,
    cover: "/hero-recommandation.jpg",
    accent: "#3f82ff",
    songs: [
      { id: "afterglow", title: "Afterglow", artist: "Maya K.", album: "Blue Hour", cover: "/hero-recommandation.jpg", duration: 213, streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
      { id: "nuit-electrique", title: "Nuit électrique", artist: "Maya K.", album: "Blue Hour", cover: "/hero-recommandation.jpg", duration: 228, streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    ]
  },
  {
    id: "electric-night",
    title: "Nuit électrique",
    artist: "Audiva Sessions",
    tracks: 32,
    cover: "/hero-playlist.jpg",
    accent: "#836bff",
    songs: [
      { id: "lila-sun", title: "Lila Sun", artist: "Audiva Sessions", album: "Nuit électrique", cover: "/hero-playlist.jpg", duration: 196, streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    ]
  },
  {
    id: "lila-albums",
    title: "Indie Dreams",
    artist: "Lila Sun",
    tracks: 10,
    cover: "/hero-decouverte.jpg",
    accent: "#52d4bd",
    songs: []
  },
  {
    id: "afro-future-album",
    title: "Afro Future",
    artist: "Collectif Audiva",
    tracks: 16,
    cover: "/hero-tendances.jpg",
    accent: "#ef8a5f",
    songs: []
  },
  { id: "golden-vinyl", title: "Golden Vinyl", artist: "Nora Vale", tracks: 9, cover: "/image-login.jpg", accent: "#f4a261", songs: [] },
  { id: "headspace", title: "Headspace", artist: "Kairo", tracks: 14, cover: "/image sign-up.jpg", accent: "#6fb7e9", songs: [] },
  { id: "soft-focus", title: "Soft Focus", artist: "Ama Rey", tracks: 11, cover: "/hero-playlist.jpg", accent: "#ce82ff", songs: [] },
  { id: "dawn-radio", title: "Dawn Radio", artist: "Soleil Noir", tracks: 13, cover: "/hero-decouverte.jpg", accent: "#64dfcf", songs: [] },
];

export const topArtists = [
  {
    id: "maya-k",
    name: "Maya K.",
    listeners: "42,8 k",
    image: "/hero-recommandation.jpg",
    position: "object-[63%_36%]",
    followers: 42800,
    topTracks: ["afterglow", "nuit-electrique"],
  },
  {
    id: "lila-sun",
    name: "Lila Sun",
    listeners: "28,1 k",
    image: "/hero-decouverte.jpg",
    position: "object-[67%_42%]",
    followers: 28100,
    topTracks: ["lila-sun"],
  },
  {
    id: "audiva-sessions",
    name: "Audiva Sessions",
    listeners: "65,4 k",
    image: "/hero-playlist.jpg",
    position: "object-[45%_37%]",
    followers: 65400,
    topTracks: [],
  },
  {
    id: "collectif-audiva",
    name: "Collectif Audiva",
    listeners: "19,7 k",
    image: "/hero-tendances.jpg",
    position: "object-[47%_31%]",
    followers: 19700,
    topTracks: [],
  },
];

export const topPlaylists = [
  {
    id: "late-night",
    title: "Late Night Drive",
    description: "Synths, indie et douceur nocturne.",
    tracks: 24,
    cover: "/hero-recommandation.jpg",
    trackIds: ["afterglow", "nuit-electrique"],
    curated: true,
    updatedAt: "Mis à jour jeudi",
  },
  {
    id: "afro-vibes",
    title: "Afro Vibes",
    description: "Les rythmes qui font vibrer vos amis.",
    tracks: 38,
    cover: "/hero-tendances.jpg",
    trackIds: ["afro-future", "lila-sun"],
    curated: true,
    updatedAt: "Mis à jour samedi",
  },
  {
    id: "indie-radar",
    title: "Indie Radar",
    description: "Les talents libres repérés sur Jamendo.",
    tracks: 18,
    cover: "/hero-decouverte.jpg",
    trackIds: ["lila-sun", "afterglow"],
    curated: false,
    updatedAt: "Mis à jour dimanche",
  },
  {
    id: "blue-room",
    title: "Blue Room",
    description: "Une sélection intime pour se concentrer.",
    tracks: 22,
    cover: "/hero-playlist.jpg",
    trackIds: ["nuit-electrique", "afro-future"],
    curated: true,
    updatedAt: "Mis à jour lundi",
  },
];
