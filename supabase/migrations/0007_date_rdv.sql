-- Nathan Mocka CRM — date du rendez-vous pris
-- À exécuter dans le SQL editor Supabase, après 0006_avatars.sql.

-- date_contact répond à « quand lui a-t-on écrit », ce qui pilote les
-- relances. Un rendez-vous se situe dans le futur et répond à une autre
-- question : « qu'est-ce qui m'attend cette semaine ». Les deux dates ne
-- peuvent donc pas partager la même colonne.

alter table public.prospects add column if not exists date_rdv date;

-- La liste remonte les rendez-vous en tête, du plus proche au plus lointain.
create index if not exists prospects_rdv_idx
  on public.prospects (equipe_id, date_rdv)
  where date_rdv is not null;
