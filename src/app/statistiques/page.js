import { redirect } from "next/navigation";

export default function StatistiquesRedirect() {
  redirect("/bibliotheque?vue=statistiques");
}
