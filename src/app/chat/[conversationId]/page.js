export default function ConversationPage({ params }) {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold text-slate-100">Conversation</h1>
      <p className="mt-2 text-slate-400">Conversation ID : {params.conversationId}</p>
    </main>
  );
}
