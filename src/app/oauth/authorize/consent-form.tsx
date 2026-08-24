"use client";

import { useTransition } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { autoriser, refuser, type ConsentParams } from "./actions";

export function ConsentForm({
  clientName,
  email,
  partageEquipe,
  params,
}: {
  clientName: string;
  email: string;
  partageEquipe: boolean;
  params: ConsentParams;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-cream">
      <div className="w-full max-w-md bg-white border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={18} className="text-navy" />
          <div className="font-display font-extrabold text-lg tracking-tight text-navy">
            Nathan Mocka
          </div>
        </div>
        <p className="text-sm text-[#5A6072] mb-4">
          <span className="font-semibold">{clientName}</span> demande à accéder à votre CRM.
        </p>

        <div className="bg-cream rounded-xl p-3 mb-4">
          <div className="text-xs font-semibold text-[#8A8F98] mb-2">
            Ce que cette application pourra faire
          </div>
          <ul className="space-y-1.5 text-sm text-[#2E3440]">
            {[
              "Lire vos prospects et leurs fiches",
              "Créer de nouveaux prospects",
              "Changer le statut d'un prospect",
              "Ajouter des notes de suivi",
            ].map((l) => (
              <li key={l} className="flex items-start gap-2">
                <Check size={14} className="text-[#1E7A4C] mt-0.5 shrink-0" />
                {l}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-[#8A8F98] mb-4">
          Connecté en tant que <span className="font-semibold text-[#5A6072]">{email}</span>.
          {partageEquipe
            ? " L'accès portera sur la base partagée de votre équipe, comme dans le CRM."
            : " L'accès portera sur vos propres prospects."}{" "}
          L&apos;application ne pourra jamais lire les prospects d&apos;une autre équipe, ni vos
          prompts.
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => startTransition(() => void autoriser(params))}
            disabled={pending}
            className="flex-1 bg-navy text-white font-semibold text-sm py-2.5 rounded-lg disabled:opacity-50"
          >
            {pending ? "…" : "Autoriser"}
          </button>
          <button
            onClick={() => startTransition(() => void refuser(params))}
            disabled={pending}
            className="flex-1 bg-white text-navy border border-border font-semibold text-sm py-2.5 rounded-lg disabled:opacity-50"
          >
            Refuser
          </button>
        </div>
      </div>
    </div>
  );
}
