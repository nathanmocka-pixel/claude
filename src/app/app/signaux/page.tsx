import Link from "next/link";
import { Radar } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
import { SEUIL_SIGNAL_FRAIS, joursDepuis, type Prospect } from "@/lib/domain";
import { StatutBadge } from "../_components/badges";

export default async function SignauxPage() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("prospects")
    .select("*")
    .not("signal", "is", null)
    .order("signal_date", { ascending: false, nullsFirst: false });
  const prospects = (data ?? []) as Prospect[];

  if (prospects.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="font-display font-bold text-navy mb-1">Aucun signal enregistré</div>
        <div className="text-sm text-[#8A8F98] max-w-md mx-auto">
          Renseignez le signal qui a motivé l&apos;ajout d&apos;un prospect pour le retrouver ici.
          Une offre d&apos;emploi récente sur un poste back office est le signal le plus fiable :
          daté, vérifiable, et directement exploitable pour construire le pain point.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-[#8A8F98] mb-3">
        Prospects ajoutés sur signal, du plus frais au plus ancien. Un signal de plus de{" "}
        {SEUIL_SIGNAL_FRAIS} jours perd son actualité.
      </p>
      {prospects.map((p) => {
        const j = joursDepuis(p.signal_date);
        const frais = j !== null && j <= SEUIL_SIGNAL_FRAIS;
        return (
          <Link
            key={p.id}
            href={`/app/prospects/${p.id}`}
            className="block bg-white border border-border rounded-xl px-4 py-3 hover:border-navy/30 transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-display font-bold text-sm truncate">{p.nom}</div>
                <div className="text-xs text-[#8A8F98] truncate">{p.entreprise}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatutBadge statut={p.statut} />
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    frais ? "bg-[#E8F3EC] text-[#1E7A4C]" : "bg-[#EEF0F3] text-[#5A6072]"
                  }`}
                >
                  {j === null ? "sans date" : j === 0 ? "Aujourd'hui" : `${j}j`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-[#5A6072]">
              <Radar size={12} className="shrink-0" />
              <span className="truncate">{p.signal}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
