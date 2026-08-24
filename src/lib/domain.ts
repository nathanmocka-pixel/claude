export type Statut = "a_qualifier" | "contacte" | "rdv" | "nrp" | "close" | "dead";
export type Priorite = "chaud" | "tiede" | "froid";
export type Role = "admin" | "member";

export const SEUIL_RELANCE = 5;

export const STATUTS: { id: Statut; label: string; color: string }[] = [
  { id: "a_qualifier", label: "À qualifier", color: "#8A8F98" },
  { id: "contacte", label: "Contacté", color: "#16213E" },
  { id: "rdv", label: "RDV pris", color: "#1E7A4C" },
  { id: "nrp", label: "NRP", color: "#B8862E" },
  { id: "close", label: "Close", color: "#1E7A4C" },
  { id: "dead", label: "Dead", color: "#B0392B" },
];

export const SECTEURS = ["Conseil patrimonial", "Comptable", "Juridique", "Autre PME"] as const;

export const PRIORITES: { id: Priorite; label: string; color: string }[] = [
  { id: "chaud", label: "Chaud", color: "#C4432B" },
  { id: "tiede", label: "Tiède", color: "#B8862E" },
  { id: "froid", label: "Froid", color: "#5A7A9E" },
];

// Ce qui a motivé l'ajout du prospect. L'offre d'emploi back office est le
// signal le plus fiable : daté, vérifiable, et directement exploitable pour
// construire le pain point du message.
export const SIGNAUX = [
  "Offre d'emploi admin / back office",
  "Plusieurs outils mentionnés",
  "Plainte sur la complexité de gestion",
  "Croissance rapide",
  "Multi-sites ou multi-marques",
  "Recommandation / réseau",
  "Autre",
] as const;

// Un signal de plus de 30 jours n'est plus un signal frais.
export const SEUIL_SIGNAL_FRAIS = 30;

export function statutMeta(id: Statut) {
  return STATUTS.find((s) => s.id === id) ?? STATUTS[0];
}

export function prioriteMeta(id: Priorite) {
  return PRIORITES.find((p) => p.id === id) ?? PRIORITES[1];
}

// Positif si la date est à venir, négatif si elle est passée, 0 aujourd'hui.
export function joursAvant(dateStr: string | null | undefined): number | null {
  const j = joursDepuis(dateStr);
  return j === null ? null : -j;
}

// Un prospect en RDV daté passe devant tout le reste, du rendez-vous le plus
// proche au plus lointain. Le reste garde l'ordre du dernier contact.
export function rangListe(p: { statut: Statut; date_rdv: string | null }) {
  if (p.statut !== "rdv") return 2;
  return p.date_rdv ? 0 : 1;
}

export function trierListe<T extends { statut: Statut; date_rdv: string | null; date_contact: string | null }>(
  prospects: T[]
): T[] {
  return prospects.slice().sort((a, b) => {
    const ra = rangListe(a);
    const rb = rangListe(b);
    if (ra !== rb) return ra - rb;
    if (ra === 0) return (a.date_rdv ?? "").localeCompare(b.date_rdv ?? "");
    return (b.date_contact ?? "").localeCompare(a.date_contact ?? "");
  });
}

export function joursDepuis(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export type Prospect = {
  id: string;
  owner_id: string;
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
  date_rdv: string | null;
  note: string | null;
  signal: string | null;
  signal_date: string | null;
  a_repondu: boolean;
  equipe_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Membre = { id: string; email: string; avatar_url?: string | null };

// Une photo redimensionnée à 96 px pèse quelques kilo-octets. Au-delà, on
// refuse : la colonne est lue à chaque affichage de la liste des prospects.
export const AVATAR_MAX_OCTETS = 60_000;
export const AVATAR_TAILLE = 96;

// "prenom.nom@domaine.fr" donne "prenom.nom", suffisant pour distinguer
// deux membres d'une même équipe sans afficher l'adresse entière.
export function nomCourt(email: string) {
  return email.split("@")[0];
}

export function initiales(email: string) {
  const base = nomCourt(email).replace(/[._-]+/g, " ").trim();
  const mots = base.split(/\s+/).filter(Boolean);
  if (mots.length === 0) return "?";
  if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase();
  return (mots[0][0] + mots[1][0]).toUpperCase();
}

export type MessageHist = {
  id: string;
  prospect_id: string;
  owner_id: string;
  date: string;
  contenu: string;
  canal: string;
  created_at: string;
};
