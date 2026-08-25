"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, ExternalLink, Trash2 } from "lucide-react";
import {
  PRIORITES,
  SECTEURS,
  SIGNAUX,
  STATUTS,
  nomCourt,
  statutMeta,
  type Membre,
  type MessageHist,
  type Priorite,
  type Prospect,
  type Statut,
} from "@/lib/domain";
import { buildMessagePrompt, buildRelancePrompt, type PromptSet } from "@/lib/prompt";
import { Avatar } from "../../_components/avatar";
import { JoursBadge, RdvBadge } from "../../_components/badges";
import { ClaudeLink, CopyPromptButton, Etape } from "../../_components/copy-prompt-button";
import { HistoriqueItem } from "./historique-item";
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
  prompts,
  membres,
  currentUserId,
}: {
  prospect: Prospect;
  historique: MessageHist[];
  prompts: PromptSet;
  membres: Membre[];
  currentUserId: string;
}) {
  const membreParId = new Map(membres.map((m) => [m.id, m]));
  const proprietaire = membreParId.get(prospect.owner_id);
  const suiviParAutre = prospect.owner_id !== currentUserId && proprietaire;
  const [local, setLocal] = useState(prospect);
  const [draft, setDraft] = useState("");
  const [consigne, setConsigne] = useState("");
  const [promptError, setPromptError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function save<K extends keyof Prospect>(patch: Partial<Pick<Prospect, K>>) {
    setLocal((prev) => ({ ...prev, ...patch }));
    startTransition(() => {
      updateProspect(local.id, patch).catch(() => {
        // revert on failure would be nicer; keep simple: refresh to re-sync
      });
    });
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
  const dejaContacte = historique.length > 0;

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
        {proprietaire && (
          <Avatar
            membre={proprietaire}
            taille="md"
            titre={suiviParAutre ? `Suivi par ${nomCourt(proprietaire.email)}` : "Vous"}
          />
        )}
        <button onClick={onDelete} className="text-[#B4B7BD] hover:text-[#B0392B]">
          <Trash2 size={16} />
        </button>
      </div>

      {suiviParAutre && (
        <div className="flex items-center gap-2.5 text-xs bg-[#FFF6E5] text-[#8A6410] border border-[#F0DFB8] rounded-lg px-3 py-2 mb-4">
          <Avatar membre={proprietaire} taille="md" />
          <span>
            Ce prospect est suivi par{" "}
            <span className="font-semibold">{nomCourt(proprietaire.email)}</span>. Vous pouvez le
            modifier, mais vérifiez son historique avant de lui écrire.
          </span>
        </div>
      )}

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
        {local.statut === "rdv" && local.date_rdv ? (
          <RdvBadge dateRdv={local.date_rdv} />
        ) : (
          <JoursBadge dateContact={local.date_contact} statut={local.statut} />
        )}
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
        <label className="flex items-center gap-1.5 text-xs font-semibold text-[#5A6072] cursor-pointer">
          <input
            type="checkbox"
            checked={local.a_repondu}
            onChange={(e) => save({ a_repondu: e.target.checked })}
            className="accent-[#16213E]"
          />
          A répondu
        </label>
      </div>

      {local.statut === "rdv" && !local.date_rdv && (
        <div className="text-xs bg-[#E8F3EC] text-[#1E7A4C] border border-[#C6E3D2] rounded-lg px-3 py-2 mb-4">
          Renseignez la date du RDV ci-dessous : c&apos;est elle qui fait remonter le prospect en
          tête de la liste.
        </div>
      )}

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
        <Field label="Date du RDV">
          <input
            type="date"
            className={inputCls}
            value={local.date_rdv ?? ""}
            onChange={(e) => save({ date_rdv: e.target.value || null })}
          />
        </Field>
        <Field label="Signal détecté">
          <select
            className={inputCls}
            value={local.signal ?? ""}
            onChange={(e) => save({ signal: e.target.value || null })}
          >
            <option value="">—</option>
            {SIGNAUX.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Date du signal">
          <input
            type="date"
            className={inputCls}
            value={local.signal_date ?? ""}
            onChange={(e) => save({ signal_date: e.target.value || null })}
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

      <div className="bg-white border border-border rounded-xl p-4 mb-5 space-y-4">
        <div>
          <div className="font-display font-bold text-sm">Rédiger un message</div>
          <p className="text-xs text-[#8A8F98]">
            {dejaContacte
              ? "Ce prospect a déjà été contacté, la relance est l'étape logique."
              : "Premier contact avec ce prospect."}
          </p>
        </div>

        <Etape numero={1} titre="Copier le prompt">
          <textarea
            className={`${inputCls} mb-2`}
            rows={2}
            value={consigne}
            onChange={(e) => setConsigne(e.target.value)}
            placeholder="Consigne pour ce message uniquement (optionnel). Par exemple : insister sur la double saisie, rester très court, mentionner qu'on s'est croisés à un événement…"
          />
          <div className="flex flex-wrap items-center gap-2">
            <CopyPromptButton
              label="Premier message"
              variant={dejaContacte ? "ghost" : "primary"}
              disabled={!local.pain_point}
              onError={setPromptError}
              build={() => ({ prompt: buildMessagePrompt(prompts, local, consigne) })}
            />
            <CopyPromptButton
              label="Relance"
              variant={dejaContacte ? "primary" : "ghost"}
              disabled={!dejaContacte}
              onError={setPromptError}
              build={() => ({
                prompt: buildRelancePrompt(prompts, local, historique, consigne),
              })}
            />
          </div>
          <p className="text-xs text-[#8A8F98] mt-2">
            {!local.pain_point
              ? "Renseignez le pain point détecté plus haut pour activer le premier message."
              : !dejaContacte
                ? "La relance s'activera une fois un premier message enregistré à l'étape 3."
                : "La relance reprend les messages déjà envoyés pour ne pas les répéter."}
          </p>
        </Etape>

        <Etape numero={2} titre="Coller dans Claude.ai">
          <ClaudeLink variant="button" />
          <p className="text-xs text-[#8A8F98] mt-2">
            Collez le prompt tel quel dans une nouvelle conversation, puis copiez la réponse.
          </p>
        </Etape>

        <Etape numero={3} titre="Enregistrer le message envoyé">
          <textarea
            className={inputCls}
            rows={5}
            placeholder="Collez ici le message renvoyé par Claude, ou rédigez-le à la main…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            onClick={marquerEnvoye}
            disabled={!draft.trim()}
            className="mt-2 text-xs font-semibold px-3 py-2 rounded-full bg-navy text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Enregistrer dans l&apos;historique
          </button>
          <p className="text-xs text-[#8A8F98] mt-2">
            Le prospect passe en Contacté et la date du jour est enregistrée. Rien n&apos;est
            envoyé automatiquement à votre place.
          </p>
        </Etape>

        {promptError && (
          <div className="text-xs text-[#B0392B] bg-[#FBE9E7] rounded-lg px-3 py-2">
            {promptError}
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
              <HistoriqueItem
                key={h.id}
                message={h}
                membreParId={membreParId}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
