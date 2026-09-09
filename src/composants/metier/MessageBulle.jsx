export function MessageBulle({ message, isMine = false }) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
          isMine ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-100"
        }`}
      >
        {message}
      </div>
    </div>
  );
}
