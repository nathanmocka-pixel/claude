import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { SEUIL_RELANCE, STATUTS_A_RELANCER, type Prospect } from "@/lib/domain";
import { JoursBadge } from "../_components/badges";

export default async function RelancePage() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("prospects")
    .select("*")
    .in("statut", ["contacte", ...STATUTS_A_RELANCER])
    .order("date_contact", { ascending: true, nullsFirst: false });
  const seuilMs = Date.now() - SEUIL_RELANCE * 86400000;
  const prospects = ((data ?? []) as Prospect[]).filter((p) => {
    if (STATUTS_A_RELANCER.includes(p.statut)) return true;
    if (!p.date_contact) return false;
    return new Date(p.date_contact).getTime() <= seuilMs;
  });

  if (prospects.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="font-display font-bold text-navy mb-1">Rien à relancer</div>
        <div className="text-sm text-[#8A8F98]">
          Tous les prospects contactés sont dans les temps.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-[#8A8F98] mb-3">
        Prospects contactés il y a {SEUIL_RELANCE} jours ou plus sans nouvelle relance, et tous
        les prospects en statut NRP ou à recontacter.
      </p>
      {prospects.map((p) => (
        <Link
          key={p.id}
          href={`/app/prospects/${p.id}`}
          className="block bg-white border border-[#F3C7C0] rounded-xl px-4 py-3 flex items-center justify-between hover:border-[#B0392B]/50 transition-colors"
        >
          <div>
            <div className="font-display font-bold text-sm">{p.nom}</div>
            <div className="text-xs text-[#8A8F98]">{p.entreprise}</div>
          </div>
          <JoursBadge dateContact={p.date_contact} statut={p.statut} />
        </Link>
      ))}
    </div>
  );
}
