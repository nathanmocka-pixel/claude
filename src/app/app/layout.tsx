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
    .select("role, email")
    .eq("id", user.id)
    .single();

  const isoSeuil = new Date(Date.now() - SEUIL_RELANCE * 86400000).toISOString().slice(0, 10);
  const { count: aRelancerCount } = await supabase
    .from("prospects")
    .select("id", { count: "exact", head: true })
    .eq("statut", "contacte")
    .lte("date_contact", isoSeuil);

  return (
    <div className="min-h-screen bg-cream text-navy">
      <AppHeader
        email={profile?.email ?? user.email ?? ""}
        role={profile?.role ?? "member"}
        aRelancerCount={aRelancerCount ?? 0}
      />
      <main className="max-w-5xl mx-auto px-5 py-6">{children}</main>
    </div>
  );
}
