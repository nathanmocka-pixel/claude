"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { DEFAULT_PROMPTS } from "@/lib/default-prompts";
import type { PromptSet } from "@/lib/prompt";

export async function savePrompts(
  prompts: PromptSet
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("prompts")
    .upsert({ owner_id: user.id, ...prompts }, { onConflict: "owner_id" });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app", "layout");
  return { ok: true };
}

export async function resetPrompts(): Promise<{ ok: true } | { ok: false; error: string }> {
  return savePrompts(DEFAULT_PROMPTS);
}
