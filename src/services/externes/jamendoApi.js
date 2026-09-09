const JAMENDO_BASE = "https://api.jamendo.com/v3.0";

export async function searchJamendo(q) {
  return { q, results: [] };
}

export async function getTrack(id) {
  return { id, title: "Titre Jamendo" };
}
