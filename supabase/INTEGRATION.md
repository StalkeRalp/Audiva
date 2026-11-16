# Mise en service Supabase d’Audiva

Le code utilise les tables `audiva_*` créées par les scripts 001 à 004. La migration complémentaire `sql/005_app_integration.sql` ajoute la recherche de profils, les invitations, l’effacement privé d’un fil et la suppression de notifications. Exécutez-la une fois dans le SQL Editor Supabase.

## Variables locales

Copiez les identifiants **publics** depuis Project Settings → API dans `.env` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-or-publishable-key>
```

Le client n’utilise jamais de clé `service_role`. Redémarrez `next dev` après l’ajout des variables.

## Authentification

Dans Authentication → URL Configuration, ajoutez les URL de retour de chaque environnement. Pour le développement local :

```text
http://localhost:3000/auth/callback
```

Activez les méthodes e-mail et Google souhaitées dans Authentication → Providers. Le bouton Google nécessite aussi que le fournisseur OAuth Google soit configuré dans Supabase.

### Codes e-mail OTP avec EmailJS

Audiva garde Supabase comme autorité d’authentification : Supabase génère et valide l’OTP, et son **Send Email Hook** transmet l’e-mail via EmailJS. Le navigateur ne fabrique ni ne valide les codes.

La fonction `functions/audiva-auth-email` utilise le service `service_4dfszxi` et le modèle `template_3wo5vr8`. Dans le modèle EmailJS, configurez le destinataire avec `{{to_email}}` et ajoutez les variables `{{otp}}`, `{{action_label}}` et `{{confirmation_url}}`. Le bouton/lien de confirmation peut utiliser `{{confirmation_url}}`; le code est `{{otp}}`.

1. Déployez la fonction sans vérification JWT de la passerelle (la fonction vérifie elle-même la signature du webhook) :

   ```sh
   supabase functions deploy audiva-auth-email --no-verify-jwt --project-ref fvxbdtskpnskhcwaulfw
   ```

2. Dans les secrets de la fonction, définissez `EMAILJS_PUBLIC_KEY` avec la clé publique EmailJS, `EMAILJS_PRIVATE_KEY` avec sa clé privée (requise en mode strict) et `SEND_EMAIL_HOOK_SECRET` avec le secret créé dans Authentication → Hooks. Les identifiants du service et du modèle sont déjà renseignés dans la fonction.

   ```sh
   supabase secrets set EMAILJS_PUBLIC_KEY="<clé-publique-EmailJS>" EMAILJS_PRIVATE_KEY="<clé-privée-EmailJS>" SEND_EMAIL_HOOK_SECRET="<secret-du-hook>" --project-ref fvxbdtskpnskhcwaulfw
   ```

3. Dans Authentication → Hooks, activez **Send Email** comme hook HTTP et utilisez :

   ```text
   https://fvxbdtskpnskhcwaulfw.supabase.co/functions/v1/audiva-auth-email
   ```

4. Laissez le fournisseur e-mail activé dans Authentication → Providers. Après l’inscription, Audiva propose de saisir le code reçu; le bouton de renvoi demande un nouvel OTP à Supabase.

Ne mettez jamais les clés EmailJS dans le navigateur ni dans `.env` public. La clé privée reste dans les secrets de la fonction. Le hook signé et son secret empêchent un appel non autorisé de provoquer des envois. EmailJS limite son endpoint REST à un envoi par seconde; la fonction en tient compte pour les changements d’adresse sécurisés.

## Storage

Le script 004 configure les politiques mais Supabase ne crée pas les buckets par SQL. Dans Storage, créez ces buckets **privés** :

| Bucket | Usage | Types attendus |
|---|---|---|
| `audiva-avatars` | Photos de profil | JPEG, PNG, WebP |
| `audiva-playlist-covers` | Pochettes personnalisées | JPEG, PNG, WebP |
| `audiva-chat-media` | GIFs importés dans les conversations | GIF, WebP, JPEG, PNG |

Les fichiers audio importés ne sont jamais envoyés. Seules leurs métadonnées peuvent être synchronisées lorsque l’utilisateur active l’option correspondante dans Paramètres.
