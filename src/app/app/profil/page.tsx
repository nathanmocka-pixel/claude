import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { Membre } from "@/lib/domain";
import { AvatarForm } from "./avatar-form";

export default async function ProfilPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("id, email, avatar_url, role")
    .eq("id", user.id)
    .single();

  const membre: Membre = {
    id: user.id,
    email: data?.email ?? user.email ?? "",
    avatar_url: data?.avatar_url ?? null,
  };

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h1 className="font-display font-bold text-lg mb-1">Mon profil</h1>
        <p className="text-sm text-[#8A8F98]">
          {membre.email} · {data?.role === "admin" ? "Admin" : "Membre"}
        </p>
      </div>
      <AvatarForm membre={membre} />
    </div>
  );
}
