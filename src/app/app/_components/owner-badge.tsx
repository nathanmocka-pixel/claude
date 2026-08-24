import { nomCourt, type Membre } from "@/lib/domain";
import { Avatar } from "./avatar";

// Avec une base partagée, savoir qui suit un prospect évite de le contacter
// deux fois. Le badge n'apparaît que pour les prospects des autres membres :
// sur ses propres fiches il n'apporterait rien.
export function OwnerBadge({
  ownerId,
  membres,
  currentUserId,
  format = "avatar",
}: {
  ownerId: string;
  membres: Map<string, Membre>;
  currentUserId: string;
  format?: "avatar" | "nom";
}) {
  if (ownerId === currentUserId) return null;
  const membre = membres.get(ownerId);
  if (!membre) return null;

  if (format === "nom") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-[#8A8F98]">
        <Avatar membre={membre} taille="sm" />
        Suivi par <span className="font-semibold text-[#5A6072]">{nomCourt(membre.email)}</span>
      </span>
    );
  }

  return <Avatar membre={membre} taille="md" titre={`Suivi par ${nomCourt(membre.email)}`} />;
}
