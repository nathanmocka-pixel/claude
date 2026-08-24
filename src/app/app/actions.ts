"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { Priorite, Statut } from "@/lib/domain";

async function requireUser() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createProspect(input: {
  nom: string;
  entreprise: string;
  poste?: string;
  linkedin?: string;
  contact?: string;
  secteur?: string;
  priorite?: Priorite;
  pain_point?: string;
  signal?: string;
  signal_date?: string;
}) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("prospects")
    .insert({
      owner_id: user.id,
      nom: input.nom.trim(),
      entreprise: input.entreprise.trim(),
      poste: input.poste || null,
      linkedin: input.linkedin || null,
      contact: input.contact || null,
      secteur: input.secteur || null,
      priorite: input.priorite || "tiede",
      pain_point: input.pain_point || null,
      signal: input.signal || null,
      signal_date: input.signal_date || null,
      statut: "a_qualifier",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/app", "layout");
  redirect(`/app/prospects/${data.id}`);
}

export async function updateProspect(
  id: string,
  patch: Partial<{
    nom: string;
    entreprise: string;
    poste: string | null;
    linkedin: string | null;
    contact: string | null;
    secteur: string | null;
    statut: Statut;
    priorite: Priorite;
    pain_point: string | null;
    date_contact: string | null;
    note: string | null;
    signal: string | null;
    signal_date: string | null;
    a_repondu: boolean;
  }>
) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("prospects").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/app", "layout");
}

export async function marquerContacte(id: string) {
  await updateProspect(id, {
    statut: "contacte",
    date_contact: new Date().toISOString().slice(0, 10),
  });
}

export async function deleteProspect(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("prospects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/app", "layout");
  redirect("/app");
}

export async function addHistorique(prospectId: string, contenu: string, canal = "LinkedIn") {
  const { supabase, user } = await requireUser();
  const today = new Date().toISOString().slice(0, 10);
  const { error: e1 } = await supabase.from("messages_historique").insert({
    prospect_id: prospectId,
    owner_id: user.id,
    contenu,
    canal,
    date: today,
  });
  if (e1) throw new Error(e1.message);
  const { error: e2 } = await supabase
    .from("prospects")
    .update({ statut: "contacte", date_contact: today })
    .eq("id", prospectId);
  if (e2) throw new Error(e2.message);
  revalidatePath("/app", "layout");
}
