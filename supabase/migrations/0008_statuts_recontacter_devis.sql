-- Nathan Mocka CRM — deux étapes de pipeline supplémentaires
-- À exécuter dans le SQL editor Supabase, après 0007_date_rdv.sql.

-- « À recontacter » couvre le prospect qui a répondu mais demande d'être
-- repris plus tard : ce n'est ni un NRP, ni un contact en attente de réponse.
-- « Devis envoyé » couvre l'étape entre le rendez-vous et la signature, qui
-- se confondait jusqu'ici avec « RDV pris ».

-- ALTER TYPE ... ADD VALUE ne peut pas être suivi d'un usage de la nouvelle
-- valeur dans la même transaction. Ce fichier se contente de les déclarer,
-- rien ne les utilise ici, donc il passe d'un bloc.

alter type public.prospect_statut add value if not exists 'a_recontacter' after 'contacte';
alter type public.prospect_statut add value if not exists 'devis_envoye' after 'rdv';
