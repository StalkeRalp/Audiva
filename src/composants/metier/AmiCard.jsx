import { Avatar } from "@/composants/ui/Avatar";

export function AmiCard({ ami }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center gap-3">
        <Avatar src={ami.avatar} alt={ami.name} size="md" />
        <div>
          <p className="font-semibold text-slate-100">{ami.name}</p>
          <p className="text-sm text-slate-400">{ami.status}</p>
        </div>
      </div>
      <span className="text-xs uppercase tracking-[0.25em] text-emerald-400">En ligne</span>
    </div>
  );
}
