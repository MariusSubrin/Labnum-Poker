# Configuration Supabase — Poker Ledger

Ce document explique pas à pas comment connecter l'application à un projet Supabase avec PostgreSQL et Row Level Security (RLS).

---

## 1. Créer le projet Supabase

1. Rendez-vous sur [https://supabase.com](https://supabase.com) et connectez-vous.
2. Cliquez sur **"New Project"**.
3. Choisissez un nom (ex: `Poker Ledger`), un mot de passe pour la base de données et la région la plus proche (ex: `eu-west-3` / Paris ou `eu-central-1` / Francfort).
4. Cliquez sur **"Create new project"** et patientez ~2 minutes pendant le provisionnement.

---

## 2. Exécuter la migration SQL

1. Dans votre tableau de bord Supabase, ouvrez l'onglet **SQL Editor** dans le menu latéral gauche.
2. Cliquez sur **"New query"**.
3. Copiez l'intégralité du contenu du fichier [`supabase/migrations/20261028000001_initial_schema.sql`](./migrations/20261028000001_initial_schema.sql).
4. Collez-le dans l'éditeur SQL et cliquez sur **"Run"** (ou `Ctrl+Enter`).
5. Vérifiez que la console affiche `Success. No rows returned`.

### Ce que cette migration configure :
- **Tables** : `profiles`, `groups`, `group_members`, `daily_results`, `group_invitations`.
- **Intégrité stricte des jetons** : contrainte `chk_detailed_total_exact_match` forçant arithmétiquement :
  $$\text{total} = \text{bleu}\times 1 + \text{rouge}\times 5 + \text{noir}\times 10 + \text{vert}\times 25 + \text{blanc}\times 100$$
- **Contrainte mode direct** : interdiction d'injecter des valeurs partielles en mode total direct (`chk_total_mode_counts_null`).
- **Unicité quotidienne** : un seul enregistrement par joueur, par groupe et par date (`uq_result_per_day`).
- **Sécurité RLS** activée sur toutes les tables sans risque de boucle récursive via fonctions `SECURITY DEFINER`.
- **Procédures RPC** :
  - `join_group_with_code` : validation atomique et utilisation concurrente protégée (`FOR UPDATE`).
  - `create_group_with_owner` : création d'un groupe avec attribution du rôle propriétaire.
  - `archive_group_member` : archivage sécurisé d'un membre par le propriétaire.

---

## 3. Configuration de l'authentification (Magic Link)

1. Dans Supabase, allez dans **Authentication** > **Providers** > **Email**.
2. Activez le fournisseur **Email**.
3. (Recommandé) Désactivez "Confirm email" si vous souhaitez tester immédiatement en développement sans serveur SMTP externe, ou configurez le lien magique.
4. Dans **Authentication** > **URL Configuration** :
   - Site URL : `http://localhost:5173` (en développement local) ou votre URL finale de production.
   - Redirect URLs : ajoutez `http://localhost:5173/**` et `http://localhost:5174/**`.

---

## 4. Renseignement des variables d'environnement

1. Dans Supabase, rendez-vous dans **Project Settings** > **API**.
2. Copiez l'URL du projet (**Project URL**) et la clé publique anonyme (**anon public key**).
3. À la racine du projet `Labnum Poker`, créez ou modifiez le fichier `.env` (non suivi par Git) :
   ```env
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=votre-cle-anon-publique-ici
   VITE_DEFAULT_TIMEZONE=Europe/Paris
   ```
4. Relancez le serveur de développement :
   ```bash
   npm run dev
   ```
