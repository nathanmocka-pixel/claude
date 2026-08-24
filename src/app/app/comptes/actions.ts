"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { Role } from "@/lib/domain";

export async function createAccount(input: {
  email: string;
  password: string;
  role: Role;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié" };

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") return { ok: false, error: "Réservé aux admins" };

  const email = input.email.trim().toLowerCase();
  if (!email || !input.password || input.password.length < 8) {
    return { ok: false, error: "Email valide et mot de passe d'au moins 8 caractères requis." };
  }

  const admin = createSupabaseAdmin();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
  });
  if (error || !created.user) {
    return { ok: false, error: error?.message ?? "Erreur inconnue" };
  }

  // The trigger inserted a 'member' row already; only bump to admin if requested.
  if (input.role === "admin") {
    const { error: upErr } = await admin
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", created.user.id);
    if (upErr) return { ok: false, error: upErr.message };
  }

  revalidatePath("/app/comptes");
  return { ok: true };
}
