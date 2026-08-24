"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { nomCourt, type Membre, type MessageHist } from "@/lib/domain";
import { deleteHistorique, updateHistorique } from "../../actions";

const inputCls =
  "w-full text-sm rounded-lg border border-border bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy/20";

export function HistoriqueItem({
  message,
  membreParId,
  currentUserId,
}: {
  message: MessageHist;
  membreParId: Map<string, Membre>;
  currentUserId: string;
}) {
  const [edition, setEdition] = useState(false);
  const [texte, setTexte] = useState(message.contenu);
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const auteur =
    message.owner_id !== currentUserId && membreParId.has(message.owner_id)
      ? nomCourt(membreParId.get(message.owner_id)!.email)
      : null;

  function enregistrer() {
    if (!texte.trim()) {
      setErreur("Le message ne peut pas être vide.");
      return;
    }
    setErreur(null);
    startTransition(async () => {
      try {
        await updateHistorique(message.id, message.prospect_id, texte);
        setEdition(false);
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur à l'enregistrement.");
      }
    });
  }

  function annuler() {
    setTexte(message.contenu);
    setErreur(null);
    setEdition(false);
  }

  function supprimer() {
    if (!confirm("Supprimer ce message de l'historique ?")) return;
    startTransition(async () => {
      try {
        await deleteHistorique(message.id, message.prospect_id);
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur à la suppression.");
      }
    });
  }

  return (
    <div className="bg-white border border-border rounded-lg p-3">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="text-[11px] text-[#8A8F98] font-semibold">
          {message.date} · {message.canal}
          {auteur ? ` · ${auteur}` : ""}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {edition ? (
            <>
              <button
                onClick={enregistrer}
                disabled={pending}
                title="Enregistrer"
                className="text-[#1E7A4C] hover:opacity-70 disabled:opacity-40"
              >
                <Check size={14} />
              </button>
              <button
                onClick={annuler}
                disabled={pending}
                title="Annuler"
                className="text-[#8A8F98] hover:text-navy disabled:opacity-40"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEdition(true)}
                title="Corriger ce message"
                className="text-[#B4B7BD] hover:text-navy"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={supprimer}
                disabled={pending}
                title="Supprimer ce message"
                className="text-[#B4B7BD] hover:text-[#B0392B] disabled:opacity-40"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {edition ? (
        <textarea
          className={inputCls}
          rows={5}
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          autoFocus
        />
      ) : (
        <div className="text-sm text-[#2E3440] whitespace-pre-wrap">{message.contenu}</div>
      )}

      {erreur && (
        <div className="text-xs text-[#B0392B] bg-[#FBE9E7] rounded-lg px-3 py-2 mt-2">
          {erreur}
        </div>
      )}
    </div>
  );
}
