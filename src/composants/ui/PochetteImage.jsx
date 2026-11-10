"use client";

import { useState } from "react";
import Image from "next/image";

const FALLBACK_COVER = "/placeholders/audio-cover.svg";

export function PochetteImage({ src, alt = "", onError, ...props }) {
  const candidate = typeof src === "string" && src.trim() && src !== "[object Object]" ? src.trim() : FALLBACK_COVER;
  const [failedSource, setFailedSource] = useState("");
  const displayedSource = failedSource === candidate ? FALLBACK_COVER : candidate;
  return <Image {...props} unoptimized src={displayedSource} alt={alt} onError={event => {
    if (displayedSource !== FALLBACK_COVER) setFailedSource(candidate);
    onError?.(event);
  }} />;
}
