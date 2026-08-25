import { nomCourt, type Membre } from "@/lib/domain";
import { Avatar } from "./avatar";

// Le visage apparaît sur toutes les fiches, y compris les siennes : c'est
// l'alternance des deux photos qui rend la liste lisible d'un coup d'œil.
// Ne montrer que celles des autres laissait des trous et cassait la lecture.
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
  const membre = membres.get(ownerId);
  if (!membre) return null;
  const soi = ownerId === currentUserId;
  const titre = soi ? "Vous" : `Suivi par ${nomCourt(membre.email)}`;

  if (format === "nom") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-[#8A8F98]">
        <Avatar membre={membre} taille="sm" titre={titre} />
        {soi ? (
          "Vous suivez ce prospect"
        ) : (
          <>
            Suivi par <span className="font-semibold text-[#5A6072]">{nomCourt(membre.email)}</span>
          </>
        )}
      </span>
    );
  }

  return <Avatar membre={membre} taille="md" titre={titre} />;
}
