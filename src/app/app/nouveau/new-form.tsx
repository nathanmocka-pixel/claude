"use client";

import { useState, useTransition } from "react";
import { SECTEURS, PRIORITES, type Priorite } from "@/lib/domain";
import { createProspect } from "../actions";

const inputCls =
  "w-full text-sm rounded-lg border border-border bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-[#8A8F98] mb-1">{label}</div>
      {children}
    </div>
  );
}

export function NewProspectForm() {
  const [nom, setNom] = useState("");
  const [entreprise, setEntreprise] = useState("");
  const [poste, setPoste] = useState("");
  const [secteur, setSecteur] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [contact, setContact] = useState("");
  const [priorite, setPriorite] = useState<Priorite>("tiede");
  const [painPoint, setPainPoint] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim() || !entreprise.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await createProspect({
          nom,
          entreprise,
          poste,
          linkedin,
          contact,
          secteur,
          priorite,
          pain_point: painPoint,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Nom *">
        <input required className={inputCls} value={nom} onChange={(e) => setNom(e.target.value)} />
      </Field>
      <Field label="Entreprise *">
        <input
          required
          className={inputCls}
          value={entreprise}
          onChange={(e) => setEntreprise(e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Poste">
          <input className={inputCls} value={poste} onChange={(e) => setPoste(e.target.value)} />
        </Field>
        <Field label="Secteur">
          <select
            className={inputCls}
            value={secteur}
            onChange={(e) => setSecteur(e.target.value)}
          >
            <option value="">—</option>
            {SECTEURS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Lien LinkedIn">
        <input
          className={inputCls}
          value={linkedin}
          onChange={(e) => setLinkedin(e.target.value)}
        />
      </Field>
      <Field label="Email / téléphone">
        <input
          className={inputCls}
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
      </Field>
      <Field label="Priorité">
        <select
          className={inputCls}
          value={priorite}
          onChange={(e) => setPriorite(e.target.value as Priorite)}
        >
          {PRIORITES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Pain point détecté">
        <textarea
          className={inputCls}
          rows={2}
          value={painPoint}
          onChange={(e) => setPainPoint(e.target.value)}
        />
      </Field>
      {error && (
        <div className="text-xs text-[#B0392B] bg-[#FBE9E7] rounded-lg px-3 py-2">{error}</div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-navy text-white font-semibold text-sm py-2.5 rounded-lg disabled:opacity-50"
      >
        {pending ? "Ajout…" : "Ajouter le prospect"}
      </button>
    </form>
  );
}
