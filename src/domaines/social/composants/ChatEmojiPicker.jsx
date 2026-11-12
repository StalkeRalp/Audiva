"use client";

import emojiData from "emojibase-data/en/data.json";

const emojis = emojiData.filter(emoji => emoji.group === 0 && emoji.type === 1).slice(0, 56);

export default function ChatEmojiPicker({ onSelect }) {
  return <div className="chat-emoji-grid">{emojis.map(emoji => <button type="button" key={emoji.hexcode} title={emoji.label} onClick={() => onSelect(emoji.emoji)}>{emoji.emoji}</button>)}</div>;
}
