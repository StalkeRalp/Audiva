"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon, PlayIcon, PlusSignIcon, Share01Icon } from "@hugeicons/core-free-icons";
import CreatePlaylistButton from "@/domaines/playlists/composants/CreatePlaylistButton";

const AUTO_PLAY_DELAY = 6000;

export function HeroAccueil({ slides, onAction }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const activeSlide = slides[activeIndex];

  useEffect(() => {
    if (isPaused) return undefined;
    const timer = window.setTimeout(() => setActiveIndex((index) => (index + 1) % slides.length), AUTO_PLAY_DELAY);
    return () => window.clearTimeout(timer);
  }, [activeIndex, isPaused, slides.length]);

  const previous = () => setActiveIndex((index) => (index - 1 + slides.length) % slides.length);
  const next = () => setActiveIndex((index) => (index + 1) % slides.length);
  const sharePlaylist = async () => {
    const shareData = { title: "Ma playlist Audiva", text: "Je viens de créer une ambiance sur Audiva. Écoute ma playlist.", url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard?.writeText(`${shareData.text} ${shareData.url}`);
      setShareMessage("Lien de playlist prêt à partager");
    } catch (error) {
      if (error?.name !== "AbortError") setShareMessage("Le partage n’a pas pu être lancé");
    }
    window.setTimeout(() => setShareMessage(""), 2500);
  };

  return <section className="hero-accueil" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} aria-roledescription="carrousel" aria-label="Recommandations Audiva">
    {slides.map((slide, index) => <div key={slide.id} aria-hidden={index !== activeIndex} className={`hero-accueil__slide ${index === activeIndex ? "hero-accueil__slide--active" : ""}`}>
      {slide.video ? <video autoPlay muted loop playsInline preload="metadata" className="hero-accueil__image h-full w-full object-cover" aria-hidden="true"><source src={slide.video} type="video/mp4" /></video> : <Image src={slide.image} alt="" fill priority={index === 0} sizes="(max-width: 1024px) 100vw, calc(100vw - 256px)" className={`hero-accueil__image ${slide.position}`} />}
      <div className={`hero-accueil__shade bg-gradient-to-r ${slide.gradient}`} />
    </div>)}
    <div className="hero-accueil__fade" />
    <div className="relative z-10 flex min-h-[clamp(480px,64dvh,690px)] max-w-7xl items-start px-5 pb-24 pt-[clamp(86px,13dvh,128px)] sm:px-10 lg:px-14">
      <div key={activeSlide.id} className="hero-accueil__content max-w-xl">
        <p className="mb-5 text-sm font-medium text-[#dce5ff]">{activeSlide.overline}</p>
        <span className="inline-flex rounded-full border border-[#76e9ff]/35 bg-[#071b3a]/60 px-3 py-1 text-[11px] font-bold uppercase tracking-[.15em] text-[#86f0ff] backdrop-blur">{activeSlide.badge}</span>
        <h1 className="mt-4 text-5xl font-black leading-[.88] tracking-[-.065em] text-white sm:text-6xl lg:text-7xl">{activeSlide.title}</h1>
        <p className="mt-3 text-base font-bold tracking-[-.015em] text-[#d9e4ff] sm:text-lg">{activeSlide.artist}</p>
        <p className="mt-3 max-w-lg text-sm leading-6 text-[#bdc9e6] sm:text-base">{activeSlide.description}</p>
        {activeSlide.action === "community" ? <div className="mt-7 flex flex-wrap gap-3"><CreatePlaylistButton className="rounded-full px-6 py-3.5" /><button type="button" onClick={sharePlaylist} className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-[#07192f]/65 px-6 py-3.5 text-sm font-extrabold text-white backdrop-blur transition hover:scale-[1.03] hover:border-[#76eee9]/70 hover:bg-white/15"><HugeiconsIcon icon={Share01Icon} size={18} strokeWidth={2.4} />Partager ma playlist</button></div> : <div className="mt-7 flex flex-wrap gap-3"><button type="button" onClick={() => onAction(activeSlide)} className="inline-flex items-center gap-2 rounded-full bg-[#76eee9] px-6 py-3.5 text-sm font-extrabold text-[#051326] shadow-[0_8px_30px_rgba(76,237,231,.2)] transition hover:scale-[1.03] hover:bg-white"><HugeiconsIcon icon={PlayIcon} size={18} fill="currentColor" />{activeSlide.actionLabel}</button><button type="button" onClick={() => onAction({ ...activeSlide, action: "library" })} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"><HugeiconsIcon icon={PlusSignIcon} size={18} />Ma bibliothèque</button></div>}
      </div>
    </div>
    {shareMessage ? <p role="status" className="absolute bottom-24 left-5 z-30 border border-[#76eee9]/30 bg-[#091b32]/90 px-4 py-3 text-sm font-bold text-[#c8fffb] shadow-2xl backdrop-blur sm:left-10 lg:left-14">{shareMessage}</p> : null}
    <div className="absolute bottom-10 left-5 z-20 flex items-center gap-2 sm:left-10 lg:left-14"><button type="button" onClick={previous} aria-label="Recommandation précédente" className="hero-accueil__control"><HugeiconsIcon icon={ArrowLeft01Icon} size={19} /></button><button type="button" onClick={next} aria-label="Recommandation suivante" className="hero-accueil__control"><HugeiconsIcon icon={ArrowRight01Icon} size={19} /></button></div>
    <div className="absolute bottom-12 right-5 z-20 flex items-center gap-2 sm:right-10 lg:right-14">{slides.map((slide, index) => <button type="button" key={slide.id} onClick={() => setActiveIndex(index)} aria-label={`Afficher ${slide.title}`} aria-current={index === activeIndex} className={`h-1.5 rounded-full transition-all ${index === activeIndex ? "w-9 bg-[#76eee9]" : "w-1.5 bg-white/45 hover:bg-white"}`} />)}</div>
  </section>;
}
