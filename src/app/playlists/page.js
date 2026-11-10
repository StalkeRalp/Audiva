"use client";

import Link from "next/link";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Delete02Icon, MusicNote01Icon } from "@hugeicons/core-free-icons";
import { usePlaylistsStore } from "@/domaines/playlists/stores/playlistsStore";

export default function PlaylistsPage() {
  const playlists = usePlaylistsStore((state) => state.playlists);
  const createPlaylist = usePlaylistsStore((state) => state.createPlaylist);
  const removePlaylist = usePlaylistsStore((state) => state.removePlaylist);
  const [creationOpen, setCreationOpen] = useState(false);
  const [title, setTitle] = useState("");

  const create = (event) => {
    event.preventDefault();
    if (!title.trim()) return;
    createPlaylist({ title });
    setTitle("");
    setCreationOpen(false);
  };
  const remove = (playlist) => {
    if (!window.confirm(`Supprimer définitivement la playlist « ${playlist.title} » ?`)) return;
    removePlaylist(playlist.id);
  };

  return (
    <main className="min-h-screen bg-[#060b18] px-4 py-6 pb-32 text-[#eff4ff] sm:px-7 sm:py-8 sm:pb-32 xl:px-9">
        <section className="relative overflow-hidden border border-[#5d72fe]/30 bg-[linear-gradient(110deg,rgba(15,27,64,.97),rgba(7,13,31,.72)),url('/hero-playlist.jpg')] bg-cover bg-center p-7 sm:p-9">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_28%,rgba(114,238,231,.15),transparent_25%)]" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[.22em] text-[#83eee8]">Votre espace musical</p>
            <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">Mes playlists</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#c1cce3]">Créez, organisez et partagez les bandes-son de chaque moment.</p>
            <button type="button" onClick={() => setCreationOpen(true)} className="mt-6 inline-flex items-center gap-2 bg-[#72eee7] px-5 py-3 text-sm font-extrabold text-[#061426] transition hover:brightness-110 active:scale-[.98]">
              <HugeiconsIcon icon={Add01Icon} size={19} />
              Créer une playlist
            </button>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white">Vos playlists</h2>
              <p className="mt-1 text-sm text-[#91a0bd]">{playlists.length} playlist{playlists.length > 1 ? "s" : ""} enregistrée{playlists.length > 1 ? "s" : ""} sur cet appareil</p>
            </div>
          </div>

          {playlists.length === 0 ? (
            <div className="mt-5 grid min-h-56 place-items-center border border-dashed border-[#33466f] bg-[#0a1221] p-8 text-center">
              <div><HugeiconsIcon icon={MusicNote01Icon} size={32} className="mx-auto text-[#72eee7]" /><p className="mt-4 text-lg font-extrabold text-white">Votre première playlist vous attend</p><p className="mt-2 text-sm text-[#91a0bd]">Elle sera créée vide : vous choisirez les morceaux à y ajouter.</p></div>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {playlists.map((playlist) => <article key={playlist.id} className="group relative border border-white/8 bg-[#0a1221] p-3 transition hover:-translate-y-1 hover:border-[#72eee7]/40 hover:bg-[#101b31]"><Link href={`/playlists/${playlist.id}`} className="block">
                <div className="relative aspect-square overflow-hidden bg-[linear-gradient(135deg,#233b77,#10182f)] bg-cover bg-center" style={playlist.cover ? { backgroundImage: `url(${playlist.cover})` } : undefined}>
                  {!playlist.cover && <HugeiconsIcon icon={MusicNote01Icon} size={38} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#72eee7]/75" />}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#050914]/80 to-transparent" />
                </div>
                <p className="mt-3 truncate font-extrabold text-white">{playlist.title}</p>
                <p className="mt-1 text-xs text-[#91a0bd]">{playlist.tracks.length} morceau{playlist.tracks.length > 1 ? "x" : ""} · Créée par vous</p>
              </Link><button type="button" onClick={() => remove(playlist)} aria-label={`Supprimer ${playlist.title}`} className="absolute right-5 top-5 grid h-9 w-9 place-items-center bg-[#07101e]/85 text-rose-200 opacity-0 shadow-lg transition hover:bg-rose-400/20 group-hover:opacity-100 focus:opacity-100"><HugeiconsIcon icon={Delete02Icon} size={18} /></button></article>)}
            </div>
          )}
        </section>
      {creationOpen && <div className="fixed inset-0 z-[70] grid place-items-center bg-[#02050d]/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="new-playlist-title">
        <form onSubmit={create} className="w-full max-w-md border border-white/10 bg-[#0b1426] p-6 shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-[.15em] text-[#83eee8]">Nouvelle playlist</p>
          <h2 id="new-playlist-title" className="mt-2 text-2xl font-black text-white">Donnez-lui un nom</h2>
          <p className="mt-2 text-sm text-[#aebbd7]">Votre playlist sera créée vide. Vous pourrez ensuite y ajouter vos morceaux.</p>
          <label className="mt-5 block text-xs font-bold text-[#aebbd7]">Nom de la playlist<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex. Mes trajets du soir" className="mt-2 w-full border border-white/12 bg-[#07101e] px-3 py-3 text-sm text-white outline-none focus:border-[#72eee7]" /></label>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setCreationOpen(false)} className="border border-white/12 px-4 py-3 text-sm font-bold text-white hover:bg-white/5">Annuler</button><button type="submit" disabled={!title.trim()} className="bg-[#72eee7] px-4 py-3 text-sm font-extrabold text-[#061426] disabled:cursor-not-allowed disabled:opacity-40">Créer vide</button></div>
        </form>
      </div>}
    </main>
  );
}
