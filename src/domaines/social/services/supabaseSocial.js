import { getSupabaseBrowserClient } from "@/services/supabase/client";

const db = () => getSupabaseBrowserClient();
const profileView = async row => {
  let avatar = row.avatar_url || "";
  if (!avatar && row.avatar_path) {
    const { data } = await db().storage.from("audiva-avatars").createSignedUrl(row.avatar_path, 3600);
    avatar = data?.signedUrl || "";
  }
  return { id: row.id, name: row.display_name || row.username, username: `@${row.username}`, avatar, bio: row.bio || "", online: false };
};
const messageView = (row, userId, attachmentUrl = "") => {
  const payload = row.payload || {};
  const share = payload.share || null;
  const gif = payload.gif ? { ...payload.gif, url: attachmentUrl || payload.gif.url } : null;
  return {
    id: row.id, author: row.sender_id === userId ? "me" : row.sender_id, senderId: row.sender_id,
    text: row.body || "", type: row.message_type, gif,
    sticker: payload.sticker || null, share, sentAt: new Date(row.created_at).getTime(),
    time: new Date(row.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    read: row.sender_id === userId,
    edited: Boolean(row.edited_at), deleted: Boolean(row.deleted_at),
  };
};

const shareTrackSnapshot = track => {
  if (!track || typeof track !== "object") return null;
  const safeImage = [track.cover, track.image].find(value => typeof value === "string" && value && !/^(?:blob:|data:)/i.test(value));
  return Object.fromEntries(Object.entries({
    id: track.id || track.providerId || track.localId,
    localId: track.localId,
    provider: track.provider,
    providerId: track.providerId,
    title: track.title,
    artist: track.artist,
    album: track.album,
    duration: Number(track.duration) || 0,
    cover: safeImage,
    mediaType: track.mediaType,
  }).filter(([, value]) => value !== undefined && value !== null && value !== ""));
};

export async function loadSocialCloud(userId) {
  const client = db();
  const [friendships, requests, memberships, notifications, clears, activityResult] = await Promise.all([
    client.from("audiva_friendships").select("user_low,user_high").or(`user_low.eq.${userId},user_high.eq.${userId}`),
    client.from("audiva_friend_requests").select("id,requester_id,addressee_id,status,created_at").or(`requester_id.eq.${userId},addressee_id.eq.${userId}`).in("status", ["pending", "accepted"]),
    client.from("audiva_conversation_members").select("conversation_id,last_read_at").eq("user_id", userId),
    client.from("audiva_notifications").select("id,actor_id,kind,entity_type,entity_id,payload,created_at,read_at").eq("recipient_id", userId).order("created_at", { ascending: false }).limit(100),
    client.from("audiva_conversation_clears").select("conversation_id,cleared_at").eq("user_id", userId),
    client.from("audiva_social_activities").select("id,actor_id,activity_type,summary,created_at").order("created_at", { ascending: false }).limit(20),
  ]);
  for (const result of [friendships, requests, memberships, notifications, clears, activityResult]) if (result.error) throw result.error;

  const friendIds = [...new Set((friendships.data || []).map(row => row.user_low === userId ? row.user_high : row.user_low))];
  const incoming = (requests.data || []).filter(row => row.status === "pending" && row.addressee_id === userId);
  const outgoing = (requests.data || []).filter(row => row.status === "pending" && row.requester_id === userId);
  const otherIds = [...new Set([...friendIds, ...incoming.map(row => row.requester_id), ...outgoing.map(row => row.addressee_id)])];
  const conversationsIds = (memberships.data || []).map(row => row.conversation_id);
  const activityRows = activityResult.data || [];
  const profileIds = [...new Set([...otherIds, ...activityRows.map(row => row.actor_id)])];
  const [profiles, conversations, messages] = await Promise.all([
    profileIds.length ? client.rpc("audiva_get_social_profiles", { profile_ids: profileIds }) : Promise.resolve({ data: [], error: null }),
    conversationsIds.length ? client.from("audiva_conversations").select("id,kind,title,updated_at").in("id", conversationsIds).order("updated_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
    conversationsIds.length ? client.from("audiva_messages").select("id,conversation_id,sender_id,message_type,body,payload,created_at,edited_at,deleted_at").in("conversation_id", conversationsIds).order("created_at", { ascending: true }).limit(1500) : Promise.resolve({ data: [], error: null }),
  ]);
  for (const result of [profiles, conversations, messages]) if (result.error) throw result.error;

  const messageIds = (messages.data || []).map(row => row.id);
  const attachments = messageIds.length ? await client.from("audiva_message_attachments").select("message_id,storage_path,external_url,source").in("message_id", messageIds) : { data: [], error: null };
  if (attachments.error) throw attachments.error;
  const attachmentUrls = new Map();
  for (const attachment of attachments.data || []) {
    if (attachment.source === "storage" && attachment.storage_path) {
      const { data } = await client.storage.from("audiva-chat-media").createSignedUrl(attachment.storage_path, 3600);
      if (data?.signedUrl) attachmentUrls.set(attachment.message_id, data.signedUrl);
    } else if (attachment.external_url) attachmentUrls.set(attachment.message_id, attachment.external_url);
  }

  const profileRows = profiles.data || [];
  const profileViews = await Promise.all(profileRows.map(profileView));
  const profileById = Object.fromEntries(profileViews.map(row => [row.id, row]));
  const convIds = (conversations.data || []).map(row => row.id);
  const memberRows = convIds.length ? await client.from("audiva_conversation_members").select("conversation_id,user_id,last_read_at").in("conversation_id", convIds) : { data: [], error: null };
  if (memberRows.error) throw memberRows.error;
  const messagesByConv = new Map();
  const clearTimes = new Map((clears.data || []).map(row => [row.conversation_id, new Date(row.cleared_at).getTime()]));
  for (const row of messages.data || []) {
    if (new Date(row.created_at).getTime() <= (clearTimes.get(row.conversation_id) || 0)) continue;
    const list = messagesByConv.get(row.conversation_id) || [];
    list.push(messageView(row, userId, attachmentUrls.get(row.id) || "")); messagesByConv.set(row.conversation_id, list);
  }
  const membersByConv = new Map();
  for (const row of memberRows.data || []) {
    const list = membersByConv.get(row.conversation_id) || [];
    list.push(row); membersByConv.set(row.conversation_id, list);
  }
  const cloudConversations = (conversations.data || []).map(row => {
    const participantId = (membersByConv.get(row.id) || []).find(member => member.user_id !== userId)?.user_id;
    const list = messagesByConv.get(row.id) || [];
    const ownMember = (membersByConv.get(row.id) || []).find(member => member.user_id === userId);
    const unread = list.filter(message => !message.deleted && message.senderId !== userId && (!ownMember?.last_read_at || message.sentAt > new Date(ownMember.last_read_at).getTime())).length;
    return { id: row.id, participantId, title: row.title, unread, messages: list, updatedAt: list.at(-1)?.time || new Date(row.updated_at).toLocaleDateString("fr-FR") };
  }).filter(conversation => conversation.participantId);

  return {
    friends: friendIds.map(id => profileById[id]).filter(Boolean),
    requests: incoming.map(row => ({ ...(profileById[row.requester_id] || { id: row.requester_id, name: "Utilisateur Audiva", username: "" }), requestId: row.id, mutual: 0 })),
    sentRequests: outgoing.map(row => ({ ...(profileById[row.addressee_id] || { id: row.addressee_id, name: "Utilisateur Audiva", username: "" }), requestId: row.id, status: row.status })),
    conversations: cloudConversations,
    notifications: (notifications.data || []).map(row => ({
      id: row.id, type: ({ friend_request: "social", friend_accepted: "social", message: "social", playlist_shared: "partage", streak: "social", reaction: "social", system: "system" })[row.kind] || "social",
      title: notificationTitle(row), text: notificationText(row), time: relativeDate(row.created_at), read: Boolean(row.read_at), actorId: row.actor_id, entityId: row.entity_id,
    })),
    activities: activityRows.map(row => ({ id: row.id, actor: profileById[row.actor_id], activity_type: row.activity_type, summary: row.summary || {}, time: relativeDate(row.created_at) })).filter(row => row.actor),
  };
}

export async function searchProfiles(query = "", offset = 0, limit = 50) {
  const term = String(query || "").trim().replace(/^@/, "");
  const { data, error } = await db().rpc("audiva_discover_profiles", {
    search_query: term,
    page_offset: Math.max(0, Number(offset) || 0),
    page_size: Math.min(100, Math.max(1, Number(limit) || 50)),
  });
  if (error) throw error;
  return Promise.all((data || []).map(profileView));
}

export async function createFriendRequest(targetId) {
  const { data, error } = await db().rpc("audiva_send_friend_request", { target_user: targetId });
  if (error) throw error;
  return data;
}
export async function respondFriendRequest(requestId, accept) {
  const { error } = await db().rpc("audiva_respond_friend_request", { request_id: requestId, accept });
  if (error) throw error;
}
export async function createDirectConversation(friendId) {
  const { data, error } = await db().rpc("audiva_create_direct_conversation", { other_user: friendId });
  if (error) throw error;
  return data;
}
export async function createFriendInvitation() {
  const { data, error } = await db().rpc("audiva_create_friend_invitation");
  if (error) throw error;
  return { token: data, createdAt: Date.now(), expiresAt: Date.now() + 5 * 60 * 1000 };
}
export async function acceptFriendInvitation(token) {
  const { data, error } = await db().rpc("audiva_accept_friend_invitation", { invitation_token: token });
  if (error) throw error;
  return data;
}

export async function persistMessage(conversationId, message, userId) {
  const type = message.type || (message.gif ? "gif" : message.sticker ? "sticker" : message.share?.kind === "playlist" ? "playlist" : message.share ? "track" : "text");
  const payload = {};
  let uploadedGifPath = null;
  if (message.gif) {
    const gif = message.gif;
    if (gif.localFile instanceof Blob) {
      uploadedGifPath = `${conversationId}/${userId}/${crypto.randomUUID()}.gif`;
      const { error } = await db().storage.from("audiva-chat-media").upload(uploadedGifPath, gif.localFile, { contentType: "image/gif", upsert: false });
      if (error) throw error;
    }
    payload.gif = Object.fromEntries(["id", "title", "url", "thumbnail", "source", "sourceUrl", "width", "height", "creator", "license", "licenseUrl", "attribution", "filetype", "storage"].filter(key => gif[key] !== undefined).map(key => [key, key === "url" && uploadedGifPath ? "" : gif[key]]));
    if (uploadedGifPath) payload.gif.storagePath = uploadedGifPath;
  }
  if (message.sticker) payload.sticker = message.sticker;
  if (message.share) {
    const share = message.share;
    payload.share = { kind: String(share.kind || "track").slice(0, 32), title: String(share.title || "Partage Audiva").slice(0, 300), subtitle: String(share.subtitle || "").slice(0, 500), id: share.id || null };
    if (typeof share.cover === "string" && !/^(?:data:|blob:)/i.test(share.cover)) payload.share.cover = share.cover;
    const track = shareTrackSnapshot(share.track);
    const tracks = Array.isArray(share.tracks) ? share.tracks.slice(0, 200).map(shareTrackSnapshot).filter(Boolean) : [];
    if (track) payload.share.track = track;
    if (tracks.length) payload.share.tracks = tracks;
  }
  const { data, error } = await db().from("audiva_messages").insert({ conversation_id: conversationId, sender_id: userId, message_type: type, body: String(message.text || ""), payload }).select("id,conversation_id,sender_id,message_type,body,payload,created_at,edited_at,deleted_at").single();
  if (error) throw error;
  if (uploadedGifPath) {
    const { error: attachmentError } = await db().from("audiva_message_attachments").insert({ message_id: data.id, uploader_id: userId, storage_path: uploadedGifPath, source: "storage", mime_type: "image/gif", width: message.gif.width || null, height: message.gif.height || null, source_name: "GIF importé par l’utilisateur" });
    if (attachmentError) throw attachmentError;
    const { data: signed } = await db().storage.from("audiva-chat-media").createSignedUrl(uploadedGifPath, 3600);
    return messageView(data, userId, signed?.signedUrl || "");
  }
  return messageView(data, userId);
}

export async function updateMessageText(messageId, text, userId) {
  const body = String(text || "").trim();
  if (!body) throw new Error("Un message ne peut pas être vide.");
  if (body.length > 10000) throw new Error("Le message dépasse la longueur autorisée.");
  const { data, error } = await db().from("audiva_messages")
    .update({ body, edited_at: new Date().toISOString() })
    .eq("id", messageId).eq("sender_id", userId).is("deleted_at", null)
    .select("id,conversation_id,sender_id,message_type,body,payload,created_at,edited_at,deleted_at").single();
  if (error) throw error;
  return messageView(data, userId);
}

export async function softDeleteMessage(messageId, userId) {
  const { data, error } = await db().from("audiva_messages")
    .update({ body: "", payload: {}, deleted_at: new Date().toISOString() })
    .eq("id", messageId).eq("sender_id", userId).is("deleted_at", null)
    .select("id,conversation_id,sender_id,message_type,body,payload,created_at,edited_at,deleted_at").single();
  if (error) throw error;
  return messageView(data, userId);
}

export async function markRead(conversationId, userId) {
  const { error } = await db().from("audiva_conversation_members").update({ last_read_at: new Date().toISOString() }).eq("conversation_id", conversationId).eq("user_id", userId);
  if (error) throw error;
}

export async function clearCloudConversation(conversationId, userId) {
  const { error } = await db().from("audiva_conversation_clears").upsert({ conversation_id: conversationId, user_id: userId, cleared_at: new Date().toISOString() }, { onConflict: "conversation_id,user_id" });
  if (error) throw error;
}

export async function markNotificationRead(id) {
  const { error } = await db().from("audiva_notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}
export async function deleteNotification(id) {
  const { error } = await db().from("audiva_notifications").delete().eq("id", id);
  if (error) throw error;
}
export async function setAllNotificationsRead() {
  const { data: { user } } = await db().auth.getUser();
  if (!user) return;
  const { error } = await db().from("audiva_notifications").update({ read_at: new Date().toISOString() }).eq("recipient_id", user.id).is("read_at", null);
  if (error) throw error;
}

export function subscribeSocial(userId, onChange, conversationIds = []) {
  const client = db();
  let channel = client.channel(`audiva-social-${userId}-${Math.random().toString(36).slice(2, 8)}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "audiva_friend_requests", filter: `addressee_id=eq.${userId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "audiva_friendships", filter: `user_low=eq.${userId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "audiva_notifications", filter: `recipient_id=eq.${userId}` }, onChange);
  for (const id of conversationIds) channel = channel.on("postgres_changes", { event: "*", schema: "public", table: "audiva_messages", filter: `conversation_id=eq.${id}` }, onChange);
  return channel.subscribe();
}

function notificationTitle(row) {
  return ({ friend_request: "Nouvelle demande d’amitié", friend_accepted: "Demande d’amitié acceptée", message: "Nouveau message", playlist_shared: "Playlist partagée", streak: "Nouvelle série Audiva", reaction: "Nouvelle réaction", system: "Information Audiva" })[row.kind] || "Activité Audiva";
}
function notificationText(row) {
  const payload = row.payload || {};
  if (row.kind === "streak") return `${payload.days || "Une"} jour${payload.days > 1 ? "s" : ""} d’activité consécutive.`;
  if (row.kind === "reaction") return `Réaction ${payload.reaction || ""} à votre message.`;
  return ({ friend_request: "Une personne souhaite rejoindre votre cercle.", friend_accepted: "Une personne a rejoint votre cercle.", message: "Vous avez reçu un message privé.", playlist_shared: "Une playlist a été partagée avec vous." })[row.kind] || "Consultez votre activité.";
}
function relativeDate(value) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "À l’instant";
  if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
  return new Date(value).toLocaleDateString("fr-FR");
}
