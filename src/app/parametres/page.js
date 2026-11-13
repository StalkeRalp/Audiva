"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AccountSetting01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  ImageUpload01Icon,
  MusicNote01Icon,
  Notification03Icon,
  Settings01Icon,
  VolumeHighIcon,
} from "@hugeicons/core-free-icons";
import { useLecteurControlsStore } from "@/domaines/lecteur/stores/lecteurStore";
import { useAuthStore } from "@/domaines/authentification/stores/authStore";
import { getAuthProfileImage } from "@/domaines/authentification/utilitaires/profile";
import { loadProfileSettings, saveProfileSettings } from "@/utilitaires/profilStorage";
import { signOut, updateEmail, updatePassword } from "@/domaines/authentification/services/authService";
import { loadCloudAccount, saveCloudAccount } from "@/services/supabase/account";

const defaultProfile = { name: "", email: "", avatar: "", avatarPath: "", bio: "" };
const defaultPreferences = {
  showStats: true,
  allowFriends: true,
  audioQuality: "high",
  autoplay: true,
  compactPlayer: false,
  newReleases: true,
  newMessages: true,
  friendActivity: true,
  explicitContent: false,
};

export default function ParametresPage() {
  const { volume, setVolume } = useLecteurControlsStore();
  const clearUser = useAuthStore((state) => state.clearUser);
  const user = useAuthStore((state) => state.user);
  const providerAvatar = getAuthProfileImage(user);
  const router = useRouter();
  const photoInput = useRef(null);
  const [profile, setProfile] = useState(defaultProfile);
  const [password, setPassword] = useState("");
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [cloudSyncMessage, setCloudSyncMessage] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);
  const [cloudPreferences, setCloudPreferences] = useState({ sync_library_metadata: false, sync_listening_history: false, sync_favorites: false, sync_playlists: false, sync_recommendations: false });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const stored = await loadProfileSettings();
        if (!active) return;
        setProfile(current => ({ ...current, name: user?.user_metadata?.display_name || user?.email?.split("@")[0] || current.name, email: user?.email || "", ...stored?.profile, avatar: stored?.profile?.avatar || providerAvatar || current.avatar }));
        setPreferences(current => ({ ...current, ...stored?.preferences }));
      } catch { if (active) setSaveError("Impossible de charger vos réglages sur cet appareil."); }
      if (!user?.id) return;
      try {
        const cloud = await loadCloudAccount(user.id);
        if (!active) return;
        setProfile(current => ({ ...current, ...cloud.profile, avatar: cloud.profile.avatar || current.avatar || providerAvatar }));
        setPreferences(current => ({ ...current, ...(cloud.preferences.preferences || {}) }));
        setCloudPreferences({ sync_library_metadata: cloud.preferences.sync_library_metadata, sync_listening_history: cloud.preferences.sync_listening_history, sync_favorites: cloud.preferences.sync_favorites, sync_playlists: cloud.preferences.sync_playlists, sync_recommendations: cloud.preferences.sync_recommendations });
      } catch (error) { if (active) setSaveError(error.message || "Le profil Supabase n’a pas pu être chargé."); }
    };
    const timer = window.setTimeout(load, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [user?.id, user?.email, user?.user_metadata?.display_name, providerAvatar]);

  useEffect(() => {
    const handleSync = event => setCloudSyncMessage(event.detail?.status === "done" ? "Synchronisation Supabase terminée." : event.detail?.message || "La synchronisation Supabase a échoué.");
    window.addEventListener("audiva-cloud-sync", handleSync);
    return () => window.removeEventListener("audiva-cloud-sync", handleSync);
  }, []);

  const updateProfile = (key, value) => setProfile((current) => ({ ...current, [key]: value }));
  const togglePreference = (key) => setPreferences((current) => ({ ...current, [key]: !current[key] }));

  const save = async () => {
    try {
      const profileToSave = profile.avatar === providerAvatar && !profile.avatarPath ? { ...profile, avatar: "" } : profile;
      await saveProfileSettings(profileToSave, preferences);
      if (user?.id) {
        await saveCloudAccount(user.id, profileToSave, preferences, cloudPreferences);
        if (password) await updatePassword(password);
        if (profile.email && profile.email !== user.email) await updateEmail(profile.email);
        window.dispatchEvent(new Event("audiva-sync-requested"));
      }
      window.dispatchEvent(new Event("audiva-profile-updated"));
      setPassword("");
      setSaveError("");
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } catch {
      setSaveError("Impossible d’enregistrer les modifications. Vérifiez la connexion, les droits Storage et la taille de la photo.");
    }
  };

  const selectPhoto = (event) => {
    const [file] = event.target.files || [];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPhotoError("Choisissez une image valide pour votre photo de profil.");
      return;
    }
    if (file.size > 1_500_000) {
      setPhotoError("La photo doit faire moins de 1,5 Mo pour être enregistrée sur cet appareil.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateProfile("avatar", String(reader.result));
      setPhotoError("");
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="min-h-screen bg-[#060b18] pb-32 text-[#eff4ff]">
        <section className="audiva-theme-banner relative isolate min-h-[300px] overflow-hidden border-b border-white/8 bg-[#081122] px-5 py-12 sm:px-10 lg:px-14">
          <Image src="/parametre1.jpg" alt="" fill priority className="-z-20 object-cover object-center opacity-60" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#060b18_4%,rgba(6,11,24,.74)_48%,rgba(6,11,24,.3)),linear-gradient(180deg,transparent_45%,#060b18)]" />
          <div className="mx-auto flex min-h-[204px] max-w-[1500px] items-end gap-5">
            <div className="grid h-24 w-24 place-items-center bg-[#102044] text-[#72eee7]">
              <HugeiconsIcon icon={Settings01Icon} size={45} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#83eee8]">Votre compte Audiva</p>
              <h1 className="mt-2 text-4xl font-black text-white sm:text-6xl">Paramètres</h1>
              <p className="mt-3 text-sm text-[#c1cce3]">Gérez votre profil, votre confidentialité et vos préférences.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-[1500px] gap-5 px-4 py-8 sm:px-7 xl:grid-cols-[minmax(0,1fr)_320px] xl:px-9">
          <div className="space-y-5">
            <Panel icon={AccountSetting01Icon} title="Profil">
              <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center">
                <div
                  aria-label="Aperçu de la photo de profil"
                  className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-[#72eee7] bg-[#26375c] bg-cover bg-center text-2xl font-black text-white"
                  style={profile.avatar ? { backgroundImage: `url(${profile.avatar})` } : undefined}
                >
                  {!profile.avatar && profile.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-extrabold text-white">Photo de profil</p>
                  <p className="mt-1 text-xs text-[#91a0bd]">PNG, JPG ou WebP · 1,5 Mo maximum</p>
                  <input ref={photoInput} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={selectPhoto} />
                  <button type="button" onClick={() => photoInput.current?.click()} className="mt-3 inline-flex items-center gap-2 border border-[#72eee7]/45 px-3 py-2 text-xs font-bold text-[#bffffa] transition hover:bg-[#72eee7]/10">
                    <HugeiconsIcon icon={ImageUpload01Icon} size={17} />
                    Choisir une photo
                  </button>
                  {profile.avatar && <button type="button" onClick={() => updateProfile("avatar", "")} className="ml-3 text-xs font-bold text-[#aebbd7] hover:text-white">Supprimer</button>}
                  {photoError && <p className="mt-2 text-xs font-medium text-rose-200">{photoError}</p>}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nom affiché" value={profile.name} onChange={(value) => updateProfile("name", value)} />
                <Field label="E-mail" value={profile.email} type="email" onChange={(value) => updateProfile("email", value)} />
                <Field label="Biographie" value={profile.bio || ""} onChange={(value) => updateProfile("bio", value)} placeholder="Quelques mots sur vous" />
                <Field label="Nouveau mot de passe" value={password} type="password" placeholder="••••••••" onChange={setPassword} />
              </div>
              <button type="button" onClick={save} className="mt-5 bg-[#72eee7] px-4 py-3 text-sm font-extrabold text-[#061426] transition hover:brightness-110 active:scale-[.98]">Enregistrer les modifications</button>
              {saveError && <p role="alert" className="mt-3 text-sm font-medium text-rose-200">{saveError}</p>}
            </Panel>

            <Panel icon={AccountSetting01Icon} title="Confidentialité">
              <Toggle label="Statistiques visibles par mes amis" description="Vos amis peuvent comparer leurs habitudes d’écoute aux vôtres." value={preferences.showStats} onChange={() => togglePreference("showStats")} />
              <Toggle label="Autoriser les invitations d’amis" description="Autorise les autres membres à vous envoyer un lien d’invitation." value={preferences.allowFriends} onChange={() => togglePreference("allowFriends")} />
            </Panel>

            {user && <Panel icon={AccountSetting01Icon} title="Sauvegarde Supabase">
              <p className="py-3 text-xs leading-5 text-[#91a0bd]">Activez séparément les données que vous souhaitez synchroniser. Les fichiers audio importés restent sur cet appareil.</p>
              <Toggle label="Métadonnées de la bibliothèque" description="Titres, artistes et pochettes, sans fichier audio. Nécessaire pour synchroniser les favoris ou les titres des playlists." value={cloudPreferences.sync_library_metadata} onChange={() => setCloudPreferences(value => { const enabled = !value.sync_library_metadata; return { ...value, sync_library_metadata: enabled, ...(enabled ? {} : { sync_favorites: false, sync_playlists: false }) }; })} />
              <Toggle label="Historique d’écoute et statistiques" description="Écoutes, durées et dates pour retrouver vos statistiques." value={cloudPreferences.sync_listening_history} onChange={() => setCloudPreferences(value => ({ ...value, sync_listening_history: !value.sync_listening_history }))} />
              <Toggle label="Favoris" value={cloudPreferences.sync_favorites} onChange={() => setCloudPreferences(value => ({ ...value, sync_library_metadata: true, sync_favorites: !value.sync_favorites }))} />
              <Toggle label="Playlists Audiva" description="Noms, descriptions, visibilité, pochettes et ordre des titres." value={cloudPreferences.sync_playlists} onChange={() => setCloudPreferences(value => ({ ...value, sync_library_metadata: true, sync_playlists: !value.sync_playlists }))} />
              <Toggle label="Préférences de recommandation" value={cloudPreferences.sync_recommendations} onChange={() => setCloudPreferences(value => ({ ...value, sync_recommendations: !value.sync_recommendations }))} />
            </Panel>}

            <Panel icon={Notification03Icon} title="Notifications">
              <Toggle label="Nouvelles sorties" description="Recevez les sorties des artistes et sélections que vous suivez." value={preferences.newReleases} onChange={() => togglePreference("newReleases")} />
              <Toggle label="Messages privés" description="Soyez prévenu lorsqu’un ami vous écrit ou partage un titre." value={preferences.newMessages} onChange={() => togglePreference("newMessages")} />
              <Toggle label="Activité des amis" description="Partages de playlists, écoutes et nouvelles connexions." value={preferences.friendActivity} onChange={() => togglePreference("friendActivity")} />
            </Panel>

            <Panel icon={MusicNote01Icon} title="Lecture">
              <Toggle label="Lecture automatique" description="Lance une suggestion lorsque votre file d’attente est terminée." value={preferences.autoplay} onChange={() => togglePreference("autoplay")} />
              <Toggle label="Lecteur compact" description="Réduit les informations secondaires dans le lecteur fixe." value={preferences.compactPlayer} onChange={() => togglePreference("compactPlayer")} />
            </Panel>

            <Panel icon={VolumeHighIcon} title="Préférences audio">
              <div className="py-4">
                <label className="text-sm font-bold text-white">
                  Qualité audio
                  <select value={preferences.audioQuality} onChange={(event) => setPreferences((current) => ({ ...current, audioQuality: event.target.value }))} className="mt-3 block w-full border border-white/12 bg-[#07101e] p-3 text-sm text-white outline-none focus:border-[#72eee7]">
                    <option value="normal">Normale · données réduites</option>
                    <option value="high">Élevée · recommandée</option>
                    <option value="lossless">Sans perte · Wi-Fi conseillé</option>
                  </select>
                </label>
              </div>
              <div className="settings-audio-volume border-t border-white/8 py-4">
                <p className="settings-audio-volume-label text-sm font-bold text-white">Volume par défaut</p>
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => setVolume(Number(event.target.value))} className="audiva-range mt-4 w-full" />
              </div>
            </Panel>

            <Panel icon={Settings01Icon} title="Contenu">
              <Toggle label="Afficher le contenu explicite" description="Autorise les morceaux signalés comme explicites dans la recherche et les recommandations." value={preferences.explicitContent} onChange={() => togglePreference("explicitContent")} />
            </Panel>
          </div>

          <aside className="h-fit border border-white/8 bg-[#0a1221] p-5 xl:sticky xl:top-24">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-[#83eee8]">Compte Audiva</p>
            <p className="mt-3 text-xl font-black text-white">Votre compte, vos règles.</p>
            <p className="mt-2 text-sm leading-6 text-[#aebbd7]">{user ? "Votre profil est synchronisé avec Supabase. Choisissez les données à sauvegarder dans le cloud." : "Vos réglages restent enregistrés sur cet appareil. Connectez-vous pour synchroniser votre compte."}</p>
            {saved && <p role="status" className="mt-5 flex items-center gap-2 bg-[#72eee7]/10 p-3 text-xs font-bold text-[#bffffa]"><HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />Modifications enregistrées</p>}
            {cloudSyncMessage && <p role="status" className={`mt-3 text-xs ${cloudSyncMessage.includes("échoué") || cloudSyncMessage.includes("Impossible") ? "text-rose-200" : "text-[#bffffa]"}`}>{cloudSyncMessage}</p>}
            {user ? <button type="button" onClick={() => setLogoutConfirmationOpen(true)} className="mt-6 flex w-full items-center gap-2 border border-rose-300/35 px-3 py-3 text-sm font-bold text-rose-200 transition hover:bg-rose-300/10">
              <HugeiconsIcon icon={Cancel01Icon} size={18} />
              Se déconnecter
            </button> : <button type="button" onClick={() => router.push("/authentification/connexion")} className="mt-6 w-full bg-[#72eee7] px-3 py-3 text-sm font-extrabold text-[#061426]">Se connecter à Supabase</button>}
          </aside>
        </section>
      {logoutConfirmationOpen && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-[#02050d]/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="logout-title">
          <div className="w-full max-w-md border border-white/10 bg-[#0b1426] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#83eee8]">Compte Audiva</p><button type="button" onClick={() => setLogoutConfirmationOpen(false)} aria-label="Fermer la fenêtre" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-2xl leading-none text-[#aebbd7] hover:bg-white/10 hover:text-white">×</button></div>
            <h2 id="logout-title" className="mt-3 text-2xl font-black text-white">Se déconnecter ?</h2>
            <p className="mt-3 text-sm leading-6 text-[#aebbd7]">Voulez-vous vraiment vous déconnecter de votre compte sur cet appareil ?</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setLogoutConfirmationOpen(false)} className="border border-white/12 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/5">Annuler</button>
              <button type="button" onClick={async () => { try { await signOut(); clearUser(); router.push("/authentification/connexion"); } catch (error) { setSaveError(error.message || "Déconnexion impossible."); } }} className="bg-rose-400 px-4 py-3 text-sm font-extrabold text-[#220810] transition hover:bg-rose-300">Oui, se déconnecter</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Panel({ icon, title, children }) {
  return <section className="border border-white/8 bg-[#0a1221] p-5 sm:p-6"><div className="flex items-center gap-3 border-b border-white/8 pb-4"><HugeiconsIcon icon={icon} size={21} className="text-[#72eee7]" /><h2 className="text-lg font-extrabold text-white">{title}</h2></div><div className="mt-1 divide-y divide-white/8">{children}</div></section>;
}

function Field({ label, value, onChange, type = "text", placeholder }) {
  return <label className="text-xs font-bold text-[#91a0bd]">{label}<input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full border border-white/12 bg-[#07101e] p-3 text-sm font-medium text-white outline-none focus:border-[#72eee7]" /></label>;
}

function Toggle({ label, description, value, onChange }) {
  return <div className="flex items-center justify-between gap-4 py-4"><div><p className="text-sm font-bold text-white">{label}</p>{description && <p className="mt-1 max-w-xl text-xs leading-5 text-[#91a0bd]">{description}</p>}</div><button type="button" role="switch" aria-checked={value} aria-label={label} onClick={onChange} className={`relative h-7 w-12 shrink-0 rounded-full transition ${value ? "bg-[#72eee7]" : "bg-[#27334d]"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${value ? "left-6" : "left-1"}`} /></button></div>;
}
