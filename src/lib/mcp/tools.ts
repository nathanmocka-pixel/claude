import "server-only";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { STATUTS, type Statut } from "@/lib/domain";

// Le jeton MCP n'est pas un JWT Supabase, la RLS ne peut donc pas s'appliquer
// d'elle-même : les requêtes passent par la clé service role. C'est pourquoi
// chaque requête de ce fichier porte un filtre equipe_id explicite, et que les
// lectures d'une fiche revérifient l'appartenance avant de rendre la main.
// Aucune fonction ici ne construit de requête sans ce filtre.

export type Contexte = { userId: string; equipeId: string | null };

const STATUT_IDS = STATUTS.map((s) => s.id) as [Statut, ...Statut[]];

export const schemas = {
  create_prospect: {
    nom: z.string().min(1).describe("Prénom et nom du contact"),
    entreprise: z.string().min(1).describe("Nom de l'entreprise"),
    linkedin: z.string().url().optional().describe("URL du profil LinkedIn"),
    notes: z.string().optional().describe("Notes libres sur ce prospect"),
    secteur: z
      .string()
      .optional()
      .describe("Secteur : Conseil patrimonial, Comptable, Juridique ou Autre PME"),
    pain_point: z
      .string()
      .optional()
      .describe("Le problème identifié qui justifie un message personnalisé"),
  },
  update_prospect_status: {
    id: z.string().uuid().describe("Identifiant du prospect"),
    statut: z.enum(STATUT_IDS).describe("Nouveau statut dans le pipeline"),
    date_rdv: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe("Date du rendez-vous au format AAAA-MM-JJ, à renseigner avec le statut rdv"),
  },
  list_prospects: {
    statut: z.enum(STATUT_IDS).optional().describe("Filtre optionnel par statut"),
    recherche: z.string().optional().describe("Filtre optionnel sur le nom ou l'entreprise"),
    limite: z.number().int().min(1).max(100).optional().describe("Nombre maximum de résultats"),
  },
  get_prospect: {
    id: z.string().uuid().describe("Identifiant du prospect"),
  },
  add_note: {
    id: z.string().uuid().describe("Identifiant du prospect"),
    note: z.string().min(1).describe("Note de suivi à ajouter"),
  },
};

export class ErreurOutil extends Error {}

function exigeEquipe(ctx: Contexte) {
  if (!ctx.equipeId) {
    throw new ErreurOutil(
      "Votre compte n'est rattaché à aucune équipe. Ouvrez le CRM une fois, puis réessayez."
    );
  }
  return ctx.equipeId;
}

const CHAMPS =
  "id, nom, entreprise, poste, linkedin, contact, secteur, statut, priorite, pain_point, date_contact, date_rdv, note, signal, signal_date, a_repondu, owner_id, created_at, updated_at";

export async function createProspect(ctx: Contexte, args: {
  nom: string;
  entreprise: string;
  linkedin?: string;
  notes?: string;
  secteur?: string;
  pain_point?: string;
}) {
  const equipeId = exigeEquipe(ctx);
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("prospects")
    .insert({
      owner_id: ctx.userId,
      equipe_id: equipeId,
      nom: args.nom.trim(),
      entreprise: args.entreprise.trim(),
      linkedin: args.linkedin ?? null,
      note: args.notes ?? null,
      secteur: args.secteur ?? null,
      pain_point: args.pain_point ?? null,
      statut: "a_qualifier",
    })
    .select(CHAMPS)
    .single();
  if (error) throw new ErreurOutil(`Création impossible : ${error.message}`);
  return data;
}

export async function listProspects(ctx: Contexte, args: {
  statut?: Statut;
  recherche?: string;
  limite?: number;
}) {
  const equipeId = exigeEquipe(ctx);
  const admin = createSupabaseAdmin();
  let q = admin
    .from("prospects")
    .select(CHAMPS)
    .eq("equipe_id", equipeId)
    .order("updated_at", { ascending: false })
    .limit(args.limite ?? 25);
  if (args.statut) q = q.eq("statut", args.statut);
  if (args.recherche?.trim()) {
    const terme = `%${args.recherche.trim()}%`;
    q = q.or(`nom.ilike.${terme},entreprise.ilike.${terme}`);
  }
  const { data, error } = await q;
  if (error) throw new ErreurOutil(`Lecture impossible : ${error.message}`);
  return data ?? [];
}

// Toute lecture d'une fiche passe par ici : le filtre équipe est dans la
// requête, donc un identifiant appartenant à une autre équipe ne renvoie rien
// et l'appelant ne peut pas distinguer « inexistant » de « pas à vous ».
async function chargerFiche(equipeId: string, id: string) {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("prospects")
    .select(CHAMPS)
    .eq("id", id)
    .eq("equipe_id", equipeId)
    .maybeSingle();
  if (error) throw new ErreurOutil(`Lecture impossible : ${error.message}`);
  if (!data) throw new ErreurOutil(`Aucun prospect accessible avec l'identifiant ${id}.`);
  return data;
}

export async function getProspect(ctx: Contexte, args: { id: string }) {
  const equipeId = exigeEquipe(ctx);
  const fiche = await chargerFiche(equipeId, args.id);

  const admin = createSupabaseAdmin();
  const { data: historique } = await admin
    .from("messages_historique")
    .select("id, date, canal, contenu")
    .eq("prospect_id", args.id)
    .eq("equipe_id", equipeId)
    .order("date", { ascending: false });

  return { ...fiche, historique: historique ?? [] };
}

export async function updateProspectStatus(
  ctx: Contexte,
  args: { id: string; statut: Statut; date_rdv?: string }
) {
  const equipeId = exigeEquipe(ctx);
  await chargerFiche(equipeId, args.id);

  const admin = createSupabaseAdmin();
  const patch: Record<string, unknown> = { statut: args.statut };
  // Passer un prospect en contacté sans date fausserait la vue des relances.
  if (args.statut === "contacte") {
    patch.date_contact = new Date().toISOString().slice(0, 10);
  }
  if (args.date_rdv) patch.date_rdv = args.date_rdv;

  const { data, error } = await admin
    .from("prospects")
    .update(patch)
    .eq("id", args.id)
    .eq("equipe_id", equipeId)
    .select(CHAMPS)
    .single();
  if (error) throw new ErreurOutil(`Mise à jour impossible : ${error.message}`);
  return data;
}

export async function addNote(ctx: Contexte, args: { id: string; note: string }) {
  const equipeId = exigeEquipe(ctx);
  const fiche = await chargerFiche(equipeId, args.id);

  // Les notes s'empilent avec leur date plutôt que de s'écraser : une note de
  // suivi n'a d'intérêt que si l'on sait quand elle a été prise.
  const jour = new Date().toISOString().slice(0, 10);
  const ligne = `[${jour}] ${args.note.trim()}`;
  const note = fiche.note ? `${fiche.note}\n${ligne}` : ligne;

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("prospects")
    .update({ note })
    .eq("id", args.id)
    .eq("equipe_id", equipeId)
    .select(CHAMPS)
    .single();
  if (error) throw new ErreurOutil(`Ajout de la note impossible : ${error.message}`);
  return data;
}
