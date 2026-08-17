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

export function statutMeta(id: Statut) {
  return STATUTS.find((s) => s.id === id) ?? STATUTS[0];
}

export function prioriteMeta(id: Priorite) {
  return PRIORITES.find((p) => p.id === id) ?? PRIORITES[1];
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
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageHist = {
  id: string;
  prospect_id: string;
  owner_id: string;
  date: string;
  contenu: string;
  canal: string;
  created_at: string;
};
