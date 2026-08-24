import { CalendarCheck, Clock } from "lucide-react";
import { joursAvant, joursDepuis, SEUIL_RELANCE, statutMeta, prioriteMeta } from "@/lib/domain";
import type { Priorite, Statut } from "@/lib/domain";

function dateCourte(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

// Un rendez-vous passé demande une action autant qu'un rendez-vous imminent :
// soit il a eu lieu et le statut doit bouger, soit il a été manqué.
export function RdvBadge({ dateRdv }: { dateRdv: string | null }) {
  const j = joursAvant(dateRdv);
  if (j === null || !dateRdv) return null;

  const passe = j < 0;
  const libelle =
    j === 0 ? "RDV aujourd'hui" : passe ? `RDV ${dateCourte(dateRdv)}` : `RDV le ${dateCourte(dateRdv)}`;

  return (
    <span
      title={passe ? "Rendez-vous passé, le statut n'a pas bougé" : undefined}
      className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${
        passe ? "bg-[#FFF6E5] text-[#8A6410]" : "bg-[#E8F3EC] text-[#1E7A4C]"
      }`}
    >
      <CalendarCheck size={11} strokeWidth={2.5} />
      {libelle}
    </span>
  );
}

export function StatutBadge({ statut }: { statut: Statut }) {
  const st = statutMeta(statut);
  return (
    <span
      className="text-[11px] font-bold px-2 py-1 rounded-full"
      style={{ backgroundColor: st.color + "18", color: st.color }}
    >
      {st.label}
    </span>
  );
}

export function PrioriteDot({ priorite }: { priorite: Priorite }) {
  const p = prioriteMeta(priorite);
  return (
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ backgroundColor: p.color }}
      title={p.label}
    />
  );
}

export function JoursBadge({
  dateContact,
  statut,
}: {
  dateContact: string | null;
  statut: Statut;
}) {
  const j = joursDepuis(dateContact);
  if (j === null) return <span className="text-[#B4B7BD] text-xs">—</span>;
  const urgent = statut === "nrp" || (statut === "contacte" && j >= SEUIL_RELANCE);
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
        urgent ? "bg-[#FBE9E7] text-[#B0392B]" : "bg-[#EEF0F3] text-[#5A6072]"
      }`}
    >
      <Clock size={11} strokeWidth={2.5} />
      {j === 0 ? "Aujourd'hui" : `${j}j`}
    </span>
  );
}
