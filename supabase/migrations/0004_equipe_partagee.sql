-- Nathan Mocka CRM — base de prospects partagée entre les comptes d'une équipe
-- À exécuter dans le SQL editor Supabase, après 0003_fix_profiles_rls_recursion.sql.

-- Jusqu'ici chaque compte ne voyait que ses propres prospects. Ce fichier
-- fait passer les prospects et leur historique au niveau de l'équipe : tous
-- les comptes d'une même équipe voient et modifient la même base.
--
-- owner_id est conservé et devient l'attribution : qui a ajouté le prospect,
-- qui lui a écrit. Avec une base commune c'est ce qui évite de contacter la
-- même personne deux fois au nom de deux marques différentes.
--
-- Les prompts restent strictement par compte : le contexte de marque de
-- chacun n'a aucune raison d'être partagé.

-- =========================================================
-- 1. Équipes
-- =========================================================

create table if not exists public.equipes (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  created_at timestamptz not null default now()
);

alter table public.equipes enable row level security;

alter table public.profiles
  add column if not exists equipe_id uuid references public.equipes(id) on delete set null;

-- Une seule équipe au départ, à laquelle tous les comptes existants sont rattachés.
insert into public.equipes (nom)
select 'Équipe principale'
where not exists (select 1 from public.equipes);

update public.profiles
set equipe_id = (select id from public.equipes order by created_at limit 1)
where equipe_id is null;

-- =========================================================
-- 2. Lecture de sa propre équipe, sans récursion RLS
-- =========================================================
-- SECURITY DEFINER : la fonction lit profiles en contournant la RLS, ce qui
-- permet de l'appeler depuis les policies des autres tables sans déclencher
-- la récursion qui avait cassé la lecture des profils (voir 0003).

create or replace function public.mon_equipe()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select equipe_id from public.profiles where id = auth.uid();
$$;

-- Chaque membre voit les autres membres de son équipe, pour afficher qui a
-- ajouté quel prospect.
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_equipe on public.profiles
  for select using (
    auth.uid() = id
    or equipe_id = public.mon_equipe()
  );

-- Les membres voient leur propre équipe.
drop policy if exists equipes_select_own on public.equipes;
create policy equipes_select_own on public.equipes
  for select using (id = public.mon_equipe());

-- Un nouveau compte rejoint l'équipe existante.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, equipe_id)
  values (
    new.id,
    new.email,
    'member',
    (select id from public.equipes order by created_at limit 1)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- =========================================================
-- 3. Prospects et historique rattachés à l'équipe
-- =========================================================

alter table public.prospects
  add column if not exists equipe_id uuid references public.equipes(id) on delete cascade;

alter table public.messages_historique
  add column if not exists equipe_id uuid references public.equipes(id) on delete cascade;

update public.prospects p
set equipe_id = pr.equipe_id
from public.profiles pr
where pr.id = p.owner_id and p.equipe_id is null;

update public.messages_historique m
set equipe_id = pr.equipe_id
from public.profiles pr
where pr.id = m.owner_id and m.equipe_id is null;

create index if not exists prospects_equipe_idx
  on public.prospects (equipe_id, updated_at desc);

-- equipe_id est rempli automatiquement à l'insertion, l'application n'a pas
-- à le connaître. Le trigger tourne avant l'évaluation du WITH CHECK.
create or replace function public.set_equipe_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.equipe_id is null then
    new.equipe_id := public.mon_equipe();
  end if;
  return new;
end;
$$;

drop trigger if exists prospects_set_equipe on public.prospects;
create trigger prospects_set_equipe
  before insert on public.prospects
  for each row execute function public.set_equipe_id();

drop trigger if exists messages_set_equipe on public.messages_historique;
create trigger messages_set_equipe
  before insert on public.messages_historique
  for each row execute function public.set_equipe_id();

-- =========================================================
-- 4. Policies : l'équipe remplace le propriétaire
-- =========================================================

drop policy if exists prospects_select_own on public.prospects;
drop policy if exists prospects_insert_own on public.prospects;
drop policy if exists prospects_update_own on public.prospects;
drop policy if exists prospects_delete_own on public.prospects;

create policy prospects_select_equipe on public.prospects
  for select using (equipe_id = public.mon_equipe());

-- owner_id reste imposé à l'utilisateur courant : on peut créer un prospect
-- pour l'équipe, jamais l'attribuer à quelqu'un d'autre.
create policy prospects_insert_equipe on public.prospects
  for insert with check (
    equipe_id = public.mon_equipe()
    and owner_id = auth.uid()
  );

create policy prospects_update_equipe on public.prospects
  for update using (equipe_id = public.mon_equipe())
  with check (equipe_id = public.mon_equipe());

create policy prospects_delete_equipe on public.prospects
  for delete using (equipe_id = public.mon_equipe());

drop policy if exists messages_select_own on public.messages_historique;
drop policy if exists messages_insert_own on public.messages_historique;
drop policy if exists messages_update_own on public.messages_historique;
drop policy if exists messages_delete_own on public.messages_historique;

create policy messages_select_equipe on public.messages_historique
  for select using (equipe_id = public.mon_equipe());

create policy messages_insert_equipe on public.messages_historique
  for insert with check (
    equipe_id = public.mon_equipe()
    and owner_id = auth.uid()
  );

create policy messages_update_equipe on public.messages_historique
  for update using (equipe_id = public.mon_equipe())
  with check (equipe_id = public.mon_equipe());

create policy messages_delete_equipe on public.messages_historique
  for delete using (equipe_id = public.mon_equipe());
