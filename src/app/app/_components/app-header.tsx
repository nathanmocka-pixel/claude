"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Plus } from "lucide-react";
import type { Membre, Role } from "@/lib/domain";
import { Avatar } from "./avatar";

export function AppHeader({
  membre,
  role,
  aRelancerCount,
  prospectsCount,
}: {
  membre: Membre;
  role: Role;
  aRelancerCount: number;
  prospectsCount: number;
}) {
  const pathname = usePathname();
  const tabs = [
    { href: "/app", label: `Prospects${prospectsCount ? ` (${prospectsCount})` : ""}` },
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
      <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display font-extrabold text-lg tracking-tight text-navy">
            Nathan Mocka
          </div>
          <div className="text-xs text-[#8A8F98] font-medium truncate">
            Prospection · {membre.email}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/app/nouveau"
            className="flex items-center gap-1.5 bg-navy text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-[#233156]"
          >
            <Plus size={16} /> Prospect
          </Link>
          {/* La photo sert d'accès au profil : pas d'onglet en plus dans une
              barre déjà chargée, et l'endroit où la changer est celui où on
              la voit. */}
          <Link href="/app/profil" title="Mon profil" className="shrink-0">
            <Avatar membre={membre} taille="md" titre="Mon profil" />
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
