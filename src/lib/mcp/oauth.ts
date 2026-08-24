import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const ACCESS_TOKEN_TTL = 60 * 60; // 1 h
export const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30; // 30 j
export const CODE_TTL = 60 * 10; // 10 min
export const MCP_SCOPE = "crm:prospects";

// L'identifiant de ressource (RFC 8707) auquel les jetons sont destinés.
// Un jeton émis pour une autre ressource doit être refusé par la route MCP.
export function baseUrl() {
  const fromEnv = process.env.MCP_PUBLIC_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function resourceIdentifier() {
  return `${baseUrl()}/api/mcp`;
}

function secret() {
  const s = process.env.MCP_JWT_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "MCP_JWT_SECRET manquante ou trop courte (32 caractères minimum). Générez-la avec: openssl rand -base64 48"
    );
  }
  return new TextEncoder().encode(s);
}

export type AccessTokenClaims = {
  sub: string; // id utilisateur Supabase
  equipe_id: string | null;
  client_id: string;
  scope: string;
};

export async function signAccessToken(claims: AccessTokenClaims) {
  return new SignJWT({
    equipe_id: claims.equipe_id,
    client_id: claims.client_id,
    scope: claims.scope,
  })
    .setProtectedHeader({ alg: "HS256", typ: "at+jwt" })
    .setSubject(claims.sub)
    .setIssuer(baseUrl())
    .setAudience(resourceIdentifier())
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL}s`)
    .sign(secret());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenClaims> {
  const { payload } = await jwtVerify(token, secret(), {
    issuer: baseUrl(),
    // L'audience est vérifiée ici : un jeton émis pour une autre ressource
    // ne peut pas être rejoué contre ce serveur MCP.
    audience: resourceIdentifier(),
  });
  if (!payload.sub) throw new Error("Jeton sans sujet.");
  return {
    sub: payload.sub,
    equipe_id: (payload.equipe_id as string | null) ?? null,
    client_id: (payload.client_id as string) ?? "",
    scope: (payload.scope as string) ?? "",
  };
}

// =========================================================
// PKCE
// =========================================================

export function verifyPkce(verifier: string, challenge: string, method: string) {
  if (method !== "S256") return false;
  const computed = createHash("sha256").update(verifier).digest("base64url");
  const a = Buffer.from(computed);
  const b = Buffer.from(challenge);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// =========================================================
// Codes et jetons de rafraîchissement
// =========================================================

export function randomToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueRefreshToken(input: {
  clientId: string;
  userId: string;
  scope: string;
  resource: string | null;
}) {
  const token = randomToken();
  const admin = createSupabaseAdmin();
  const { error } = await admin.from("oauth_refresh_tokens").insert({
    token_hash: hashToken(token),
    client_id: input.clientId,
    user_id: input.userId,
    scope: input.scope,
    resource: input.resource,
    expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL * 1000).toISOString(),
  });
  if (error) throw new Error(error.message);
  return token;
}

// Rotation : le jeton présenté est révoqué et un nouveau est émis, de sorte
// qu'un jeton intercepté et déjà utilisé ne serve plus.
export async function consumeRefreshToken(token: string) {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("oauth_refresh_tokens")
    .select("*")
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (!data) return null;
  if (data.revoked_at) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;

  await admin
    .from("oauth_refresh_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("token_hash", data.token_hash);

  return data as {
    client_id: string;
    user_id: string;
    scope: string;
    resource: string | null;
  };
}

export async function purgeExpired() {
  const admin = createSupabaseAdmin();
  await admin.rpc("purge_oauth_expire");
}

// =========================================================
// Équipe de l'utilisateur, lue côté serveur
// =========================================================

export async function equipeDe(userId: string) {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("profiles")
    .select("equipe_id")
    .eq("id", userId)
    .maybeSingle();
  return (data?.equipe_id as string | null) ?? null;
}
