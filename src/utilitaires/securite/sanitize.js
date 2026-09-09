export function sanitize(input) {
  if (!input) return input;
  return String(input).replace(/[<>]/g, "");
}
