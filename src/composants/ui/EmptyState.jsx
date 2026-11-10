"use client";

export default function EmptyState({ title, description, icon = "🎵", actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/60 mb-6 max-w-sm text-center">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 bg-[#72eee7] text-[#071426] font-semibold rounded-lg hover:bg-white transition transform hover:scale-105 active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
