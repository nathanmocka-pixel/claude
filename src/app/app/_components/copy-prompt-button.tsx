"use client";

import { useState } from "react";
import { ClipboardCopy } from "lucide-react";

export function CopyPromptButton({
  label,
  build,
  variant = "primary",
  onError,
}: {
  label: string;
  // Retourne le prompt à copier, ou une chaîne d'erreur à afficher via onError.
  build: () => { prompt: string } | { error: string };
  variant?: "primary" | "ghost";
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
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${cls}`}
    >
      <ClipboardCopy size={13} />
      {copied ? "Copié" : label}
    </button>
  );
}

export function ClaudeLink() {
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
