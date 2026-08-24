"use client";

import { useRef, useState, useTransition } from "react";
import { Trash2, Upload } from "lucide-react";
import { AVATAR_MAX_OCTETS, AVATAR_TAILLE, type Membre } from "@/lib/domain";
import { Avatar } from "../_components/avatar";
import { saveAvatar } from "./actions";

// Recadre au centre en carré puis réduit à 96 px. C'est ce qui permet de
// stocker la photo dans une colonne texte plutôt que dans un bucket.
async function redimensionner(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const cote = Math.min(bitmap.width, bitmap.height);
  const dx = (bitmap.width - cote) / 2;
  const dy = (bitmap.height - cote) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_TAILLE;
  canvas.height = AVATAR_TAILLE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Impossible de préparer l'image.");
  ctx.drawImage(bitmap, dx, dy, cote, cote, 0, 0, AVATAR_TAILLE, AVATAR_TAILLE);
  bitmap.close();

  // On baisse la qualité tant que la data URI dépasse la limite.
  for (const qualite of [0.85, 0.7, 0.55, 0.4]) {
    const uri = canvas.toDataURL("image/jpeg", qualite);
    if (uri.length <= AVATAR_MAX_OCTETS) return uri;
  }
  throw new Error("Image trop lourde même après compression.");
}

export function AvatarForm({ membre }: { membre: Membre }) {
  const [apercu, setApercu] = useState<string | null>(membre.avatar_url ?? null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  function choisir(file: File | undefined) {
    if (!file) return;
    setMsg(null);
    if (!file.type.startsWith("image/")) {
      setMsg({ kind: "err", text: "Choisissez un fichier image." });
      return;
    }
    startTransition(async () => {
      try {
        const uri = await redimensionner(file);
        const res = await saveAvatar(uri);
        if (res.ok) {
          setApercu(uri);
          setMsg({ kind: "ok", text: "Photo enregistrée." });
        } else {
          setMsg({ kind: "err", text: res.error });
        }
      } catch (e) {
        setMsg({
          kind: "err",
          text: e instanceof Error ? e.message : "Impossible de traiter l'image.",
        });
      }
    });
  }

  function retirer() {
    setMsg(null);
    startTransition(async () => {
      const res = await saveAvatar(null);
      if (res.ok) {
        setApercu(null);
        setMsg({ kind: "ok", text: "Photo retirée." });
      } else {
        setMsg({ kind: "err", text: res.error });
      }
    });
  }

  return (
    <div className="bg-white border border-border rounded-xl p-4">
      <div className="font-display font-bold text-sm mb-1">Votre photo</div>
      <p className="text-xs text-[#8A8F98] mb-4">
        Elle apparaît sur les prospects que vous suivez, pour que votre binôme voie d&apos;un coup
        d&apos;œil qui s&apos;occupe de qui. L&apos;image est réduite à {AVATAR_TAILLE} pixels et
        recadrée au centre.
      </p>

      <div className="flex items-center gap-4">
        <Avatar membre={{ ...membre, avatar_url: apercu }} taille="lg" />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => input.current?.click()}
            disabled={pending}
            className="flex items-center gap-1.5 bg-navy text-white text-xs font-semibold px-3 py-2 rounded-full disabled:opacity-50"
          >
            <Upload size={13} />
            {pending ? "…" : apercu ? "Changer" : "Choisir une photo"}
          </button>
          {apercu && (
            <button
              onClick={retirer}
              disabled={pending}
              className="flex items-center gap-1.5 bg-white text-navy border border-border text-xs font-semibold px-3 py-2 rounded-full disabled:opacity-50"
            >
              <Trash2 size={13} /> Retirer
            </button>
          )}
        </div>
      </div>

      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          choisir(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {msg && (
        <div
          className={`text-xs rounded-lg px-3 py-2 mt-3 ${
            msg.kind === "ok" ? "bg-[#E8F3EC] text-[#1E7A4C]" : "bg-[#FBE9E7] text-[#B0392B]"
          }`}
        >
          {msg.text}
        </div>
      )}
    </div>
  );
}
