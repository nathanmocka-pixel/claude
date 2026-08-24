-- Nathan Mocka CRM — serveur d'autorisation OAuth 2.1 pour le connecteur MCP
-- À exécuter dans le SQL editor Supabase, après 0004_equipe_partagee.sql.

-- Supabase Auth identifie l'utilisateur mais n'est pas un serveur
-- d'autorisation OAuth utilisable par un client tiers : pas d'enregistrement
-- dynamique, et ses jetons visent l'application elle-même. Ces tables portent
-- donc un serveur d'autorisation minimal conforme à la spec MCP, adossé à la
-- session Supabase pour savoir qui autorise.
--
-- Aucune policy RLS n'est créée : ces tables ne sont jamais lues par le
-- navigateur. Seules les routes serveur y accèdent, avec la clé service role.
-- RLS reste activée pour que la clé anon ne puisse rien en tirer.

-- =========================================================
-- 1. Clients enregistrés dynamiquement (RFC 7591)
-- =========================================================

create table if not exists public.oauth_clients (
  client_id text primary key,
  client_name text,
  redirect_uris text[] not null,
  grant_types text[] not null default array['authorization_code', 'refresh_token'],
  token_endpoint_auth_method text not null default 'none',
  created_at timestamptz not null default now()
);

alter table public.oauth_clients enable row level security;

-- =========================================================
-- 2. Codes d'autorisation
-- =========================================================
-- Durée de vie courte et usage unique : consommé par un delete au moment de
-- l'échange, ce qui rend un rejeu impossible même en cas de fuite du code.

create table if not exists public.oauth_codes (
  code text primary key,
  client_id text not null references public.oauth_clients(client_id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  redirect_uri text not null,
  code_challenge text not null,
  code_challenge_method text not null,
  scope text not null default '',
  resource text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists oauth_codes_expiry_idx on public.oauth_codes (expires_at);

alter table public.oauth_codes enable row level security;

-- =========================================================
-- 3. Jetons de rafraîchissement
-- =========================================================
-- Stockés hachés en SHA-256 : une lecture de la base ne suffit pas à rejouer
-- un jeton. Les jetons d'accès, eux, sont des JWT signés et ne sont pas
-- stockés du tout.

create table if not exists public.oauth_refresh_tokens (
  token_hash text primary key,
  client_id text not null references public.oauth_clients(client_id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  scope text not null default '',
  resource text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists oauth_refresh_user_idx on public.oauth_refresh_tokens (user_id);

alter table public.oauth_refresh_tokens enable row level security;

-- =========================================================
-- 4. Purge des éléments expirés
-- =========================================================
-- Appelée par la route /token à chaque échange : pas de tâche planifiée à
-- maintenir, et le volume reste négligeable.

create or replace function public.purge_oauth_expire()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.oauth_codes where expires_at < now();
  delete from public.oauth_refresh_tokens
  where expires_at < now() or (revoked_at is not null and revoked_at < now() - interval '7 days');
$$;
