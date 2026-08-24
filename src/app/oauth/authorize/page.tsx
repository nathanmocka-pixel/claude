import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { MCP_SCOPE, resourceIdentifier } from "@/lib/mcp/oauth";
import { ConsentForm } from "./consent-form";

export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function PageErreur({ titre, detail }: { titre: string; detail: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-cream">
      <div className="w-full max-w-sm bg-white border border-border rounded-2xl p-6">
        <div className="font-display font-bold text-navy mb-2">{titre}</div>
        <p className="text-sm text-[#5A6072]">{detail}</p>
        <p className="text-xs text-[#8A8F98] mt-4">
          Rien n&apos;a été autorisé. Vous pouvez fermer cette fenêtre.
        </p>
      </div>
    </div>
  );
}

export default async function AuthorizePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const clientId = first(sp.client_id);
  const redirectUri = first(sp.redirect_uri);
  const responseType = first(sp.response_type);
  const codeChallenge = first(sp.code_challenge);
  const codeChallengeMethod = first(sp.code_challenge_method);
  const state = first(sp.state);
  const resource = first(sp.resource);
  const scope = first(sp.scope) || MCP_SCOPE;

  if (!clientId || !redirectUri) {
    return (
      <PageErreur
        titre="Demande incomplète"
        detail="Les paramètres client_id et redirect_uri sont requis."
      />
    );
  }

  const admin = createSupabaseAdmin();
  const { data: client } = await admin
    .from("oauth_clients")
    .select("client_id, client_name, redirect_uris")
    .eq("client_id", clientId)
    .maybeSingle();

  if (!client) {
    return (
      <PageErreur
        titre="Application inconnue"
        detail="Ce client n'est pas enregistré auprès de ce serveur."
      />
    );
  }

  // Comparaison à l'identique. Tant que l'URI n'est pas validée on n'y renvoie
  // rien, pas même une erreur : ce serait un redirecteur ouvert.
  if (!(client.redirect_uris as string[]).includes(redirectUri)) {
    return (
      <PageErreur
        titre="Adresse de retour non autorisée"
        detail="L'URI de redirection demandée ne fait pas partie de celles enregistrées par cette application."
      />
    );
  }

  // À partir d'ici l'URI est de confiance : les erreurs repartent vers le client.
  function refus(code: string, description: string) {
    const url = new URL(redirectUri!);
    url.searchParams.set("error", code);
    url.searchParams.set("error_description", description);
    if (state) url.searchParams.set("state", state);
    redirect(url.toString());
  }

  if (responseType !== "code") {
    refus("unsupported_response_type", "Seul response_type=code est accepté.");
  }
  if (!codeChallenge) {
    refus("invalid_request", "PKCE est obligatoire : code_challenge manquant.");
  }
  if (codeChallengeMethod !== "S256") {
    refus("invalid_request", "Seule la méthode PKCE S256 est acceptée.");
  }
  if (resource && resource.replace(/\/+$/, "") !== resourceIdentifier()) {
    refus("invalid_target", `Cette ressource n'est pas servie ici : ${resource}`);
  }

  // Identification via la session Supabase existante. Pas de compte séparé
  // pour le MCP : c'est le même login que le CRM.
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const self = new URL(`${resourceIdentifier().replace("/api/mcp", "")}/oauth/authorize`);
    for (const [k, v] of Object.entries(sp)) {
      const val = first(v);
      if (val !== undefined) self.searchParams.set(k, val);
    }
    redirect(`/login?next=${encodeURIComponent(self.pathname + self.search)}`);
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("email, equipe_id")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <ConsentForm
      clientName={client.client_name ?? "Une application"}
      email={profile?.email ?? user.email ?? ""}
      partageEquipe={Boolean(profile?.equipe_id)}
      params={{
        client_id: clientId,
        redirect_uri: redirectUri,
        code_challenge: codeChallenge!,
        code_challenge_method: codeChallengeMethod!,
        state: state ?? "",
        resource: resource ?? "",
        scope,
      }}
    />
  );
}
