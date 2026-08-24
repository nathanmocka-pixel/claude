import type { MessageHist, Prospect } from "./domain";

export type PromptSet = {
  contexte: string;
  regles_message: string;
  regles_relance: string;
  regles_post: string;
  regles_commentaire: string;
  regles_carrousel: string;
};

export const PROMPT_FIELDS: {
  key: keyof PromptSet;
  label: string;
  aide: string;
  rows: number;
}[] = [
  {
    key: "contexte",
    label: "Contexte de marque",
    aide: "Qui vous êtes, votre offre, votre positionnement, votre cible, vos exclusions et votre preuve client. Ce bloc est injecté dans tous les prompts.",
    rows: 18,
  },
  {
    key: "regles_message",
    label: "Règles — message de prospection",
    aide: "Ton, structure et interdits du message privé initial.",
    rows: 10,
  },
  {
    key: "regles_relance",
    label: "Règles — relance",
    aide: "Comment relancer un prospect resté sans réponse.",
    rows: 10,
  },
  {
    key: "regles_post",
    label: "Règles — post LinkedIn",
    aide: "Copywriting des posts : accroche, rythme, preuve, chute.",
    rows: 10,
  },
  {
    key: "regles_commentaire",
    label: "Règles — commentaire d'engagement",
    aide: "Ton des commentaires sous les posts des autres. Tutoiement, jamais de pitch.",
    rows: 10,
  },
  {
    key: "regles_carrousel",
    label: "Règles — carrousel",
    aide: "Structure et identité visuelle des carrousels éducatifs.",
    rows: 10,
  },
];

// Angle propre à chaque secteur, injecté automatiquement dans les prompts
// de message et de relance selon le secteur renseigné sur la fiche.
const SECTEUR_ANGLE: Record<string, string> = {
  "Conseil patrimonial":
    "Secteur prioritaire, c'est celui du seul cas client réel. Les douleurs typiques : outils séparés pour les clients, les contrats et le suivi de dossiers, double saisie entre eux, lettres de mission signées hors système, conformité à prouver. Le cas client reste interdit dans le message privé, mais il peut nourrir la précision du pain point.",
  Comptable:
    "Secteur adjacent au cas client réel. Les douleurs typiques : logiciel de production comptable qui ne parle pas à la GED, collecte des pièces client par mail, relances de pièces manquantes faites à la main, portail client absent ou imposé par l'éditeur. Ne jamais présenter le cas patrimonial comme un cas comptable.",
  Juridique:
    "Secteur adjacent au cas client réel. Les douleurs typiques : gestion des dossiers éclatée entre un outil de facturation, un outil de temps passé et des dossiers sur le disque partagé, échanges de pièces sensibles par mail, suivi d'échéances non centralisé. Ne jamais présenter le cas patrimonial comme un cas juridique.",
  "Autre PME":
    "Hors secteur du cas client. Rester sur l'angle générique de l'empilement d'outils : plusieurs abonnements qui se synchronisent mal, données saisies deux fois, personne qui ne sait plus où est l'information à jour. Ne jamais généraliser le cas patrimonial à ce secteur sans le dire explicitement.",
};

function angleSecteur(secteur: string | null | undefined) {
  if (!secteur) return "Secteur non précisé. Rester sur l'angle générique de l'empilement d'outils.";
  return SECTEUR_ANGLE[secteur] ?? "Secteur hors liste. Rester sur l'angle générique de l'empilement d'outils.";
}

function bloc(titre: string, corps: string) {
  return `${titre}\n\n${corps.trim()}`;
}

function assemble(parts: string[]) {
  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join("\n\n---\n\n");
}

function ficheProspect(p: Prospect) {
  const lignes = [
    `Prénom du contact : ${p.nom.split(" ")[0]}`,
    `Nom complet : ${p.nom}`,
    `Entreprise : ${p.entreprise}`,
    p.poste ? `Poste : ${p.poste}` : null,
    `Secteur : ${p.secteur || "non précisé"}`,
    p.signal ? `Signal qui a motivé l'ajout : ${p.signal}` : null,
    p.signal_date ? `Date du signal : ${p.signal_date}` : null,
    `Pain point détecté : ${p.pain_point || "non renseigné"}`,
    p.note ? `Note libre : ${p.note}` : null,
  ].filter(Boolean);
  return lignes.join("\n");
}

export function buildMessagePrompt(prompts: PromptSet, prospect: Prospect) {
  return assemble([
    prompts.contexte,
    prompts.regles_message,
    bloc("ANGLE DU SECTEUR", angleSecteur(prospect.secteur)),
    bloc("FICHE DU PROSPECT", ficheProspect(prospect)),
  ]);
}

export function buildRelancePrompt(
  prompts: PromptSet,
  prospect: Prospect,
  historique: MessageHist[]
) {
  const envoyes = historique
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((h, i) => `Message ${i + 1} du ${h.date} (${h.canal}) :\n${h.contenu}`)
    .join("\n\n");

  return assemble([
    prompts.contexte,
    prompts.regles_relance,
    bloc("ANGLE DU SECTEUR", angleSecteur(prospect.secteur)),
    bloc("FICHE DU PROSPECT", ficheProspect(prospect)),
    bloc(
      "MESSAGES DÉJÀ ENVOYÉS, À NE PAS RÉPÉTER",
      envoyes || "Aucun message enregistré dans l'historique."
    ),
  ]);
}

export function buildPostPrompt(prompts: PromptSet, sujet: string) {
  return assemble([
    prompts.contexte,
    prompts.regles_post,
    bloc("SUJET DU POST", sujet.trim() || "Sujet libre, à choisir parmi les quatre arguments de fond."),
  ]);
}

export function buildCommentairePrompt(prompts: PromptSet, contenuPost: string, auteur: string) {
  return assemble([
    prompts.contexte,
    prompts.regles_commentaire,
    bloc(
      "POST SUR LEQUEL RÉAGIR",
      `${auteur.trim() ? `Auteur : ${auteur.trim()}\n\n` : ""}${contenuPost.trim()}`
    ),
  ]);
}

export function buildCarrouselPrompt(prompts: PromptSet, sujet: string) {
  return assemble([
    prompts.contexte,
    prompts.regles_carrousel,
    bloc(
      "SUJET DU CARROUSEL",
      sujet.trim() || "Sujet libre, à choisir parmi les quatre arguments de fond."
    ),
  ]);
}
