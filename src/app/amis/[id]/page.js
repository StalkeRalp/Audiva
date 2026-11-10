import FriendProfile from "@/domaines/social/composants/FriendProfile";

export default async function AmiDetailPage({ params }) {
  const { id } = await params;
  return <FriendProfile friendId={id} />;
}
