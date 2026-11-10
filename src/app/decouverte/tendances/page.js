import TendancesPersonnelles from "@/domaines/decouverte/composants/TendancesPersonnelles";

export const metadata = {
  title: "Vos tendances musicales — Audiva",
  description: "Les tendances de vos goûts calculées à partir de vos écoutes Audiva.",
};

export default function TendancesPage() {
  return <TendancesPersonnelles />;
}
