"use client";

export default function AudioVisualizer({ isPlaying = false, size = "small" }) {
  const bars = 5;
  const heights = Array.from({ length: bars }, (_, i) => {
    const heights = [0.4, 0.7, 1, 0.8, 0.5];
    return heights[i];
  });

  const baseHeight = size === "small" ? 12 : 20;

  return (
    <div className="flex items-center justify-center gap-1">
      {heights.map((height, i) => (
        <div
          key={i}
          className={`rounded-full bg-[#72eee7] transition-all ${
            isPlaying ? "animate-pulse-subtle" : ""
          }`}
          style={{
            width: size === "small" ? 3 : 4,
            height: `${baseHeight * height}px`,
            animationDelay: isPlaying ? `${i * 150}ms` : "0ms",
          }}
        />
      ))}
    </div>
  );
}
