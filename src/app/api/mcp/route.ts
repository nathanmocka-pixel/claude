import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { baseUrl, resourceIdentifier, verifyAccessToken } from "@/lib/mcp/oauth";
import {
  ErreurOutil,
  addNote,
  createProspect,
  getProspect,
  listProspects,
  schemas,
  updateProspectStatus,
  type Contexte,
} from "@/lib/mcp/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// RFC 9728 : sur un 401, le client doit pouvoir découvrir où s'authentifier.
function nonAutorise(detail: string) {
  return new Response(
    JSON.stringify({ error: "invalid_token", error_description: detail }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": `Bearer realm="mcp", resource_metadata="${baseUrl()}/.well-known/oauth-protected-resource"`,
      },
    }
  );
}

// Une erreur d'outil doit revenir au modèle comme un résultat lisible, pas
// comme une exception de transport : sinon la conversation s'interrompt au
// lieu de laisser le modèle corriger son appel.
function resultat(valeur: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(valeur, null, 2) }],
  };
}

function echec(e: unknown) {
  const message =
    e instanceof ErreurOutil
      ? e.message
      : e instanceof Error
        ? `Erreur inattendue : ${e.message}`
        : "Erreur inattendue.";
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

async function executer<T>(fn: () => Promise<T>) {
  try {
    return resultat(await fn());
  } catch (e) {
    return echec(e);
  }
}

function construireServeur(ctx: Contexte) {
  const server = new McpServer({
    name: "nathan-mocka-crm",
    version: "1.0.0",
  });

  server.registerTool(
    "create_prospect",
    {
      title: "Créer un prospect",
      description:
        "Crée une fiche prospect dans le CRM. Le prospect est créé au statut « à qualifier » et rattaché à votre équipe.",
      inputSchema: schemas.create_prospect,
    },
    async (args) => executer(() => createProspect(ctx, args))
  );

  server.registerTool(
    "list_prospects",
    {
      title: "Lister les prospects",
      description:
        "Liste les prospects de votre équipe, du plus récemment modifié au plus ancien. Filtres optionnels par statut et par nom ou entreprise.",
      inputSchema: schemas.list_prospects,
    },
    async (args) => executer(() => listProspects(ctx, args))
  );

  server.registerTool(
    "get_prospect",
    {
      title: "Détail d'un prospect",
      description:
        "Récupère une fiche prospect complète par son identifiant, avec son historique de messages.",
      inputSchema: schemas.get_prospect,
    },
    async (args) => executer(() => getProspect(ctx, args))
  );

  server.registerTool(
    "update_prospect_status",
    {
      title: "Changer le statut d'un prospect",
      description:
        "Déplace un prospect dans le pipeline. Statuts possibles : a_qualifier, contacte, rdv, nrp, close, dead. Passer à « contacte » met la date de dernier contact à aujourd'hui.",
      inputSchema: schemas.update_prospect_status,
    },
    async (args) => executer(() => updateProspectStatus(ctx, args))
  );

  server.registerTool(
    "add_note",
    {
      title: "Ajouter une note de suivi",
      description:
        "Ajoute une note datée à la fiche d'un prospect existant, sans écraser les notes déjà présentes.",
      inputSchema: schemas.add_note,
    },
    async (args) => executer(() => addNote(ctx, args))
  );

  return server;
}

async function traiter(request: Request) {
  const entete = request.headers.get("authorization") ?? "";
  const [type, token] = entete.split(" ");
  if (type?.toLowerCase() !== "bearer" || !token) {
    return nonAutorise("Jeton d'accès Bearer manquant.");
  }

  let claims;
  try {
    claims = await verifyAccessToken(token);
  } catch {
    return nonAutorise("Jeton d'accès invalide ou expiré.");
  }

  const ctx: Contexte = { userId: claims.sub, equipeId: claims.equipe_id };

  // Mode sans session : chaque requête est indépendante, ce qui convient à
  // l'exécution serverless où deux requêtes ne partagent pas de mémoire.
  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
  });
  const server = construireServeur(ctx);
  await server.connect(transport);

  const response = await transport.handleRequest(request, {
    authInfo: {
      token,
      clientId: claims.client_id,
      scopes: claims.scope ? claims.scope.split(" ") : [],
      resource: new URL(resourceIdentifier()),
      extra: { userId: claims.sub, equipeId: claims.equipe_id },
    },
  });

  return response;
}

export async function POST(request: Request) {
  return traiter(request);
}

export async function GET(request: Request) {
  return traiter(request);
}

export async function DELETE(request: Request) {
  return traiter(request);
}
