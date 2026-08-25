import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { Avatar } from "../_components/avatar";
import { CreateAccountForm } from "./create-form";

export default async function ComptesPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") redirect("/app");

  const admin = createSupabaseAdmin();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, role, created_at, avatar_url")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display font-bold text-lg mb-1">Gestion des comptes</h1>
        <p className="text-sm text-[#8A8F98]">
          Créez de nouveaux comptes. Chaque compte a ses propres prospects, sans partage.
        </p>
      </div>

      <div className="bg-white border border-border rounded-2xl p-5">
        <div className="font-display font-bold text-sm mb-3">Nouveau compte</div>
        <CreateAccountForm />
      </div>

      <div className="bg-white border border-border rounded-2xl p-5">
        <div className="font-display font-bold text-sm mb-3">Comptes existants</div>
        <div className="space-y-2">
          {(profiles ?? []).map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 text-sm px-3 py-2 rounded-lg bg-cream"
            >
              <Avatar membre={{ id: p.id, email: p.email, avatar_url: p.avatar_url }} />
              <div className="min-w-0">
                <div className="font-semibold truncate">{p.email}</div>
                <div className="text-xs text-[#8A8F98]">
                  {p.role === "admin" ? "Admin" : "Membre"} · créé le{" "}
                  {new Date(p.created_at).toLocaleDateString("fr-FR")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
