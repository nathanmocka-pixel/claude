-- Nathan Mocka CRM — photo de profil des membres
-- À exécuter dans le SQL editor Supabase, après 0005_mcp_oauth.sql.

-- La photo est stockée en data URI, après redimensionnement à 96 px côté
-- navigateur : quelques kilo-octets, donc pas de bucket de stockage à
-- configurer ni de politique d'accès supplémentaire à maintenir.

alter table public.profiles add column if not exists avatar_url text;

-- Jusqu'ici profiles n'avait aucune policy d'écriture : tout passait par la
-- clé service role. Pour que chacun gère sa propre photo depuis l'app, il
-- faut une écriture côté client, mais strictement limitée.
--
-- Une policy RLS ne sait pas restreindre les colonnes. Le verrou est donc
-- posé au niveau des privilèges : le rôle authenticated perd le droit
-- d'écrire sur la table, et ne le retrouve que sur la seule colonne
-- avatar_url. Sans cela, un utilisateur pourrait se passer role = 'admin'
-- ou se rattacher à l'équipe de quelqu'un d'autre.

revoke update on public.profiles from authenticated;
grant update (avatar_url) on public.profiles to authenticated;

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
