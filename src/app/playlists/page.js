import { redirect } from "next/navigation";

export default function PlaylistsRedirect() {
  redirect("/bibliotheque?vue=playlists");
}
