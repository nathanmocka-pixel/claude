-- Nathan Mocka CRM — schéma initial
-- À exécuter dans le SQL editor Supabase, ou via `supabase db push` si la CLI est configurée.

-- =========================================================
-- 1. Profils (1-1 avec auth.users)
-- =========================================================

create type public.user_role as enum ('admin', 'member');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role public.user_role not null default 'member',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Chaque utilisateur lit son propre profil. La lecture de tous les profils
-- par un admin passe par la clé service role côté serveur, jamais par la
-- RLS : une policy qui interrogerait public.profiles pour vérifier le rôle
-- déclencherait une récursion infinie et casserait toute lecture.
create policy profiles_select_self on public.profiles
  for select using (auth.uid() = id);

-- Aucune écriture directe par le client — tout passe par le service role côté serveur.
-- (Pas de policy insert/update/delete pour anon ou authenticated.)

-- Trigger : crée un profil "member" à chaque création d'utilisateur dans auth.users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'member')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- 2. Prospects
-- =========================================================

create type public.prospect_statut as enum (
  'a_qualifier', 'contacte', 'rdv', 'nrp', 'close', 'dead'
);

create type public.prospect_priorite as enum ('chaud', 'tiede', 'froid');

create table public.prospects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  nom text not null,
  entreprise text not null,
  poste text,
  linkedin text,
  contact text,
  secteur text,
  statut public.prospect_statut not null default 'a_qualifier',
  priorite public.prospect_priorite not null default 'tiede',
  pain_point text,
  date_contact date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index prospects_owner_idx on public.prospects (owner_id, updated_at desc);

alter table public.prospects enable row level security;

-- Isolation stricte : un compte ne voit et n'écrit que ses propres prospects.
create policy prospects_select_own on public.prospects
  for select using (owner_id = auth.uid());

create policy prospects_insert_own on public.prospects
  for insert with check (owner_id = auth.uid());

create policy prospects_update_own on public.prospects
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy prospects_delete_own on public.prospects
  for delete using (owner_id = auth.uid());

-- Trigger updated_at
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger prospects_touch_updated_at
  before update on public.prospects
  for each row execute function public.touch_updated_at();

-- =========================================================
-- 3. Historique messages
-- =========================================================

create table public.messages_historique (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  contenu text not null,
  canal text not null default 'LinkedIn',
  created_at timestamptz not null default now()
);

create index messages_prospect_idx on public.messages_historique (prospect_id, date desc);

alter table public.messages_historique enable row level security;

create policy messages_select_own on public.messages_historique
  for select using (owner_id = auth.uid());

create policy messages_insert_own on public.messages_historique
  for insert with check (owner_id = auth.uid());

create policy messages_update_own on public.messages_historique
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy messages_delete_own on public.messages_historique
  for delete using (owner_id = auth.uid());
