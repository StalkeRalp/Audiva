"use client";

import { usePathname } from "next/navigation";
import { NavigationPrincipale } from "@/composants/layout/NavigationPrincipale";

export function ApplicationShell({ children }) {
  const pathname = usePathname();
  const isPublicRoute = pathname === "/" || pathname.startsWith("/authentification");

  if (isPublicRoute) return children;

  return (
    <div className="min-h-[calc(100dvh-72px)] bg-[#060b18] lg:flex">
      <NavigationPrincipale />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
