"use client";

import { useState } from "react";
import { ClipboardCopy, ExternalLink } from "lucide-react";

export function CopyPromptButton({
  label,
  build,
  variant = "primary",
  disabled = false,
  onError,
}: {
  label: string;
  // Retourne le prompt à copier, ou une chaîne d'erreur à afficher via onError.
  build: () => { prompt: string } | { error: string };
  variant?: "primary" | "ghost";
  disabled?: boolean;
  onError?: (message: string | null) => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copier() {
    onError?.(null);
    const res = build();
    if ("error" in res) {
      onError?.(res.error);
      return;
    }
    try {
      await navigator.clipboard.writeText(res.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onError?.(
        "Impossible d'accéder au presse-papier. Vérifiez que le site est autorisé à y écrire."
      );
    }
  }

  const cls =
    variant === "primary"
      ? "bg-navy text-white"
      : "bg-white text-navy border border-border hover:border-navy/30";

  return (
    <button
      onClick={copier}
      disabled={disabled}
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full disabled:opacity-40 disabled:cursor-not-allowed ${cls}`}
    >
      <ClipboardCopy size={13} />
      {copied ? "Copié" : label}
    </button>
  );
}

export function ClaudeLink({ variant = "text" }: { variant?: "text" | "button" }) {
  if (variant === "button") {
    return (
      <a
        href="https://claude.ai/new"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full bg-white text-navy border border-border hover:border-navy/30"
      >
        Ouvrir Claude.ai <ExternalLink size={12} />
      </a>
    );
  }
  return (
    <a
      href="https://claude.ai/new"
      target="_blank"
      rel="noreferrer"
      className="text-xs font-semibold text-navy underline whitespace-nowrap"
    >
      Ouvrir Claude.ai
    </a>
  );
}

export function Etape({
  numero,
  titre,
  children,
}: {
  numero: number;
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center">
        {numero}
      </div>
      <div className="min-w-0 flex-1 pb-1">
        <div className="text-sm font-semibold mb-2">{titre}</div>
        {children}
      </div>
    </div>
  );
}
