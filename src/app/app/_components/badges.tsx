import { Clock } from "lucide-react";
import { joursDepuis, SEUIL_RELANCE, statutMeta, prioriteMeta } from "@/lib/domain";
import type { Priorite, Statut } from "@/lib/domain";

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
  const urgent = statut === "contacte" && j >= SEUIL_RELANCE;
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
