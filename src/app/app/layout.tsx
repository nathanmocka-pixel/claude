import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AppHeader } from "./_components/app-header";
import { SEUIL_RELANCE } from "@/lib/domain";

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

  const { data: aRelancerRows } = await supabase
    .from("prospects")
    .select("statut, date_contact")
    .in("statut", ["contacte", "nrp"]);
  const seuilMs = Date.now() - SEUIL_RELANCE * 86400000;
  const aRelancerCount = (aRelancerRows ?? []).filter((p) => {
    if (p.statut === "nrp") return true;
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
      />
      <main className="max-w-5xl mx-auto px-5 py-6">{children}</main>
    </div>
  );
}
