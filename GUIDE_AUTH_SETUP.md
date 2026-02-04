# 🔐 Guide d'Authentification : Réseaux Sociaux & Email

Ce guide explique comment configurer les méthodes d'authentification **gratuites** pour ANO.

> **Note importante** : L'authentification par SMS (payante) a été retirée. Nous utilisons désormais **Email (Magic Link)** et **Réseaux Sociaux**. Le numéro de téléphone de l'utilisateur est collecté *après* la connexion, dans le "Wizard".

---

## 1. Email / Magic Link 📧 (Méthode de Secours)

C'est la méthode activée par défaut, gratuite et immédiate.

*   **Configuration** : Aucune (Activé par défaut dans Supabase).
*   **Fonctionnement** : L'utilisateur reçoit un lien par email pour se connecter.
*   **⚠️ Test sur Mobile (Local)** : Si vous testez depuis votre iPhone sur le même Wi-Fi, le lien reçu par email sera de type `http://localhost:3000/...`.
    *   Il faut remplacer `localhost` par l'adresse IP de votre PC (ex: `192.168.1.6`) avant de cliquer, sinon l'iPhone ne trouvera pas le serveur.

---

## 2. Google Login 🇬

1.  Allez sur [Google Cloud Console](https://console.cloud.google.com/).
2.  Créez un **Nouveau Projet** (ex: "Ano App").
3.  Menu gauche > **APIs & Services** > **OAuth consent screen**.
    *   Sélectionnez **External**.
    *   Remplissez App Name ("ANO"), email, etc.
    *   Cliquez sur Save.
4.  Menu gauche > **Credentials**.
    *   Cliquez **+ CREATE CREDENTIALS** > **OAuth client ID**.
    *   Application type : **Web application**.
    *   Name : "Ano Auth".
    *   **Authorized JavaScript origins** : `https://<votre-projet>.supabase.co` (Trouvez l'URL exacte dans Supabase > Settings > API).
    *   **Authorized redirect URIs** : `https://<votre-projet>.supabase.co/auth/v1/callback`.
5.  Copiez le **Client ID** et le **Client Secret**.
6.  Retournez sur **Supabase** > Auth > Providers > **Google**.
7.  Activez-le et collez les ID et Secret. **Save**.

---

## 3. Facebook Login 🇫

1.  Allez sur [Meta for Developers](https://developers.facebook.com/).
2.  **My Apps** > **Create App** > "Authenticate and request data from users with Facebook Login" > Next.
3.  Remplissez "ANO" et votre email.
4.  Dans le tableau de bord, trouvez "Facebook Login" et cliquez **Set up**.
5.  Choisissez **Web**.
6.  Site URL : `https://<votre-projet>.supabase.co/`.
7.  Allez dans **Settings > Basic** (menu gauche).
    *   Notez **App ID** et **App Secret**.
8.  Allez dans **Facebook Login > Settings**.
    *   Activez "Client OAuth Login" et "Web OAuth Login".
    *   **Valid OAuth Redirect URIs** : `https://<votre-projet>.supabase.co/auth/v1/callback`.
9.  Retournez sur **Supabase** > Auth > Providers > **Facebook**.
10. Activez et collez App ID / App Secret.

---

## 4. Apple Login 🍎 (iOS)

*Note : Nécessite un compte Apple Developer payant (99$/an).*

1.  Allez sur [Apple Developer Console](https://developer.apple.com/account/).
2.  **Certificates, Identifiers & Profiles** > **Identifiers**.
    *   Créez un **App ID** (ex: `com.ano.app`).
    *   Créez un **Service ID** (ex: `com.ano.app.service`).
    *   Configurez le Service ID : Activez "Sign In with Apple".
    *   Edit : Mettez votre domaine Supabase dans "Domains and Subdomains" et l'URL de callback dans "Return URLs" (`https://<votre-projet>.supabase.co/auth/v1/callback`).
    *   Save.
3.  **Keys** > Create a Key.
    *   Nom : "Ano Auth Key".
    *   Cochez "Sign In with Apple".
    *   Configure : Liez-la à votre App ID.
    *   Download le fichier `.p8`.
4.  Sur **Supabase** > Auth > Providers > **Apple**.
    *   Activez.
    *   **Service ID** : `com.ano.app.service`.
    *   **Team ID** : (Trouvé en haut à droite de la console Apple).
    *   **Key ID** : (ID de la clé créée).
    *   **Private Key** : Contenu du fichier `.p8`.
