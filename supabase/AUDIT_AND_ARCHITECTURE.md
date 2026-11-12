# Audit Audiva et architecture Supabase proposée

## Périmètre et constat

Audit statique du code présent dans le dépôt. Aucun accès à un projet Supabase distant, à son tableau de bord ou à ses données n’a été fourni : les scripts ci-dessous sont donc une proposition adaptée au dépôt, pas une migration vérifiée contre un schéma cloud déjà en production. Aucun fichier applicatif n’a été modifié et aucun enregistrement existant n’a été migré.

Le dépôt utilise Next.js 16.3.4, React 19, Zustand 5, `@supabase/supabase-js` et `@supabase/ssr`. L’intégration Supabase présente est un squelette : configuration client par variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`, services de lecture simples, absence d’authentification réelle, d’écriture, de schéma SQL, de politique RLS et de synchronisation. La route de santé répond statiquement et ne vérifie pas un service Supabase. Les formulaires de connexion/inscription et certaines actions sociales sont locaux ou inachevés. Les données sociales de démonstration ne sont pas des comptes réels.

Les zones produit repérées comprennent l’accueil, découverte/tendances, recherche, bibliothèque, morceaux, albums, favoris, playlists, lecteur, historique/statistiques, profils/artistes, paroles, authentification, amis, chat, notifications et connexion Spotify. Spotify apporte un catalogue et une lecture externes côté client ; les jetons OAuth et PKCE restent dans la session locale.

### Principaux points de code examinés

- Supabase : `src/config/supabase.js`, `src/services/supabase/client.js` et les cinq services sous `src/services/supabase/`; `src/app/api/supabase/health/route.js`.
- Authentification : `src/domaines/authentification/stores/authStore.js`, `src/domaines/authentification/services/authService.js`, formulaires et pages connexion/inscription/récupération.
- Lecture/catalogue : `src/domaines/lecteur/stores/lecteurStore.js`, `src/domaines/lecteur/services/spotifyPlayback.js`, routes de connexion/rappel Spotify.
- Bibliothèque/statistiques : `src/domaines/bibliotheque/stores/bibliothequeStore.js`, `src/domaines/statistiques/composants/StatistiquesVue.jsx`, services d’historique/intelligence.
- Playlists : `src/domaines/playlists/stores/playlistsStore.js`, `src/domaines/playlists/services/playlistsService.js`, `src/utilitaires/playlistsStorage.js`.
- Social : `src/domaines/social/stores/socialStore.js`, `src/app/chat/page.js`, `src/domaines/social/composants/GifPicker.jsx`, `src/app/notifications/page.js`, stores/services de notifications.

Les autres stores et utilitaires parcourus confirment plusieurs bases IndexedDB/localStorage et caches liés à l’interface, aux paroles, aux photos d’artistes, aux GIFs locaux et aux statistiques. Les noms de clés figurent dans la cartographie ci-dessous.

## Cartographie des données

| Données actuelles | Emplacement/fonctionnement observé | Proposition |
|---|---|---|
| Fichiers audio/vidéo importés, blobs de pochettes locales | IndexedDB `audiva-local-library` | **Rester exclusivement sur l’appareil.** Ne jamais copier de blob audio, URL `blob:` ou fichier importé dans Postgres/Storage. La future synchronisation peut enregistrer uniquement des métadonnées minimales (titre, artiste, durée, format, empreinte facultative) dans `audiva_music_items`. |
| Lecture en cours, file, volume, répétition, sortie Bluetooth | Zustand/localStorage `audiva-player`, `audiva-audio-output` | Rester local : état temporaire, dépendant de l’appareil. |
| Compte/profil/préférences | IndexedDB `audiva-profile-storage`, migration locale | Profil et préférences synchronisables dans `audiva_profiles` et `audiva_user_preferences`. Le champ mot de passe n’est jamais stocké ici ; Supabase Auth gère les identifiants. Avatar distant facultatif dans Storage privé. |
| Playlists et playlists enregistrées | Zustand + IndexedDB `audiva-playlists` | Synchroniser playlists, pistes référencées et enregistrements dans `audiva_playlists`, `audiva_playlist_items`, `audiva_playlist_saves`; séparer les pistes locales de leur blob. |
| Favoris, historique et statistiques | `audiva-player`, `audiva-listening-statistics`, `audiva-music-intelligence` | Favoris dans `audiva_favorites`; historique événementiel et statistiques dans `audiva_listening_events` seulement après choix de synchronisation. Les statistiques partagées sont des snapshots consentis (`audiva_shared_stats`). |
| Amis, demandes, conversations, messages, notifications, streaks | `audiva-social` local avec fixtures codées en dur | Synchroniser seulement après authentification et migration explicitement consentie. Ne pas migrer les faux profils/messages/notifications de démonstration. Modèle relationnel dédié dans les tables `audiva_*` sociales. |
| GIFs/stickers/médias de chat | GIF locaux en IndexedDB `audiva-chat-media`; sources externes URL | Les GIF importés peuvent rester locaux ou être envoyés explicitement vers le bucket privé `audiva-chat-media`. Garder source, licence, attribution, dimensions et chemin; ne pas aspirer de média tiers. |
| Réglages visuels, recherche récente, caches paroles/photos/recommandations | localStorage/IndexedDB | Rester locaux (cache et préférences d’interface). Aucun intérêt à répliquer le cache. |
| Spotify OAuth, jetons et PKCE | sessionStorage | Rester côté client et éphémères. **Ne pas enregistrer jetons Spotify dans la base ni Storage.** Seuls identifiants/catalogue externes nécessaires aux playlists peuvent être conservés. |

## Architecture cible

- **Auth** : Supabase Auth est la seule autorité des identifiants. Le trigger crée un profil applicatif minimal. À terme, les formulaires existants pourront appeler Auth sans supprimer le mode local ni imposer la connexion à la lecture locale.
- **Postgres** : tables préfixées `audiva_` pour éviter les collisions avec les services génériques existants (`users`, `tracks`, etc.). Chaque objet privé porte `user_id`/`owner_id`; relations, contraintes, unicité et index sont déclarés. Les préférences de confidentialité gouvernent l’accès social.
- **RLS** : activée sur chaque table applicative. Les politiques limitent lecture/écriture au propriétaire, aux membres de conversation, aux amitiés acceptées et aux playlists publiques/partagées selon le cas. Les fonctions privilégiées ont un `search_path` vide et des noms entièrement qualifiés.
- **Storage** : trois buckets privés facultatifs : `audiva-avatars`, `audiva-playlist-covers`, `audiva-chat-media`. Aucune donnée audio importée. Le SQL ajoute les politiques `storage.objects`, mais ne crée pas de bucket et ne modifie pas les tables gérées de Storage.
- **Realtime** : publication Postgres Changes limitée à messages/notifications/relations utiles. À mesure que l’usage augmente, préférer Broadcast avec autorisation plutôt que d’écouter toutes les mutations de tables.
- **Suppression** : cascade logique des lignes applicatives et file de nettoyage des chemins Storage. Un worker de confiance doit supprimer les fichiers via Storage API; supprimer une ligne dans `storage.objects` via SQL ne supprime pas le fichier.
- **Déploiement progressif** : exécuter les étapes dans l’ordre dans un projet de développement, examiner les politiques, puis intégrer les clients Auth/synchronisation par domaine. Les scripts n’insèrent aucun faux contenu et n’altèrent aucune table existante.
- **Consentement de synchronisation** : les indicateurs `sync_library_metadata`, `sync_listening_history`, `sync_favorites`, `sync_playlists` et `sync_recommendations` sont désactivés par défaut. Les RLS bloquent les écritures cloud correspondantes tant que l’utilisateur ne les active pas. Les fichiers importés restent exclus dans tous les cas.

## Scripts livrés

1. `sql/001_schema.sql` — tables, vues, contraintes et index.
2. `sql/002_functions_triggers.sql` — profils Auth, timestamps, relations sociales et file de suppression Storage.
3. `sql/003_rls_policies.sql` — RLS et permissions.
4. `sql/004_storage_realtime.sql` — politiques des buckets et publication Realtime.

Exécuter dans cet ordre depuis SQL Editor. Créer au préalable, via Dashboard > Storage (ou l’API Storage), les buckets privés nommés dans le quatrième script et appliquer les limites MIME/taille indiquées dans les commentaires. Ne pas créer/modifier `storage.buckets` par SQL.

## Limites de l’audit

Audit du dépôt local, sans exécution de l’application, tests, inspection d’un compte Supabase, ni validation par migration sur un projet réel. Certaines données sauvegardées localement peuvent avoir des variantes historiques ; toute migration de navigateur devra commencer par une prévisualisation et un consentement, avec déduplication et possibilité d’annulation. Avant production, tester les politiques avec deux comptes distincts et valider les chemins de Storage.
