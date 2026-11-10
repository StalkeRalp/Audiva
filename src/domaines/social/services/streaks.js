const localDay = timestamp => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export function getMessageStreak(messages = [], now = Date.now()) {
  const days = new Set(messages.filter(message => message.author === "me" && Number.isFinite(message.sentAt)).map(message => localDay(message.sentAt)));
  const today = new Date(now);
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!days.has(localDay(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);
  if (!days.has(localDay(cursor.getTime()))) return { current: 0, activeToday: false };

  let current = 0;
  while (days.has(localDay(cursor.getTime()))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { current, activeToday: days.has(localDay(today.getTime())) };
}

export function getConversationStreak(conversation, now) {
  return getMessageStreak(conversation?.messages || [], now);
}

export function getCommunityStreak(conversations, now) {
  return getMessageStreak((conversations || []).flatMap(conversation => conversation.messages || []), now);
}
