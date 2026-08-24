import { NextResponse } from "next/server";
import { baseUrl, MCP_SCOPE } from "@/lib/mcp/oauth";

export const dynamic = "force-dynamic";

// RFC 8414. Décrit les capacités du serveur d'autorisation. PKCE S256 est
// annoncé comme seule méthode : la spec MCP l'exige et le endpoint /token
// refuse tout le reste.
export async function GET() {
  const base = baseUrl();
  return NextResponse.json(
    {
      issuer: base,
      authorization_endpoint: `${base}/oauth/authorize`,
      token_endpoint: `${base}/oauth/token`,
      registration_endpoint: `${base}/oauth/register`,
      scopes_supported: [MCP_SCOPE],
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
