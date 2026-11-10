export function NotificationItem({ notification }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="font-semibold text-slate-100">{notification.title}</p>
      <p className="mt-1 text-sm text-slate-400">{notification.message}</p>
    </div>
  );
}
