"use client";

import { useState } from "react";
import {
  buildCarrouselPrompt,
  buildCommentairePrompt,
  buildPostPrompt,
  type PromptSet,
} from "@/lib/prompt";
import { ClaudeLink, CopyPromptButton } from "../_components/copy-prompt-button";

const inputCls =
  "w-full text-sm rounded-lg border border-border bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy/20";

type Onglet = "post" | "commentaire" | "carrousel";

const ONGLETS: { id: Onglet; label: string }[] = [
  { id: "post", label: "Post" },
  { id: "commentaire", label: "Commentaire" },
  { id: "carrousel", label: "Carrousel" },
];

export function ContenuStudio({ prompts }: { prompts: PromptSet }) {
  const [onglet, setOnglet] = useState<Onglet>("post");
  const [sujetPost, setSujetPost] = useState("");
  const [sujetCarrousel, setSujetCarrousel] = useState("");
  const [auteurPost, setAuteurPost] = useState("");
  const [contenuPost, setContenuPost] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="bg-white border border-border rounded-xl p-4 space-y-4">
      <div className="flex gap-1 text-sm font-semibold border-b border-border -mx-4 px-4">
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            onClick={() => {
              setOnglet(o.id);
              setError(null);
            }}
            className={`px-3 py-2 border-b-2 transition-colors ${
              onglet === o.id
                ? "border-navy text-navy"
                : "border-transparent text-[#8A8F98] hover:text-navy"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {onglet === "post" && (
        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold text-[#8A8F98] mb-1">Sujet du post</div>
            <textarea
              className={inputCls}
              rows={4}
              value={sujetPost}
              onChange={(e) => setSujetPost(e.target.value)}
              placeholder="Ce que vous voulez raconter. Laissez vide pour laisser Claude choisir parmi les quatre arguments de fond."
            />
          </div>
          <div className="flex items-center gap-3">
            <CopyPromptButton
              label="Copier le prompt post"
              onError={setError}
              build={() => ({ prompt: buildPostPrompt(prompts, sujetPost) })}
            />
            <ClaudeLink />
          </div>
        </div>
      )}

      {onglet === "commentaire" && (
        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold text-[#8A8F98] mb-1">
              Auteur du post (optionnel)
            </div>
            <input
              className={inputCls}
              value={auteurPost}
              onChange={(e) => setAuteurPost(e.target.value)}
              placeholder="Prénom Nom"
            />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#8A8F98] mb-1">
              Contenu du post sur lequel réagir
            </div>
            <textarea
              className={inputCls}
              rows={7}
              value={contenuPost}
              onChange={(e) => setContenuPost(e.target.value)}
              placeholder="Collez ici le texte du post…"
            />
          </div>
          <div className="flex items-center gap-3">
            <CopyPromptButton
              label="Copier le prompt commentaire"
              onError={setError}
              build={() =>
                contenuPost.trim()
                  ? { prompt: buildCommentairePrompt(prompts, contenuPost, auteurPost) }
                  : { error: "Collez d'abord le contenu du post sur lequel réagir." }
              }
            />
            <ClaudeLink />
          </div>
        </div>
      )}

      {onglet === "carrousel" && (
        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold text-[#8A8F98] mb-1">Sujet du carrousel</div>
            <textarea
              className={inputCls}
              rows={4}
              value={sujetCarrousel}
              onChange={(e) => setSujetCarrousel(e.target.value)}
              placeholder="Le thème des paires erreur / bon réflexe. Laissez vide pour laisser Claude choisir."
            />
          </div>
          <div className="flex items-center gap-3">
            <CopyPromptButton
              label="Copier le prompt carrousel"
              onError={setError}
              build={() => ({ prompt: buildCarrouselPrompt(prompts, sujetCarrousel) })}
            />
            <ClaudeLink />
          </div>
        </div>
      )}

      {error && (
        <div className="text-xs text-[#B0392B] bg-[#FBE9E7] rounded-lg px-3 py-2">{error}</div>
      )}
    </div>
  );
}
