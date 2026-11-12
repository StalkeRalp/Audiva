import { redirect } from "next/navigation";

export default async function ConversationPage({ params }) {
  const { conversationId } = await params;
  redirect(`/chat?conversation=${encodeURIComponent(conversationId)}`);
}
