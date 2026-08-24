"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

const inputCls =
  "w-full text-sm rounded-lg border border-border bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy/20";

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("Identifiants invalides.");
        return;
      }
      router.replace(next && next.startsWith("/") ? next : "/app");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-[#8A8F98] mb-1 block">Email</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-[#8A8F98] mb-1 block">Mot de passe</label>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
        />
      </div>
      {error && (
        <div className="text-xs text-[#B0392B] bg-[#FBE9E7] rounded-lg px-3 py-2">{error}</div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-navy text-white font-semibold text-sm py-2.5 rounded-lg disabled:opacity-50"
      >
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
