import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AppHeader } from "./_components/app-header";
import { SEUIL_RELANCE, STATUTS_A_RELANCER } from "@/lib/domain";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email, avatar_url")
    .eq("id", user.id)
    .single();

  // Les dead sont exclus : l'onglet doit refléter le pipeline actif, comme
  // la liste elle-même.
  const { count: prospectsCount } = await supabase
    .from("prospects")
    .select("id", { count: "exact", head: true })
    .neq("statut", "dead");

  const { data: aRelancerRows } = await supabase
    .from("prospects")
    .select("statut, date_contact")
    .in("statut", ["contacte", ...STATUTS_A_RELANCER]);
  const seuilMs = Date.now() - SEUIL_RELANCE * 86400000;
  const aRelancerCount = (aRelancerRows ?? []).filter((p) => {
    if (STATUTS_A_RELANCER.includes(p.statut)) return true;
    if (!p.date_contact) return false;
    return new Date(p.date_contact).getTime() <= seuilMs;
  }).length;

  return (
    <div className="min-h-screen bg-cream text-navy">
      <AppHeader
        membre={{
          id: user.id,
          email: profile?.email ?? user.email ?? "",
          avatar_url: profile?.avatar_url ?? null,
        }}
        role={profile?.role ?? "member"}
        aRelancerCount={aRelancerCount}
        prospectsCount={prospectsCount ?? 0}
      />
      <main className="max-w-5xl mx-auto px-5 py-6">{children}</main>
    </div>
  );
}
