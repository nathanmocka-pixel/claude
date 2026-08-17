import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `Tu rédiges un message de prospection LinkedIn au nom de Nathan. Nathan aide les PME et cabinets de conseil (patrimonial, comptable, juridique en priorité) à cesser de dépendre d'un empilement d'outils logiciels à abonnement pour construire à la place un système sur mesure qu'ils possèdent réellement, avec conseil stratégique en amont et automatisation des process autour.

Règles strictes de ton et de forme :
- Vouvoiement.
- Phrases courtes.
- Aucune formule marketing creuse. Interdits notamment : révolutionner, booster, propulser.
- Aucun tiret visible, aucune flèche graphique, aucune bulle de chat.
- Ne jamais mentionner "Nathan Mocka" par son nom dans le message.
- Ne jamais proposer d'appel.
- Toujours finir par une question ouverte, adaptée au niveau de proximité.
- Aucune statistique inventée, aucun faux client, aucun chiffre non vérifiable.

Format demandé : exactement trois phrases.
1) Une accroche courte qui reflète le pain point spécifique fourni, sans le paraphraser mot pour mot.
2) La solution : une plateforme sur mesure qui remplace cet empilement, moins chère sur la durée, possédée définitivement par l'entreprise.
3) Une question de clôture ouverte.

Réponds uniquement avec le message final, sans guillemets, sans commentaire, sans en-tête.`;

export async function POST(request: Request) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY manquante" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const { prenom, entreprise, secteur, painPoint } = body as {
    prenom?: string;
    entreprise?: string;
    secteur?: string;
    painPoint?: string;
  };

  if (!prenom || !entreprise || !painPoint) {
    return NextResponse.json(
      { error: "prenom, entreprise et painPoint requis" },
      { status: 400 }
    );
  }

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Prénom du contact : ${prenom}
Entreprise : ${entreprise}
Secteur : ${secteur ?? "non précisé"}
Pain point détecté : ${painPoint}`,
        },
      ],
    });

    const text = response.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();

    return NextResponse.json({ message: text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
