-- Nathan Mocka CRM — correction de la récursion RLS sur profiles
-- À exécuter dans le SQL editor Supabase, après 0002_prompts_signaux.sql.

-- La policy de 0001 autorisait un admin à lire tous les profils via un
-- EXISTS sur public.profiles. Cette sous-requête déclenche la policy de
-- public.profiles, donc Postgres détecte une récursion infinie et fait
-- échouer toute lecture de la table, y compris celle de son propre profil.
-- Conséquence visible : le rôle retombait sur member côté application et
-- l'écran de gestion des comptes disparaissait pour l'admin.

-- La branche admin est inutile : l'écran des comptes liste les profils avec
-- la clé service role, qui contourne la RLS après avoir vérifié le rôle de
-- l'appelant. Chaque compte n'a donc besoin que de lire sa propre ligne.

drop policy if exists profiles_select_self on public.profiles;

create policy profiles_select_self on public.profiles
  for select using (auth.uid() = id);
