export function formatDateISO(date) {
  const d = new Date(date);
  return d.toLocaleDateString();
}
