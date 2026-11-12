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

## Storage

Le script 004 configure les politiques mais Supabase ne crée pas les buckets par SQL. Dans Storage, créez ces buckets **privés** :

| Bucket | Usage | Types attendus |
|---|---|---|
| `audiva-avatars` | Photos de profil | JPEG, PNG, WebP |
| `audiva-playlist-covers` | Pochettes personnalisées | JPEG, PNG, WebP |
| `audiva-chat-media` | GIFs importés dans les conversations | GIF, WebP, JPEG, PNG |

Les fichiers audio importés ne sont jamais envoyés. Seules leurs métadonnées peuvent être synchronisées lorsque l’utilisateur active l’option correspondante dans Paramètres.
