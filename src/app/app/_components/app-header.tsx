"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Plus } from "lucide-react";
import type { Role } from "@/lib/domain";

export function AppHeader({
  email,
  role,
  aRelancerCount,
}: {
  email: string;
  role: Role;
  aRelancerCount: number;
}) {
  const pathname = usePathname();
  const tabs = [
    { href: "/app", label: "Prospects" },
    {
      href: "/app/relance",
      label: `À relancer${aRelancerCount ? ` (${aRelancerCount})` : ""}`,
      urgent: aRelancerCount > 0,
    },
    { href: "/app/signaux", label: "Signaux" },
    { href: "/app/dashboard", label: "Tableau de bord" },
    { href: "/app/contenu", label: "Contenu" },
    { href: "/app/prompt", label: "Prompts" },
    ...(role === "admin" ? [{ href: "/app/comptes", label: "Comptes" }] : []),
  ];

  return (
    <header className="border-b border-border bg-white sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
        <div>
          <div className="font-display font-extrabold text-lg tracking-tight text-navy">
            Nathan Mocka
          </div>
          <div className="text-xs text-[#8A8F98] font-medium">Prospection · {email}</div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/app/nouveau"
            className="flex items-center gap-1.5 bg-navy text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-[#233156]"
          >
            <Plus size={16} /> Prospect
          </Link>
          <form action="/logout" method="post">
            <button
              type="submit"
              title="Déconnexion"
              className="p-2 text-[#8A8F98] hover:text-navy"
            >
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-5 flex gap-1 text-sm font-semibold overflow-x-auto">
        {tabs.map((t) => {
          const active = t.href === "/app" ? pathname === "/app" : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`px-3 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
                active
                  ? "border-navy text-navy"
                  : "border-transparent text-[#8A8F98] hover:text-navy"
              } ${!active && t.urgent ? "text-[#B0392B]" : ""}`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
