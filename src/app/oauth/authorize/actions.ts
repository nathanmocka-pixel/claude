"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { CODE_TTL, randomToken, resourceIdentifier } from "@/lib/mcp/oauth";

export type ConsentParams = {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: string;
  state: string;
  resource: string;
  scope: string;
};

function retour(params: ConsentParams, extra: Record<string, string>) {
  const url = new URL(params.redirect_uri);
  for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v);
  if (params.state) url.searchParams.set("state", params.state);
  return url.toString();
}

export async function autoriser(params: ConsentParams) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createSupabaseAdmin();

  // L'URI de redirection est revalidée ici : le formulaire vient du client,
  // on ne lui fait pas confiance sur parole une seconde fois.
  const { data: client } = await admin
    .from("oauth_clients")
    .select("redirect_uris")
    .eq("client_id", params.client_id)
    .maybeSingle();
  if (!client || !(client.redirect_uris as string[]).includes(params.redirect_uri)) {
    redirect("/app");
  }

  const code = randomToken();
  const { error } = await admin.from("oauth_codes").insert({
    code,
    client_id: params.client_id,
    user_id: user.id,
    redirect_uri: params.redirect_uri,
    code_challenge: params.code_challenge,
    code_challenge_method: params.code_challenge_method,
    scope: params.scope,
    resource: params.resource || resourceIdentifier(),
    expires_at: new Date(Date.now() + CODE_TTL * 1000).toISOString(),
  });

  if (error) {
    redirect(retour(params, { error: "server_error", error_description: error.message }));
  }

  redirect(retour(params, { code }));
}

export async function refuser(params: ConsentParams) {
  redirect(
    retour(params, {
      error: "access_denied",
      error_description: "L'utilisateur a refusé l'autorisation.",
    })
  );
}
