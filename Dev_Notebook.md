# Dev Notebook — ANO V2.1.1.0.1
> **Rédigé par un expert fullstack pour passage de relais.**
> Dernière mise à jour : 2026-02-22

---

## 0. Vue d'ensemble du Projet

**ANO** est un réseau social d'anonymat structuré, inspiré de la tradition culturelle du masque africain ("Ano"). L'utilisateur crée un **masque** (pseudonyme anonyme) et publie des **confessions** (texte, bientôt audio). L'identité réelle est cachée, mais la présence émotionnelle est authentique.

**Stack Technique :**
| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions, Turbopack) |
| Backend / DB | Supabase (PostgreSQL, Auth, Storage, RLS) |
| Styling | TailwindCSS v4 + CSS Variables |
| UI Components | shadcn/ui (`@/components/ui`) |
| Native Wrapper | Capacitor (`@capacitor/core`, `@capacitor/android`) |
| Typage | TypeScript strict |
| Font | Outfit (Google Fonts) |
| Branche Git | `upneu` |

---

## 1. Architecture du Projet

```
ANO V2.1.1.0.1/
├── android/                    # Projet natif Android (généré par Capacitor)
├── assets/                     # Sources icônes (logo.png, splash.png 1024px+)
├── public/                     # Assets statiques PWA (icon.png, manifest.json, patterns/)
├── src/
│   ├── app/                    # Routes Next.js (App Router)
│   │   ├── page.tsx            # Redirection vers /feed
│   │   ├── layout.tsx          # Root Layout (PWA meta, Outfit font, AppLayout)
│   │   ├── globals.css         # Design tokens CSS + Satir patterns
│   │   ├── feed/               # Feed principal (page + actions)
│   │   ├── login/              # Auth hybride (Email Magic Link + OTP téléphone)
│   │   ├── auth/callback/      # Callback OAuth (page.tsx CLIENT SIDE — voir §4)
│   │   ├── profile/            # Profil masque public
│   │   ├── settings/           # Paramètres utilisateur + Danger Zone
│   │   ├── notifications/      # Panneau de notifications
│   │   ├── interactions/       # Actions : Likes, Commentaires, Karma
│   │   ├── wizard/             # Onboarding (création du masque)
│   │   ├── validation/         # Validation (post-wizard)
│   │   ├── policy/             # Pages légales
│   │   │   ├── privacy/        # Politique de confidentialité
│   │   │   └── terms/          # CGU
│   │   └── admin/              # Administration
│   ├── components/
│   │   ├── layout/             # Header, BottomNav, AppLayout
│   │   ├── confessions/        # ConfessionCard, ConfessionComposer
│   │   ├── audio/              # FeedAudioPlayer, SimpleAudioRecorder
│   │   ├── notifications/      # Notifications panel
│   │   ├── settings/           # DangerZone component
│   │   ├── satir/              # Composants d'ambiance culturelle
│   │   └── ui/                 # shadcn/ui components (button, card, etc.)
│   ├── lib/
│   │   ├── supabase/           # client.ts, server.ts, middleware.ts, types
│   │   └── audio/              # processor.ts (DSP pipeline floutage vocal)
│   ├── contexts/               # ComposerContext (ouverture globale du composer)
│   ├── middleware.ts            # Supabase session refresh sur toutes routes
│   └── types/                  # database.types.ts (généré depuis Supabase)
├── supabase/migrations/        # SQL migrations (voir §3)
├── capacitor.config.ts         # Config Capacitor (SSR mode, tunnel URL)
└── next.config.ts              # Config Next.js (React Compiler, CORS headers)
```

---

## 2. Features Implémentées

### 2.1 Authentification

- **Mode hybride** : Login par **téléphone (OTP SMS)** ou **email (Magic Link Supabase)**.
- Flux en **3 étapes** dans `src/app/login/page.tsx` :
  1. Saisie téléphone/email
  2. Vérification OTP ou attente du magic link
  3. Redirection vers `/feed` (utilisateur existant) ou `/wizard` (nouveau compte)
- **Middleware** (`src/middleware.ts`) : Rafraîchit la session Supabase sur chaque requête. Toutes les routes privées sont protégées.
- **Callback OAuth** : Converti en page client-side (`src/app/auth/callback/page.tsx`) pour compatibilité Capacitor. Il échange le `code` via `supabase.auth.exchangeCodeForSession()`.
- **Checkbox CGU** : L'utilisateur doit cocher "J'accepte les CGU" pour pouvoir soumettre le formulaire. Le bouton de connexion est bloqué si non coché.

### 2.2 Confessions (Feed)

- **ConfessionComposer** : Composer flottant, limité à **1000 mots**. Ouvert via le FAB (Floating Action Button) depuis n'importe quelle page (via `ComposerContext`).
- **ConfessionCard** : Affiche les confessions avec un "Voir plus / Voir moins" au-delà de 300 caractères.
- **Interactions** (`src/app/interactions/actions.ts`) : Likes, Commentaires, Réponses (Reply). Chaque interaction déclenche une notification à l'auteur.

### 2.3 Masques & Profils

- Un utilisateur Supabase = **un masque** (identité anonyme avec nom, avatar, bio).
- Création guidée via le **Wizard** (`/wizard`).
- Profil public visible à `/profile`.

### 2.4 Veille (Suivre)

- Table `follows` en DB.
- `toggleVeille` (Server Action dans `src/app/interactions/actions.ts`) : permet de suivre/ne-plus-suivre un masque.
- Notification automatique envoyée au suivi lors d'une nouvelle confession.
- UI : `VeillerButton.tsx` (Optimistic UI, micro-animations).

### 2.5 Notifications

- Table `notifications` en DB (`type`, `actor_id`, `target_user_id`, `confession_id`).
- Types supportés : `like`, `comment`, `reply`, `follow`, `karma_milestone`.
- Composant : `Notifications.tsx` dans le Header.

### 2.6 Système Karma

- **Karma** = score de comportement d'un utilisateur.
- Implémenté dans les interactions : likes reçus, confessions populaires.
- **Sanctions automatiques** selon le karma (voir migrations).
- ⚠️ Les notifications de Karma Milestone (`karma_milestone`) **nécessitent un trigger DB** qui n'est pas encore créé. Feature partiellement implémentée.

### 2.7 Paramètres & RGPD

- Page `/settings` avec un composant `DangerZone` :
  - **Supprimer son contenu** : Efface confessions, commentaires via la RPC `wipe_user_content`.
  - **Supprimer son compte** : Efface tout + le compte Supabase via la RPC `delete_own_account`.
- Les RPCs sont dans `supabase/migrations/20260218140000_account_deletion_rpc.sql`.

### 2.8 Pages Légales

- `/policy/privacy` : Politique de confidentialité (rédigée dans l'esprit du projet).
- `/policy/terms` : Conditions Générales d'Utilisation.

### 2.9 Audio (POSTPONÉ À V2)

- **Architecture complète conçue** mais intégration désactivée pour la bêta.
- Pipeline DSP dans `src/lib/audio/processor.ts` : Pitch shifting + Formant shifting + Noise injection.
- Composant `SimpleAudioRecorder.tsx` existant mais non intégré dans le composer.
- Bucket Supabase `audio-confessions` créé avec RLS (migration `20260209040000_audio_confessions.sql`).
- **Ne pas activer** sans tester sur vrai device (WebAudio + WebView natif = complexité élevée).

---

## 3. Base de Données (Supabase)

### 3.1 Tables Clés

| Table | Description |
|---|---|
| `profiles` | Profil/masque de l'utilisateur (lié à `auth.users`) |
| `confessions` | Les confessions publiées |
| `interactions` | Likes et commentaires |
| `notifications` | Toutes les notifications in-app |
| `follows` | Liens Veille (follower → mask) |
| `karma_logs` | Historique des événements karma |

### 3.2 Migrations (ordre chronologique)

```
20260207202000_enable_masks_read.sql     — RLS lecture des masques
20260207202500_fix_masks_rls.sql         — Correction RLS masques
20260207210000_enable_messaging_rls.sql  — RLS messages
20260207220000_confession_reports.sql    — Signalement de confessions
20260207230000_time_based_moderation.sql — Karma + sanctions automatiques
20260209015800_veiller_table.sql         — Table follows (Veille)
20260209040000_audio_confessions.sql     — Bucket audio + table audio_confessions
20260209050000_ensure_notifications.sql  — Table notifications + helpers
20260218140000_account_deletion_rpc.sql  — RPCs suppression compte/données
```

> **Important** : Appliquer ces migrations **dans l'ordre** sur tout nouveau projet Supabase.

### 3.3 Commandes Supabase Utiles

```bash
# Appliquer les migrations en local
supabase db push

# Regénérer les types TypeScript
supabase gen types typescript --project-id <ID> > src/types/database.types.ts

# Lier un nouveau projet
supabase link --project-ref <REF>
```

---

## 4. Points Techniques Critiques

### 4.1 Auth Callback (Ne pas revenir à route.ts !)

L'ancienne implémentation utilisait un **Route Handler** (`route.ts`) pour le callback OAuth. Cela est **incompatible avec Capacitor** (WebView). Il a été converti en **page client-side** :

```
src/app/auth/callback/page.tsx — Client Component ('use client')
```

Ce composant lit le `?code=` dans l'URL et appelle `supabase.auth.exchangeCodeForSession(code)` côté client. **Ne jamais recréer un `route.ts` dans ce dossier.**

### 4.2 Déploiement Natif (Stratégie SSR Wrapper)

Next.js avec Server Actions est **incompatible avec `output: 'export'`** (export statique). La stratégie retenue est :

> **Capacitor pointe vers l'URL de production / tunnel.** L'app native est une WebView qui charge l'app Next.js déployée sur le serveur.

**`capacitor.config.ts`** actuel :
```typescript
server: {
  url: 'https://barrier-policies-society-scholars.trycloudflare.com', // ← TUNNEL DEV
  cleartext: true,
  androidScheme: 'https'
}
```

> ⚠️ **AVANT LE DÉPLOIEMENT STORE** : Remplacer l'URL du tunnel par l'URL de production finale (ex: `https://app.ano-app.com`).

### 4.3 Header & BottomNav (Pas de Props)

`Header` et `BottomNav` n'acceptent **aucune prop**. Ne pas passer `currentUserId` ou autre — cela déclenche une erreur de build TypeScript. L'état utilisateur est géré via Supabase directement dans les composants.

### 4.4 `shadcn/ui` et `components.json`

Le fichier `components.json` a été créé lors de l'installation (base color: **Neutral**). Pour ajouter de nouveaux composants :
```bash
npx shadcn@latest add <nom-composant>
```
**Ne pas overwrite** les composants existants (ex: `button.tsx`) lors de l'ajout.

---

## 5. Design & Identité Visuelle

### 5.1 Palette (CSS Variables dans `globals.css`)

| Token | HSL | Usage |
|---|---|---|
| `--background` | 213 55% 6% | Indigo nuit profonde |
| `--primary` | 248 65% 62% | Violet-indigo (CTAs) |
| `--accent` | 35 48% 52% | Bronze chaleureux |
| `--foreground` | 32 25% 94% | Blanc cassé |
| `--muted-foreground` | 30 15% 65% | Texte secondaire |

### 5.2 Composants Culturels

- **FAB (Floating Action Button)** : Cercle 70px, texture pagne Satir (`/patterns/satir-fab-texture.png`), lueur violette. **Ne pas changer la taille ou le z-index (100).**
- **BottomNav** : Fond demi-transparent `bg-background/60 backdrop-blur-xl`. Safe area bottom via `env(safe-area-inset-bottom)`.
- **Patterns Satir** : Assets dans `/public/patterns/` (SVG + PNG). Utilisés en background sur certains éléments.
- **Font** : **Outfit** (Google Fonts), chargée dans `layout.tsx`.

---

## 6. État du Déploiement Natif

### 6.1 Ce qui est FAIT ✅

- Capacitor Core + CLI installés.
- Projet Android initialisé (`android/` folder).
- Assets (icônes + splash) générés pour Android (87 fichiers, toutes densités).
- Permission `RECORD_AUDIO` ajoutée à `AndroidManifest.xml`.
- `capacitor.config.ts` configuré (App ID: `com.ano.app`).
- Dossier `android/` synchronisé avec `npx cap sync android`.

### 6.2 Ce qui RESTE à faire avant le Store 🚧

#### Immédiat (technique)

1. **Installer Android Studio** (version Panda 1 — `2025.3.1 Patch 1` — la plus récente stable).
2. Ouvrir le projet : `File > Open > [racine du projet]/android`.
3. Laisser Gradle synchroniser.
4. Connecter un téléphone Android (ou lancer un émulateur API 24+).
5. Cliquer Play ▶️ pour tester l'APK en debug.

#### Avant mise en production sur le Store

6. **Mettre à jour `capacitor.config.ts`** : Remplacer l'URL du tunnel par l'URL de production réelle.
7. **Configurer le Signing** (Android) : Créer un keystore, configurer `build.gradle`.
8. **Compte Google Play Console** (25$ unique) + fiche app.
9. **iOS** : Nécessite un Mac + compte Apple Developer (99$/an) + Xcode.
10. **Deep Links Auth** : Configurer le scheme `anoapp://` dans Supabase (Auth > URL Configuration) et dans `AndroidManifest.xml` (intent-filter).

#### Notification Karma Milestone (feature incomplète)

11. Créer un **trigger Supabase** qui déclenche l'insertion dans `notifications` quand le karma atteint un palier (100, 500, 1000, etc.).

---

## 7. Variables d'Environnement

Le fichier `.env.local` doit contenir :

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

> Ne **jamais** committer `.env.local`. Il est dans `.gitignore`.

---

## 8. Commandes Utiles

```bash
# Développement local
npm run dev

# Build de vérification (sans export statique)
npm run build

# Synchroniser les modifications web vers Android
npx cap sync android

# Ouvrir Android Studio
npx cap open android
# (Si Android Studio n'est pas trouvé, l'ouvrir manuellement puis File > Open > /android)

# Tunnel Cloudflare (accès mobile local)
cloudflared tunnel --url http://localhost:3000
```

---

## 9. Glossaire du Projet

| Terme | Définition |
|---|---|
| **Masque** | L'identité anonyme de l'utilisateur. Équivalent d'un "compte". |
| **Confession** | Un post/publication fait par un masque. |
| **Veiller** | Suivre un masque (équivalent de "Follow"). |
| **Sutura** | Motifs culturels du pagne utilisés pour le design. |
| **FAB** | Floating Action Button — bouton "+" pour créer une confession. |
| **Karma** | Score de réputation calculé sur les interactions reçues. |
| **DSP** | Digital Signal Processing — pipeline de floutage audio. |
| **SSR Wrapper** | Stratégie Capacitor : la WebView charge une URL distante (Next.js en prod). |
