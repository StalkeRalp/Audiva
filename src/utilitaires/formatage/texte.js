export function truncate(text, max = 60) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}
