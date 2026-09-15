import { redirect } from "next/navigation";

export default function HistoriqueRedirect() {
  redirect("/bibliotheque?vue=historique");
}
