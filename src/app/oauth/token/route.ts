import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  ACCESS_TOKEN_TTL,
  consumeRefreshToken,
  equipeDe,
  issueRefreshToken,
  purgeExpired,
  resourceIdentifier,
  signAccessToken,
  verifyPkce,
} from "@/lib/mcp/oauth";

export const dynamic = "force-dynamic";

function erreur(code: string, description: string, status = 400) {
  return NextResponse.json(
    { error: code, error_description: description },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

function succes(payload: Record<string, unknown>) {
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
  });
}

export async function POST(request: Request) {
  let form: URLSearchParams;
  const type = request.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) {
      form = new URLSearchParams(Object.entries(await request.json()) as [string, string][]);
    } else {
      form = new URLSearchParams(await request.text());
    }
  } catch {
    return erreur("invalid_request", "Corps de requête illisible.");
  }

  // Purge opportuniste : évite une tâche planifiée pour un volume négligeable.
  purgeExpired().catch(() => {});

  const grantType = form.get("grant_type");
  if (grantType === "authorization_code") return echangerCode(form);
  if (grantType === "refresh_token") return rafraichir(form);
  return erreur(
    "unsupported_grant_type",
    "Seuls authorization_code et refresh_token sont acceptés."
  );
}

async function echangerCode(form: URLSearchParams) {
  const code = form.get("code");
  const clientId = form.get("client_id");
  const redirectUri = form.get("redirect_uri");
  const verifier = form.get("code_verifier");

  if (!code || !clientId || !redirectUri || !verifier) {
    return erreur(
      "invalid_request",
      "code, client_id, redirect_uri et code_verifier sont tous requis."
    );
  }

  const admin = createSupabaseAdmin();
  const { data: row } = await admin
    .from("oauth_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (!row) return erreur("invalid_grant", "Code d'autorisation inconnu ou déjà utilisé.");

  // Usage unique : consommé avant toute validation, pour qu'un code rejoué
  // échoue même si la validation qui suit prend du temps.
  await admin.from("oauth_codes").delete().eq("code", code);

  if (new Date(row.expires_at).getTime() < Date.now()) {
    return erreur("invalid_grant", "Code d'autorisation expiré.");
  }
  if (row.client_id !== clientId) {
    return erreur("invalid_grant", "Ce code a été émis pour un autre client.");
  }
  if (row.redirect_uri !== redirectUri) {
    return erreur("invalid_grant", "redirect_uri ne correspond pas à celle de l'autorisation.");
  }
  if (!verifyPkce(verifier, row.code_challenge, row.code_challenge_method)) {
    return erreur("invalid_grant", "Vérification PKCE en échec.");
  }

  const equipeId = await equipeDe(row.user_id);
  const accessToken = await signAccessToken({
    sub: row.user_id,
    equipe_id: equipeId,
    client_id: row.client_id,
    scope: row.scope,
  });
  const refreshToken = await issueRefreshToken({
    clientId: row.client_id,
    userId: row.user_id,
    scope: row.scope,
    resource: row.resource ?? resourceIdentifier(),
  });

  return succes({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_TTL,
    refresh_token: refreshToken,
    scope: row.scope,
  });
}

async function rafraichir(form: URLSearchParams) {
  const token = form.get("refresh_token");
  const clientId = form.get("client_id");
  if (!token || !clientId) {
    return erreur("invalid_request", "refresh_token et client_id sont requis.");
  }

  const row = await consumeRefreshToken(token);
  if (!row) return erreur("invalid_grant", "Jeton de rafraîchissement invalide, expiré ou révoqué.");
  if (row.client_id !== clientId) {
    return erreur("invalid_grant", "Ce jeton a été émis pour un autre client.");
  }

  // L'équipe est relue à chaque rafraîchissement : si l'utilisateur change
  // d'équipe, son jeton suit sans qu'il ait à se reconnecter.
  const equipeId = await equipeDe(row.user_id);
  const accessToken = await signAccessToken({
    sub: row.user_id,
    equipe_id: equipeId,
    client_id: row.client_id,
    scope: row.scope,
  });
  const nouveauRefresh = await issueRefreshToken({
    clientId: row.client_id,
    userId: row.user_id,
    scope: row.scope,
    resource: row.resource,
  });

  return succes({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_TTL,
    refresh_token: nouveauRefresh,
    scope: row.scope,
  });
}
