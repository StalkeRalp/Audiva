"use client";

import Image from "next/image";
import { useState } from "react";

export default function ImageWithFallback({ src, alt, fallbackGradient = "from-blue-500/20 to-purple-600/20", ...props }) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div
        className={`w-full h-full bg-gradient-to-br ${fallbackGradient} flex items-center justify-center text-3xl font-bold text-white/20`}
      >
        🎵
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      onError={() => setError(true)}
      {...props}
    />
  );
}
