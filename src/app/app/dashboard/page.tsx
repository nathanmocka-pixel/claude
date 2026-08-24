import { createSupabaseServer } from "@/lib/supabase/server";
import { SECTEURS, STATUTS, type Prospect } from "@/lib/domain";

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white border border-border rounded-xl p-4">
      <div className="font-display font-extrabold text-2xl">{value}</div>
      <div className="text-xs text-[#8A8F98] font-medium mt-0.5">{label}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.from("prospects").select("*");
  const prospects = (data ?? []) as Prospect[];

  const total = prospects.length;
  const contactes = prospects.filter((p) =>
    ["contacte", "rdv", "nrp", "close", "dead"].includes(p.statut)
  ).length;
  const rdvOuClose = prospects.filter((p) => p.statut === "rdv" || p.statut === "close").length;
  const tauxRdv = contactes > 0 ? Math.round((rdvOuClose / contactes) * 100) : 0;
  const repondus = prospects.filter((p) => p.a_repondu).length;
  const tauxReponse = contactes > 0 ? Math.round((repondus / contactes) * 100) : 0;
  const parStatut = STATUTS.map((s) => ({
    ...s,
    count: prospects.filter((p) => p.statut === s.id).length,
  }));
  const parSecteur = SECTEURS.map((s) => ({
    secteur: s,
    count: prospects.filter((p) => p.secteur === s).length,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Metric label="Prospects" value={total} />
        <Metric label="Contactés" value={contactes} />
        <Metric label="Taux de réponse" value={`${tauxReponse}%`} />
        <Metric label="Taux RDV/close" value={`${tauxRdv}%`} />
      </div>
      <p className="text-xs text-[#8A8F98] -mt-3">
        En prospection à froid, un taux de réponse entre 10 et 20 % reste normal, même avec un
        message bien construit.
      </p>

      <div className="bg-white border border-border rounded-xl p-4">
        <div className="font-display font-bold text-sm mb-3">Répartition par statut</div>
        <div className="space-y-2">
          {parStatut.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <div className="w-24 text-xs font-semibold text-[#5A6072]">{s.label}</div>
              <div className="flex-1 h-2 bg-[#F0F1F3] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: total ? `${(s.count / total) * 100}%` : "0%",
                    backgroundColor: s.color,
                  }}
                />
              </div>
              <div className="w-6 text-xs font-bold text-right">{s.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl p-4">
        <div className="font-display font-bold text-sm mb-3">Répartition par secteur</div>
        <div className="space-y-2">
          {parSecteur.map((s) => (
            <div key={s.secteur} className="flex items-center gap-3">
              <div className="w-32 text-xs font-semibold text-[#5A6072]">{s.secteur}</div>
              <div className="flex-1 h-2 bg-[#F0F1F3] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-navy"
                  style={{ width: total ? `${(s.count / total) * 100}%` : "0%" }}
                />
              </div>
              <div className="w-6 text-xs font-bold text-right">{s.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
