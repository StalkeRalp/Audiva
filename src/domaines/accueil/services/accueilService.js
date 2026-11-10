import { artistesDuMois, heroSlides, morceauxClassement, titresHebdomadaires } from "../donnees/accueilMock";

export async function getAccueilData() {
  return { heroSlides, titresHebdomadaires, morceauxClassement, artistesDuMois };
}
