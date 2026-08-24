# Connecteur MCP — CRM Nathan Mocka

Le CRM expose un serveur MCP distant. Une fois branché, vous pilotez vos prospects depuis une conversation Claude : créer une fiche, changer un statut, ajouter une note, retrouver un dossier.

Chaque personne se connecte avec **son propre compte CRM**. Il n'y a pas de clé d'API à partager.

## Brancher le connecteur

1. Dans Claude, **Personnaliser → Connecteurs → Ajouter un connecteur personnalisé**
2. Coller l'URL du serveur :

   ```
   https://VOTRE-DOMAINE/api/mcp
   ```

   Remplacez `VOTRE-DOMAINE` par l'URL de votre déploiement Vercel (celle sur laquelle vous ouvrez le CRM).

3. Claude ouvre une fenêtre d'autorisation
4. Si vous n'êtes pas déjà connecté au CRM, l'écran de connexion habituel apparaît
5. Un écran récapitule ce que le connecteur pourra faire, puis **Autoriser**
6. La fenêtre se ferme, le connecteur est actif

Rien d'autre à configurer : Claude s'enregistre tout seul auprès du serveur.

## Ce qui se passe pendant l'autorisation

Du point de vue de l'utilisateur, c'est un simple « se connecter puis autoriser ». Dans le détail :

1. Claude lit `/.well-known/oauth-protected-resource` pour savoir où s'authentifier
2. Il s'enregistre comme client sur `/oauth/register` — pas de client à créer à la main
3. Il vous envoie sur `/oauth/authorize` avec un défi PKCE
4. Le serveur vérifie votre session Supabase, la même que celle du CRM. Sans session, vous passez par `/login` puis revenez automatiquement
5. Vous validez l'écran de consentement
6. Claude échange le code contre un jeton d'accès sur `/oauth/token`, en prouvant qu'il est bien à l'origine de la demande

Le jeton d'accès dure une heure et se renouvelle tout seul pendant 30 jours. Passé ce délai sans utilisation, il faut réautoriser.

## Ce que le connecteur peut faire

| Outil | Effet |
|---|---|
| `create_prospect` | Crée une fiche au statut « à qualifier » |
| `list_prospects` | Liste les prospects, filtres par statut et par nom ou entreprise |
| `get_prospect` | Fiche complète avec son historique de messages |
| `update_prospect_status` | Déplace dans le pipeline. Passer à « contacté » date le contact du jour |
| `add_note` | Ajoute une note datée sans écraser les précédentes |

## Ce que le connecteur ne peut pas faire

- **Voir les données d'une autre équipe.** Chaque requête est filtrée sur l'équipe portée par le jeton. Un identifiant de prospect appartenant à une autre équipe renvoie « aucun prospect accessible », qu'il s'agisse d'une lecture ou d'une écriture.
- **Lire vos prompts.** Le contexte de marque reste dans le CRM.
- **Supprimer un prospect.** Volontairement absent : une suppression par erreur en conversation serait trop coûteuse.
- **Envoyer quoi que ce soit sur LinkedIn.** Le CRM ne s'y connecte pas.

La portée correspond à ce que vous voyez déjà dans le CRM : si votre compte partage une base d'équipe, le connecteur voit cette base d'équipe.

## Configuration du déploiement

Deux variables en plus de celles du CRM, dans **Vercel → Settings → Environment Variables** :

| Variable | Rôle |
|---|---|
| `MCP_JWT_SECRET` | Signe les jetons d'accès. Générer avec `openssl rand -base64 48`. La changer déconnecte tous les connecteurs branchés. |
| `MCP_PUBLIC_URL` | Optionnelle. URL publique du déploiement, déduite automatiquement sur Vercel. À renseigner si vous utilisez un domaine personnalisé. |

La migration `supabase/migrations/0005_mcp_oauth.sql` doit être jouée avant le premier branchement.

## Tester en local avant de déployer

### 1. Lancer le CRM en local

```bash
cp .env.example .env.local     # puis remplir les valeurs
npm run dev
```

Dans `.env.local`, ajouter :

```
MCP_JWT_SECRET=<sortie de: openssl rand -base64 48>
MCP_PUBLIC_URL=http://localhost:3000
```

### 2. Vérifier la découverte

```bash
curl -s http://localhost:3000/.well-known/oauth-protected-resource | jq
curl -s http://localhost:3000/.well-known/oauth-authorization-server | jq
```

Un appel sans jeton doit répondre 401 avec l'en-tête `WWW-Authenticate` :

```bash
curl -i -X POST http://localhost:3000/api/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### 3. Lancer l'inspecteur MCP

```bash
npx @modelcontextprotocol/inspector
```

L'inspecteur ouvre une interface web. Y saisir :

- **Transport type** : `Streamable HTTP`
- **URL** : `http://localhost:3000/api/mcp`

Cliquer **Connect**. L'inspecteur détecte que le serveur exige une autorisation, s'enregistre, et ouvre le flux OAuth dans le navigateur. Connectez-vous avec votre compte CRM et autorisez.

Une fois connecté, l'onglet **Tools** liste les cinq outils. Les appeler un par un avec le formulaire d'arguments.

### 4. Version ligne de commande

Utile pour scripter ou vérifier rapidement, avec un jeton déjà obtenu :

```bash
npx @modelcontextprotocol/inspector --cli \
  --transport http \
  --server-url http://127.0.0.1:3000/api/mcp \
  --header "Authorization: Bearer <votre-jeton>" \
  --method tools/list
```

Appeler un outil :

```bash
npx @modelcontextprotocol/inspector --cli \
  --transport http \
  --server-url http://127.0.0.1:3000/api/mcp \
  --header "Authorization: Bearer <votre-jeton>" \
  --method tools/call --tool-name list_prospects --tool-args-json '{}'
```

Si votre poste est derrière un proxy d'entreprise, l'inspecteur peut échouer avec `fetch failed`. Exclure la boucle locale :

```bash
NO_PROXY=localhost,127.0.0.1 npx @modelcontextprotocol/inspector --cli ...
```

## En cas de problème

**Claude n'arrive pas à se connecter** — vérifier que `MCP_JWT_SECRET` est bien définie en production. Sans elle, la route lève une erreur explicite à la première requête.

**« Votre compte n'est rattaché à aucune équipe »** — ouvrir une fois le CRM dans le navigateur avec ce compte, puis réessayer. Le rattachement se fait à la création du profil.

**Le connecteur a cessé de fonctionner d'un coup** — la valeur de `MCP_JWT_SECRET` a probablement changé. Tous les jetons émis avec l'ancienne valeur sont invalides, il faut rebrancher le connecteur.

**Révoquer l'accès d'un utilisateur** — supprimer ses lignes dans `oauth_refresh_tokens`. Son jeton d'accès en cours reste valide jusqu'à une heure, puis ne peut plus être renouvelé.
