-- Nathan Mocka CRM — prompts par compte, signaux de prospection, suivi des réponses
-- À exécuter dans le SQL editor Supabase, après 0001_init.sql.

-- =========================================================
-- 1. Prompts par compte
-- =========================================================
-- Une ligne par utilisateur. Le contexte de marque (qui est l'entreprise,
-- sa cible, ses exclusions, sa preuve client) est commun à tous les types
-- de contenu ; les règles spécifiques varient selon qu'on rédige un message
-- privé, une relance, un post, un commentaire ou un carrousel.

create table if not exists public.prompts (
  owner_id uuid primary key references public.profiles(id) on delete cascade,
  contexte text not null default '',
  regles_message text not null default '',
  regles_relance text not null default '',
  regles_post text not null default '',
  regles_commentaire text not null default '',
  regles_carrousel text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.prompts enable row level security;

drop policy if exists prompts_select_own on public.prompts;
create policy prompts_select_own on public.prompts
  for select using (owner_id = auth.uid());

drop policy if exists prompts_insert_own on public.prompts;
create policy prompts_insert_own on public.prompts
  for insert with check (owner_id = auth.uid());

drop policy if exists prompts_update_own on public.prompts;
create policy prompts_update_own on public.prompts
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists prompts_delete_own on public.prompts;
create policy prompts_delete_own on public.prompts
  for delete using (owner_id = auth.uid());

drop trigger if exists prompts_touch_updated_at on public.prompts;
create trigger prompts_touch_updated_at
  before update on public.prompts
  for each row execute function public.touch_updated_at();

-- =========================================================
-- 2. Signaux de prospection et suivi des réponses
-- =========================================================
-- signal      : ce qui a déclenché l'ajout du prospect (offre d'emploi
--               back office, plainte publique, croissance rapide…)
-- signal_date : quand le signal a été observé, pour prioriser le frais
-- a_repondu   : le prospect a répondu au moins une fois, sert au taux
--               de réponse du tableau de bord

alter table public.prospects add column if not exists signal text;
alter table public.prospects add column if not exists signal_date date;
alter table public.prospects add column if not exists a_repondu boolean not null default false;

create index if not exists prospects_signal_idx
  on public.prospects (owner_id, signal_date desc)
  where signal is not null;
