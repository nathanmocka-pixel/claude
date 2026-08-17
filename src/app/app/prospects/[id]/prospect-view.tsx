"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, ExternalLink, Sparkles, Trash2 } from "lucide-react";
import {
  PRIORITES,
  SECTEURS,
  STATUTS,
  statutMeta,
  type MessageHist,
  type Priorite,
  type Prospect,
  type Statut,
} from "@/lib/domain";
import { JoursBadge } from "../../_components/badges";
import {
  addHistorique,
  deleteProspect,
  marquerContacte,
  updateProspect,
} from "../../actions";

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

export function ProspectView({
  prospect,
  historique,
}: {
  prospect: Prospect;
  historique: MessageHist[];
}) {
  const [local, setLocal] = useState(prospect);
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function save<K extends keyof Prospect>(patch: Partial<Pick<Prospect, K>>) {
    setLocal((prev) => ({ ...prev, ...patch }));
    startTransition(() => {
      updateProspect(local.id, patch).catch(() => {
        // revert on failure would be nicer; keep simple: refresh to re-sync
      });
    });
  }

  async function genererMessage() {
    if (!local.pain_point) {
      setGenError("Renseignez d'abord le pain point détecté.");
      return;
    }
    setGenerating(true);
    setGenError(null);
    try {
      const r = await fetch("/api/generate-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom: local.nom.split(" ")[0],
          entreprise: local.entreprise,
          secteur: local.secteur ?? "non précisé",
          painPoint: local.pain_point,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Erreur de génération");
      setDraft(data.message ?? "");
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Erreur de génération");
    } finally {
      setGenerating(false);
    }
  }

  function marquerEnvoye() {
    if (!draft.trim()) return;
    startTransition(async () => {
      await addHistorique(local.id, draft.trim());
      setDraft("");
      setLocal((prev) => ({
        ...prev,
        statut: "contacte",
        date_contact: new Date().toISOString().slice(0, 10),
      }));
    });
  }

  function onDelete() {
    if (!confirm("Supprimer définitivement ce prospect ?")) return;
    startTransition(() => {
      deleteProspect(local.id);
    });
  }

  const st = statutMeta(local.statut);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link href="/app" className="text-[#8A8F98] hover:text-navy">
          <ChevronLeft size={20} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="font-display font-bold truncate">{local.nom}</div>
          <div className="text-xs text-[#8A8F98] truncate">{local.entreprise}</div>
        </div>
        <button onClick={onDelete} className="text-[#B4B7BD] hover:text-[#B0392B]">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <select
          value={local.statut}
          onChange={(e) => save({ statut: e.target.value as Statut })}
          className="text-xs font-bold rounded-full px-3 py-1.5 border-0 cursor-pointer"
          style={{ backgroundColor: st.color + "18", color: st.color }}
        >
          {STATUTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <JoursBadge dateContact={local.date_contact} statut={local.statut} />
        {local.statut === "a_qualifier" && (
          <button
            onClick={() => {
              const today = new Date().toISOString().slice(0, 10);
              setLocal((prev) => ({ ...prev, statut: "contacte", date_contact: today }));
              startTransition(() => marquerContacte(local.id));
            }}
            className="text-xs font-semibold text-white bg-navy px-3 py-1.5 rounded-full"
          >
            Marquer contacté
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Field label="Poste">
          <input
            className={inputCls}
            value={local.poste ?? ""}
            onChange={(e) => setLocal((p) => ({ ...p, poste: e.target.value }))}
            onBlur={(e) => save({ poste: e.target.value || null })}
          />
        </Field>
        <Field label="Secteur">
          <select
            className={inputCls}
            value={local.secteur ?? ""}
            onChange={(e) => save({ secteur: e.target.value || null })}
          >
            <option value="">—</option>
            {SECTEURS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Email / téléphone">
          <input
            className={inputCls}
            value={local.contact ?? ""}
            onChange={(e) => setLocal((p) => ({ ...p, contact: e.target.value }))}
            onBlur={(e) => save({ contact: e.target.value || null })}
          />
        </Field>
        <Field label="Priorité">
          <select
            className={inputCls}
            value={local.priorite}
            onChange={(e) => save({ priorite: e.target.value as Priorite })}
          >
            {PRIORITES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Lien LinkedIn">
          <div className="flex gap-1.5">
            <input
              className={inputCls}
              value={local.linkedin ?? ""}
              onChange={(e) => setLocal((p) => ({ ...p, linkedin: e.target.value }))}
              onBlur={(e) => save({ linkedin: e.target.value || null })}
            />
            {local.linkedin && (
              <a
                href={local.linkedin}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 flex items-center px-2 text-[#8A8F98]"
              >
                <ExternalLink size={15} />
              </a>
            )}
          </div>
        </Field>
        <Field label="Date dernier contact">
          <input
            type="date"
            className={inputCls}
            value={local.date_contact ?? ""}
            onChange={(e) => save({ date_contact: e.target.value || null })}
          />
        </Field>
      </div>

      <div className="mb-4">
        <Field label="Pain point détecté">
          <textarea
            className={inputCls}
            rows={2}
            value={local.pain_point ?? ""}
            onChange={(e) => setLocal((p) => ({ ...p, pain_point: e.target.value }))}
            onBlur={(e) => save({ pain_point: e.target.value || null })}
            placeholder="Ce qui justifie le message personnalisé…"
          />
        </Field>
      </div>

      <div className="mb-4">
        <Field label="Note libre">
          <textarea
            className={inputCls}
            rows={2}
            value={local.note ?? ""}
            onChange={(e) => setLocal((p) => ({ ...p, note: e.target.value }))}
            onBlur={(e) => save({ note: e.target.value || null })}
          />
        </Field>
      </div>

      <div className="bg-white border border-border rounded-xl p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="font-display font-bold text-sm">Générer un message</div>
          <button
            onClick={genererMessage}
            disabled={generating}
            className="flex items-center gap-1.5 text-xs font-semibold bg-navy text-white px-3 py-1.5 rounded-full disabled:opacity-50"
          >
            <Sparkles size={13} /> {generating ? "Génération…" : "Générer"}
          </button>
        </div>
        {genError && (
          <div className="text-xs text-[#B0392B] bg-[#FBE9E7] rounded-lg px-3 py-2 mb-2">
            {genError}
          </div>
        )}
        {draft ? (
          <div className="space-y-2">
            <textarea
              className={inputCls}
              rows={5}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button
              onClick={marquerEnvoye}
              className="text-xs font-semibold text-navy underline"
            >
              Marquer comme envoyé (ajoute à l&apos;historique)
            </button>
          </div>
        ) : (
          <div className="text-xs text-[#B4B7BD]">
            Brouillon à valider manuellement. Jamais envoyé automatiquement.
          </div>
        )}
      </div>

      <div>
        <div className="font-display font-bold text-sm mb-2">Historique des messages</div>
        {historique.length === 0 ? (
          <div className="text-xs text-[#B4B7BD]">Aucun message enregistré.</div>
        ) : (
          <div className="space-y-2">
            {historique.map((h) => (
              <div key={h.id} className="bg-white border border-border rounded-lg p-3">
                <div className="text-[11px] text-[#8A8F98] font-semibold mb-1">
                  {h.date} · {h.canal}
                </div>
                <div className="text-sm text-[#2E3440] whitespace-pre-wrap">{h.contenu}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
