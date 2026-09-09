"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";

export default function SectionDivider() {
  return (
    <div className="my-12 flex items-center gap-4">
      <div className="h-px flex-1 bg-gradient-to-r from-white/5 via-white/10 to-white/5" />
      <div className="text-xs font-semibold text-white/40 uppercase tracking-widest">
        <HugeiconsIcon icon={SparklesIcon} size={15} strokeWidth={2.2} />
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-white/5 via-white/10 to-white/5" />
    </div>
  );
}
