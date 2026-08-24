import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
import { SECTEURS, STATUTS, type Membre, type Prospect } from "@/lib/domain";
import { JoursBadge, PrioriteDot, StatutBadge } from "./_components/badges";
import { OwnerBadge } from "./_components/owner-badge";

type SP = Promise<{ statut?: string; secteur?: string; q?: string; qui?: string }>;

export default async function ProspectsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let query = supabase
    .from("prospects")
    .select("*")
    .order("date_contact", { ascending: false, nullsFirst: false });
  if (sp.statut && sp.statut !== "tous") query = query.eq("statut", sp.statut);
  if (sp.secteur && sp.secteur !== "tous") query = query.eq("secteur", sp.secteur);
  if (sp.qui === "moi") query = query.eq("owner_id", user.id);
  if (sp.q?.trim()) {
    const term = `%${sp.q.trim()}%`;
    query = query.or(`nom.ilike.${term},entreprise.ilike.${term}`);
  }
  const { data } = await query;
  const prospects = (data ?? []) as Prospect[];

  const { data: membresRows } = await supabase.from("profiles").select("id, email, avatar_url");
  const membres = new Map<string, Membre>(
    ((membresRows ?? []) as Membre[]).map((m) => [m.id, m])
  );
  const equipePartagee = membres.size > 1;

  return (
    <div>
      <form className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B4B7BD]"
          />
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Rechercher un nom, une entreprise…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-navy/20"
          />
        </div>
        <select
          name="statut"
          defaultValue={sp.statut ?? "tous"}
          className="text-sm rounded-lg border border-border bg-white px-2.5 py-2 focus:outline-none"
        >
          <option value="tous">Tous statuts</option>
          {STATUTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          name="secteur"
          defaultValue={sp.secteur ?? "tous"}
          className="text-sm rounded-lg border border-border bg-white px-2.5 py-2 focus:outline-none"
        >
          <option value="tous">Tous secteurs</option>
          {SECTEURS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        {equipePartagee && (
          <select
            name="qui"
            defaultValue={sp.qui ?? "tous"}
            className="text-sm rounded-lg border border-border bg-white px-2.5 py-2 focus:outline-none"
          >
            <option value="tous">Toute l&apos;équipe</option>
            <option value="moi">Mes prospects</option>
          </select>
        )}
        <button
          type="submit"
          className="text-sm font-semibold px-4 py-2 rounded-lg bg-navy text-white"
        >
          Filtrer
        </button>
      </form>

      {prospects.length === 0 ? (
        <div className="text-center py-16 text-[#8A8F98] text-sm">
          Aucun prospect ne correspond.
        </div>
      ) : (
        <div className="space-y-2">
          {prospects.map((p) => (
            <Link
              key={p.id}
              href={`/app/prospects/${p.id}`}
              className="block bg-white border border-border rounded-xl px-4 py-3 flex items-center justify-between hover:border-navy/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <PrioriteDot priorite={p.priorite} />
                <div className="min-w-0">
                  <div className="font-display font-bold text-sm truncate">{p.nom}</div>
                  <div className="text-xs text-[#8A8F98] truncate">
                    {p.poste ? `${p.poste} · ` : ""}
                    {p.entreprise}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <OwnerBadge ownerId={p.owner_id} membres={membres} currentUserId={user.id} />
                <StatutBadge statut={p.statut} />
                <JoursBadge dateContact={p.date_contact} statut={p.statut} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
