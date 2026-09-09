import { Avatar } from "@/composants/ui/Avatar";

export function ProfilMini({ name, subtitle }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      <Avatar alt={name} size="sm" />
      <div>
        <p className="font-medium text-slate-100">{name}</p>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}
