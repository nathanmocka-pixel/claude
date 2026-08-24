import "server-only";
import { createSupabaseServer } from "./supabase/server";
import { DEFAULT_PROMPTS } from "./default-prompts";
import type { PromptSet } from "./prompt";

// Charge les prompts du compte connecté. Au premier accès la ligne n'existe
// pas encore : on la crée avec les valeurs par défaut pour que l'utilisateur
// ait quelque chose d'exploitable dès son premier prospect.
export async function getPrompts(userId: string): Promise<PromptSet> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("prompts")
    .select("contexte, regles_message, regles_relance, regles_post, regles_commentaire, regles_carrousel")
    .eq("owner_id", userId)
    .maybeSingle();

  if (data) return data as PromptSet;

  const { data: created } = await supabase
    .from("prompts")
    .insert({ owner_id: userId, ...DEFAULT_PROMPTS })
    .select("contexte, regles_message, regles_relance, regles_post, regles_commentaire, regles_carrousel")
    .maybeSingle();

  return (created as PromptSet | null) ?? DEFAULT_PROMPTS;
}
