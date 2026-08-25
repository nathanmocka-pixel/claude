"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AVATAR_MAX_OCTETS } from "@/lib/domain";

export async function saveAvatar(
  dataUri: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (dataUri !== null) {
    // Le redimensionnement se fait dans le navigateur, donc ces bornes sont
    // revalidées ici : rien n'empêche d'appeler l'action directement.
    if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(dataUri)) {
      return { ok: false, error: "Format d'image non reconnu." };
    }
    if (dataUri.length > AVATAR_MAX_OCTETS) {
      return { ok: false, error: "Image trop lourde après redimensionnement." };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: dataUri })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app", "layout");
  return { ok: true };
}
