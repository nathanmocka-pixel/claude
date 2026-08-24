import { initiales, nomCourt, type Membre } from "@/lib/domain";

// Avec une base partagée, savoir qui suit un prospect évite de le contacter
// deux fois. Le badge n'apparaît que pour les prospects des autres membres :
// sur ses propres fiches il n'apporterait rien.
export function OwnerBadge({
  ownerId,
  membres,
  currentUserId,
  format = "initiales",
}: {
  ownerId: string;
  membres: Map<string, Membre>;
  currentUserId: string;
  format?: "initiales" | "nom";
}) {
  if (ownerId === currentUserId) return null;
  const membre = membres.get(ownerId);
  if (!membre) return null;

  if (format === "nom") {
    return (
      <span className="text-xs text-[#8A8F98]">
        Suivi par <span className="font-semibold text-[#5A6072]">{nomCourt(membre.email)}</span>
      </span>
    );
  }

  return (
    <span
      title={`Suivi par ${nomCourt(membre.email)}`}
      className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#EEF0F3] text-[#5A6072] text-[10px] font-bold"
    >
      {initiales(membre.email)}
    </span>
  );
}
