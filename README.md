# Nathan Mocka — CRM de prospection

CRM minimaliste pour suivre la prospection LinkedIn de Nathan Mocka : liste de prospects, fiche client avec historique, vue « à relancer », tableau de bord, et prompt Claude prêt à copier pour rédiger un message à partir d'un pain point.

Stack : Next.js 15 (App Router, Server Components + Server Actions), Supabase (Auth + Postgres avec RLS), Tailwind CSS, déploiement Vercel. Aucun coût d'API Claude côté serveur — le CRM copie le prompt dans le presse-papier et vous le collez dans votre Claude.ai.

## Ce que fait l'app

- **Liste des prospects** avec filtres statut / secteur / recherche libre. Les RDV datés remontent en tête, du plus proche au plus lointain ; les prospects *dead* sont masqués sauf si on filtre explicitement sur ce statut
- **Fiche prospect** éditable en direct (statut, priorité, pain point, note…) avec compteur de jours depuis le dernier contact et badge rouge dès 5 jours pour les prospects en statut *contacté*
- **Vue « à relancer »** qui affiche uniquement les prospects contactés depuis 5 jours ou plus
- **Tableau de bord** : total, contactés, taux RDV/close, répartition par statut et par secteur
- **Prompts Claude prêts à copier** — sur la fiche prospect, deux boutons mettent dans le presse-papier le prompt complet (contexte de marque + règles de ton + angle du secteur + fiche du prospect) pour un **message initial** ou pour une **relance** qui tient compte des messages déjà envoyés. Vous le collez dans votre Claude.ai, vous copiez la réponse dans le CRM. Aucune clé d'API à gérer, aucun coût
- **Studio contenu** (`/app/contenu`) — même mécanique pour les **posts LinkedIn**, les **commentaires d'engagement** (tutoiement, une à deux phrases, jamais de pitch) et les **carrousels** (structure erreur / bon réflexe + identité visuelle)
- **Prompts par compte** (`/app/prompt`) — chaque utilisateur édite son propre contexte de marque et ses règles par type de contenu. Nathan garde les siens, un autre compte met les siens, sans toucher au code
- **Signaux** (`/app/signaux`) — chaque prospect peut porter le signal qui a motivé son ajout (offre d'emploi back office, plainte publique, croissance rapide…) avec sa date, listés du plus frais au plus ancien
- **Photo de profil** (`/app/profil`) — chaque membre dépose la sienne, réduite à 96 px dans le navigateur et stockée en data URI, sans bucket à configurer. Elle apparaît sur les prospects qu'il suit, dans l'historique des messages et sur l'écran des comptes
- **Gestion des comptes** (admin uniquement) : l'admin crée les comptes des autres utilisateurs
- **Auth Supabase** email/mot de passe, aucune inscription publique

## Structure

```
src/
  app/
    login/              écran de connexion (public)
    logout/             route POST pour se déconnecter
    app/                zone protégée par le middleware
      page.tsx          liste des prospects
      relance/          vue à relancer
      dashboard/        tableau de bord
      signaux/          prospects ajoutés sur signal, du plus frais au plus ancien
      nouveau/          formulaire nouveau prospect
      prospects/[id]/   fiche prospect
      contenu/          studio post / commentaire / carrousel
      prompt/           éditeur des prompts du compte
      profil/           photo de profil du membre connecté
      comptes/          gestion des comptes (admin)
      actions.ts        server actions CRUD sur prospects
  lib/
    domain.ts           types + constantes métier (statuts, priorités, signaux…)
    prompt.ts           assemblage des prompts + angle par secteur
    default-prompts.ts  valeurs de départ d'un nouveau compte
    prompts-server.ts   chargement des prompts du compte connecté
    supabase/           clients browser / server / admin (service role)
  middleware.ts         garde d'auth sur /app
supabase/
  migrations/0001_init.sql       schéma + RLS + trigger profil
  migrations/0002_prompts_signaux.sql  prompts par compte, signaux, suivi des réponses
  migrations/0003_fix_profiles_rls_recursion.sql  policy profiles non récursive
  migrations/0004_equipe_partagee.sql   base de prospects partagée par équipe
  migrations/0005_mcp_oauth.sql         serveur d'autorisation OAuth du connecteur MCP
  migrations/0006_avatars.sql           photo de profil des membres
  migrations/0007_date_rdv.sql          date du rendez-vous pris
```

## Setup

### 1. Créer le projet Supabase

- https://supabase.com → New project, région Europe recommandée
- Une fois créé, ouvrir **SQL Editor** et jouer les migrations de `supabase/migrations/` **dans l'ordre**, une requête séparée par fichier : `0001_init.sql`, `0002_prompts_signaux.sql`, `0003_fix_profiles_rls_recursion.sql`, `0004_equipe_partagee.sql`, `0005_mcp_oauth.sql`, `0006_avatars.sql`, `0007_date_rdv.sql`
- Récupérer dans **Project Settings → API** :
  - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (jamais exposée côté client)

### 2. Créer le premier compte admin

Aucun écran d'inscription publique n'existe. Deux options :

**Option A — via l'interface Supabase :**
1. **Authentication → Users → Add user → Create new user**, entrer email + mot de passe, cocher *Auto Confirm User*
2. **Table Editor → profiles**, éditer la ligne créée pour ce user et passer `role` à `admin`

**Option B — via SQL :** dans le SQL Editor :
```sql
-- après avoir créé l'utilisateur dans Authentication
update public.profiles set role = 'admin' where email = 'nathanmocka@gmail.com';
```

Une fois admin, connectez-vous sur `/login`, puis créez les autres comptes depuis `/app/comptes`.

### 3. Variables d'environnement

Copier `.env.example` vers `.env.local` et remplir les valeurs.

### 4. Lancer en local

```bash
npm install
npm run dev
```

Ouvrir http://localhost:3000, vous serez redirigé vers `/login`.

### 5. Déployer sur Vercel

1. `vercel` ou import du repo depuis vercel.com
2. Renseigner les 3 variables d'environnement (mêmes noms que `.env.example`)
3. Deploy — l'URL finale est fournie par Vercel

## Sécurité

- **RLS activée** sur toutes les tables. Les prospects et leur historique sont partagés au sein d'une **équipe** : tous les comptes d'une même équipe voient et modifient la même base, et ne voient rien des autres équipes. C'est appliqué au niveau Postgres, pas seulement dans le code. `owner_id` est conservé comme attribution — qui a ajouté le prospect, qui lui a écrit — et l'interface affiche « suivi par » sur les fiches des autres membres, pour éviter de contacter deux fois la même personne.
- **Les prompts restent strictement par compte.** Le contexte de marque de chacun n'est jamais partagé, même au sein d'une équipe.
- **Clé `service_role`** utilisée uniquement dans les server actions/routes serveur qui ont d'abord vérifié `role = 'admin'` du caller. Ne jamais importer `lib/supabase/admin.ts` depuis un composant client.
- **Aucune inscription publique**. La création de comptes passe forcément par l'écran admin.
- **Écriture restreinte sur `profiles`.** Une policy RLS ne sait pas limiter les colonnes : le rôle `authenticated` n'a le droit d'écrire que sur `avatar_url`, via un `grant` par colonne. Sans cela, un membre pourrait se donner `role = 'admin'` ou se rattacher à une autre équipe.

## Choix techniques notables

- **Server Components + Server Actions** partout : les fetch Supabase se font côté serveur avec la session de l'utilisateur, donc la RLS s'applique naturellement. Le client ne récupère que ce que la RLS autorise.
- **Auto-save on blur** sur la fiche prospect (mise à jour optimiste dans le state local, puis server action). Le `select` de statut sauvegarde à chaque changement.
- **Pas de framework UI lourd** (shadcn, radix…) — juste Tailwind + lucide-react, comme le prototype de départ.

## Limites connues à traiter plus tard si besoin

- Pas de pagination sur la liste des prospects (OK jusqu'à ~1000)
- Pas d'édition de rôle depuis l'UI (seule la création avec le rôle initial est proposée ; passer par Supabase pour bump/rétrograder)
- Pas de suppression d'un compte depuis l'UI (à faire dans Supabase Auth si besoin — la ligne `profiles` et les prospects cascadent)
- La génération de message passe par le presse-papier (le CRM copie le prompt, vous le collez dans Claude.ai). Aucun appel d'API Claude n'est fait depuis le CRM lui-même, donc pas de coût récurrent

## Connecteur MCP

Le CRM s'expose aussi comme serveur MCP distant : `/api/mcp`, avec un serveur d'autorisation OAuth 2.1 adossé à Supabase Auth. Voir [`README-mcp.md`](./README-mcp.md) pour le branchement, le fonctionnement de l'autorisation et la procédure de test avec l'inspecteur MCP.
