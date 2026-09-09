import { NavigationPrincipale } from "@/composants/layout/NavigationPrincipale";
import { LecteurPersistant } from "@/composants/layout/LecteurPersistant";

export function LayoutGlobal({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex">
        <NavigationPrincipale />
        <main className="flex-1">{children}</main>
      </div>
      <LecteurPersistant />
    </div>
  );
}
