import { NextResponse } from "next/server";
import { baseUrl, MCP_SCOPE, resourceIdentifier } from "@/lib/mcp/oauth";

export const dynamic = "force-dynamic";

// RFC 9728. C'est ce document que le client MCP va chercher après un 401,
// pour savoir quel serveur d'autorisation interroger.
export async function GET() {
  return NextResponse.json(
    {
      resource: resourceIdentifier(),
      authorization_servers: [baseUrl()],
      scopes_supported: [MCP_SCOPE],
      bearer_methods_supported: ["header"],
      resource_documentation: `${baseUrl()}/README-mcp`,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
