export async function sendMessage(conversationId, content) {
  return { ok: true, id: Date.now(), conversationId, content };
}

export async function fetchConversations(userId) {
  return [];
}
