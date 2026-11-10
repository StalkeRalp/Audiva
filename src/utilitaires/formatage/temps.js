export function formatSeconds(sec) {
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  const m = Math.floor(sec / 60).toString();
  return `${m}:${s}`;
}
