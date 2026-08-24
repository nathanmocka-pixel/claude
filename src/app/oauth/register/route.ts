import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// RFC 7591. Claude s'enregistre ici tout seul lors du premier branchement du
// connecteur : il n'y a pas de client_id à créer à la main.

function erreur(code: string, description: string, status = 400) {
  return NextResponse.json({ error: code, error_description: description }, { status });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return erreur("invalid_client_metadata", "Corps de requête JSON invalide.");
  }

  const { redirect_uris, client_name, token_endpoint_auth_method } = (body ?? {}) as {
    redirect_uris?: unknown;
    client_name?: unknown;
    token_endpoint_auth_method?: unknown;
  };

  if (!Array.isArray(redirect_uris) || redirect_uris.length === 0) {
    return erreur("invalid_redirect_uri", "redirect_uris est requis et doit être une liste.");
  }

  // Les URI sont validées à l'enregistrement puis comparées à l'identique lors
  // de l'autorisation : un client ne peut pas se faire rediriger ailleurs.
  const uris: string[] = [];
  for (const uri of redirect_uris) {
    if (typeof uri !== "string") {
      return erreur("invalid_redirect_uri", "Chaque redirect_uri doit être une chaîne.");
    }
    let parsed: URL;
    try {
      parsed = new URL(uri);
    } catch {
      return erreur("invalid_redirect_uri", `URI de redirection invalide : ${uri}`);
    }
    const local = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    if (parsed.protocol !== "https:" && !local) {
      return erreur(
        "invalid_redirect_uri",
        `Une URI de redirection doit être en https, sauf en local : ${uri}`
      );
    }
    uris.push(uri);
  }

  if (
    typeof token_endpoint_auth_method === "string" &&
    token_endpoint_auth_method !== "none"
  ) {
    return erreur(
      "invalid_client_metadata",
      "Seule la méthode d'authentification client 'none' est acceptée : les clients sont publics et utilisent PKCE."
    );
  }

  const clientId = randomUUID();
  const admin = createSupabaseAdmin();
  const { error } = await admin.from("oauth_clients").insert({
    client_id: clientId,
    client_name: typeof client_name === "string" ? client_name : null,
    redirect_uris: uris,
    grant_types: ["authorization_code", "refresh_token"],
    token_endpoint_auth_method: "none",
  });
  if (error) {
    return erreur("server_error", `Enregistrement impossible : ${error.message}`, 500);
  }

  return NextResponse.json(
    {
      client_id: clientId,
      client_name: typeof client_name === "string" ? client_name : undefined,
      redirect_uris: uris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );
}
