# Nathan Mocka — CRM de prospection

CRM minimaliste pour suivre la prospection LinkedIn de Nathan Mocka : liste de prospects, fiche client avec historique, vue « à relancer », tableau de bord, génération de messages via l'API Claude à partir d'un pain point.

Stack : Next.js 15 (App Router, Server Components + Server Actions), Supabase (Auth + Postgres avec RLS), Tailwind CSS, Anthropic SDK côté serveur, déploiement Vercel.

## Ce que fait l'app

- **Liste des prospects** avec filtres statut / secteur / recherche libre
- **Fiche prospect** éditable en direct (statut, priorité, pain point, note…) avec compteur de jours depuis le dernier contact et badge rouge dès 5 jours pour les prospects en statut *contacté*
- **Vue « à relancer »** qui affiche uniquement les prospects contactés depuis 5 jours ou plus
- **Tableau de bord** : total, contactés, taux RDV/close, répartition par statut et par secteur
- **Génération de message** LinkedIn via Claude, à partir du pain point détecté, en respectant les règles de ton du prompt de prospection (vouvoiement, trois phrases, pas d'appel, question ouverte…). Le brouillon est éditable et n'est jamais envoyé automatiquement
- **Gestion des comptes** (admin uniquement) : l'admin crée les comptes des autres utilisateurs, chaque compte ne voit que ses propres prospects
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
      nouveau/          formulaire nouveau prospect
      prospects/[id]/   fiche prospect
      comptes/          gestion des comptes (admin)
      actions.ts        server actions CRUD sur prospects
    api/generate-message/  route serveur → API Claude
  lib/
    domain.ts           types + constantes métier (statuts, priorités…)
    supabase/           clients browser / server / admin (service role)
  middleware.ts         garde d'auth sur /app
supabase/
  migrations/0001_init.sql  schéma + RLS + trigger profil
```

## Setup

### 1. Créer le projet Supabase

- https://supabase.com → New project, région Europe recommandée
- Une fois créé, ouvrir **SQL Editor** et coller le contenu de `supabase/migrations/0001_init.sql`, puis Run
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
2. Renseigner les 4 variables d'environnement (mêmes noms que `.env.example`)
3. Deploy — l'URL finale est fournie par Vercel

## Sécurité

- **RLS activée** sur toutes les tables. Un compte ne peut lire / écrire que ses propres prospects et son propre historique. C'est appliqué au niveau Postgres, pas seulement dans le code.
- **Clé `service_role`** utilisée uniquement dans les server actions/routes serveur qui ont d'abord vérifié `role = 'admin'` du caller. Ne jamais importer `lib/supabase/admin.ts` depuis un composant client.
- **Clé Anthropic** utilisée uniquement dans `app/api/generate-message/route.ts` côté serveur. Le navigateur ne la voit jamais.
- **Aucune inscription publique**. La création de comptes passe forcément par l'écran admin.

## Choix techniques notables

- **Server Components + Server Actions** partout : les fetch Supabase se font côté serveur avec la session de l'utilisateur, donc la RLS s'applique naturellement. Le client ne récupère que ce que la RLS autorise.
- **Auto-save on blur** sur la fiche prospect (mise à jour optimiste dans le state local, puis server action). Le `select` de statut sauvegarde à chaque changement.
- **Pas de framework UI lourd** (shadcn, radix…) — juste Tailwind + lucide-react, comme le prototype de départ.

## Limites connues à traiter plus tard si besoin

- Pas de pagination sur la liste des prospects (OK jusqu'à ~1000)
- Pas d'édition de rôle depuis l'UI (seule la création avec le rôle initial est proposée ; passer par Supabase pour bump/rétrograder)
- Pas de suppression d'un compte depuis l'UI (à faire dans Supabase Auth si besoin — la ligne `profiles` et les prospects cascadent)
- Modèle Claude par défaut : `claude-sonnet-4-5`, ajustable via `ANTHROPIC_MODEL`
