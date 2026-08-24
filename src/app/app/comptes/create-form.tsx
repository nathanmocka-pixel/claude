"use client";

import { useState, useTransition } from "react";
import { createAccount } from "./actions";
import type { Role } from "@/lib/domain";

const inputCls =
  "w-full text-sm rounded-lg border border-border bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy/20";

export function CreateAccountForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await createAccount({ email, password, role });
      if (res.ok) {
        setMsg({ kind: "ok", text: `Compte créé pour ${email}.` });
        setEmail("");
        setPassword("");
        setRole("member");
      } else {
        setMsg({ kind: "err", text: res.error });
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs font-semibold text-[#8A8F98] mb-1">Email</div>
          <input
            type="email"
            required
            className={inputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <div className="text-xs font-semibold text-[#8A8F98] mb-1">
            Mot de passe (min. 8)
          </div>
          <input
            type="text"
            required
            minLength={8}
            className={inputCls}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold text-[#8A8F98] mb-1">Rôle</div>
        <select
          className={inputCls}
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
        >
          <option value="member">Membre</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      {msg && (
        <div
          className={`text-xs rounded-lg px-3 py-2 ${
            msg.kind === "ok" ? "bg-[#E8F3EC] text-[#1E7A4C]" : "bg-[#FBE9E7] text-[#B0392B]"
          }`}
        >
          {msg.text}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-navy text-white font-semibold text-sm py-2.5 rounded-lg disabled:opacity-50"
      >
        {pending ? "Création…" : "Créer le compte"}
      </button>
    </form>
  );
}
