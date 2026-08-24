"use client";

import { useState, useTransition } from "react";
import { RotateCcw, Save } from "lucide-react";
import { PROMPT_FIELDS, type PromptSet } from "@/lib/prompt";
import { DEFAULT_PROMPTS } from "@/lib/default-prompts";
import { savePrompts } from "./actions";

const textareaCls =
  "w-full text-sm rounded-lg border border-border bg-white px-3 py-2 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-navy/20";

export function PromptEditor({ initial }: { initial: PromptSet }) {
  const [draft, setDraft] = useState<PromptSet>(initial);
  const [saved, setSaved] = useState<PromptSet>(initial);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = PROMPT_FIELDS.some((f) => draft[f.key] !== saved[f.key]);

  function submit() {
    setMsg(null);
    startTransition(async () => {
      const res = await savePrompts(draft);
      if (res.ok) {
        setSaved(draft);
        setMsg({ kind: "ok", text: "Prompts enregistrés." });
      } else {
        setMsg({ kind: "err", text: res.error });
      }
    });
  }

  function reset() {
    if (!confirm("Remplacer vos prompts par les valeurs par défaut ? Vos modifications seront perdues.")) {
      return;
    }
    setDraft(DEFAULT_PROMPTS);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 sticky top-[104px] z-[5] bg-cream py-2">
        <button
          onClick={submit}
          disabled={pending || !dirty}
          className="flex items-center gap-1.5 bg-navy text-white text-sm font-semibold px-4 py-2 rounded-full disabled:opacity-40"
        >
          <Save size={15} />
          {pending ? "Enregistrement…" : dirty ? "Enregistrer" : "À jour"}
        </button>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#8A8F98] hover:text-navy px-3 py-2"
        >
          <RotateCcw size={13} /> Réinitialiser
        </button>
        {msg && (
          <span
            className={`text-xs font-semibold ${
              msg.kind === "ok" ? "text-[#1E7A4C]" : "text-[#B0392B]"
            }`}
          >
            {msg.text}
          </span>
        )}
      </div>

      {PROMPT_FIELDS.map((f) => (
        <div key={f.key} className="bg-white border border-border rounded-xl p-4">
          <div className="font-display font-bold text-sm mb-1">{f.label}</div>
          <p className="text-xs text-[#8A8F98] mb-2">{f.aide}</p>
          <textarea
            className={textareaCls}
            rows={f.rows}
            value={draft[f.key]}
            onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
          />
        </div>
      ))}
    </div>
  );
}
