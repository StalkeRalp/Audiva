export async function getTrackById(trackId) {
  return { id: trackId, title: "Titre", artist: "Artiste" };
}

export async function getQueue() {
  return [];
}
