"use client";

import Link from "next/link";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Album01Icon, CompassIcon, MusicNote01Icon, Radio01Icon } from "@hugeicons/core-free-icons";
import SectionHeader from "@/composants/ui/SectionHeader";

const genres = [
  { name: "Nouvelles sorties", color: "from-[#e23818] to-[#8d150d]", image: "/hero-recommandation.jpg", icon: Album01Icon },
  { name: "Afro", color: "from-[#9e1f45] to-[#54142d]", image: "/hero-tendances.jpg", icon: MusicNote01Icon },
  { name: "Dancehall / Zouk", color: "from-[#146fe2] to-[#184897]", image: "/hero-playlist.jpg", icon: Radio01Icon },
  { name: "Pop", color: "from-[#538da3] to-[#315366]", image: "/image-login.jpg", icon: MusicNote01Icon },
  { name: "Hip-Hop", color: "from-[#4b8aa3] to-[#295166]", image: "/hero-decouverte.jpg", icon: CompassIcon },
  { name: "Classements", color: "from-[#8b61ae] to-[#55336c]", image: "/hero-tendances.jpg", icon: Album01Icon },
  { name: "Rock", color: "from-[#087161] to-[#05463d]", image: "/image-login.jpg", icon: MusicNote01Icon },
  { name: "Dance / Électro", color: "from-[#4e8ba2] to-[#2d5969]", image: "/hero-playlist.jpg", icon: Radio01Icon },
];

export default function GenresSection() {
  return (
    <section className="mt-12">
      <SectionHeader
        title="Explorez par Genre"
        subtitle="Découvrez de la musique organisée par style"
        href="/decouverte/genres"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {genres.map((genre) => (
          <Link
            key={genre.name}
            href={`/recherche?genre=${genre.name}`}
            className={`group relative min-h-[138px] overflow-hidden bg-gradient-to-br ${genre.color} p-4 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30`}
          >
            <Image src={genre.image} alt="" width={220} height={220} className="absolute -bottom-7 -right-6 h-32 w-32 rotate-[18deg] object-cover shadow-2xl transition duration-500 group-hover:scale-110 group-hover:rotate-[12deg]" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/25" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <HugeiconsIcon icon={genre.icon} size={21} strokeWidth={2.4} className="text-white/85" />
              <h3 className="max-w-[150px] text-xl font-extrabold leading-6 tracking-[-.04em] text-white">{genre.name}</h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
