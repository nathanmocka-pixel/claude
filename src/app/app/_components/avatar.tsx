import { initiales, nomCourt, type Membre } from "@/lib/domain";

const TAILLES = {
  sm: { px: 24, texte: "text-[10px]" },
  md: { px: 32, texte: "text-xs" },
  lg: { px: 56, texte: "text-lg" },
} as const;

// Les initiales restent le repli tant qu'un membre n'a pas mis sa photo :
// l'attribution doit rester lisible dès le premier jour, sans configuration.
export function Avatar({
  membre,
  taille = "md",
  titre,
}: {
  membre: Membre | undefined;
  taille?: keyof typeof TAILLES;
  titre?: string;
}) {
  const { px, texte } = TAILLES[taille];
  const label = titre ?? (membre ? nomCourt(membre.email) : "Inconnu");

  if (membre?.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- data URI, pas d'optimisation possible
      <img
        src={membre.avatar_url}
        alt={label}
        title={label}
        width={px}
        height={px}
        className="shrink-0 rounded-full object-cover bg-[#EEF0F3]"
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <span
      title={label}
      style={{ width: px, height: px }}
      className={`shrink-0 inline-flex items-center justify-center rounded-full bg-[#EEF0F3] text-[#5A6072] font-bold ${texte}`}
    >
      {membre ? initiales(membre.email) : "?"}
    </span>
  );
}
