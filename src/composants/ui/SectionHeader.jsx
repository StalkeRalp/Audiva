"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

export default function SectionHeader({ title, subtitle, href = null, viewAllText = "Voir tout" }) {
  return (
    <div className="mb-6 mt-9 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-sm text-white/60">
            {subtitle}
          </p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-semibold text-white/60 transition hover:text-[#72eee7] whitespace-nowrap"
        >
          {viewAllText} <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={2.4} />
        </Link>
      )}
    </div>
  );
}
