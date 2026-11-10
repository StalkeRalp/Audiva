import AlbumDetail from "@/domaines/catalogue/composants/AlbumDetail";
export default async function AlbumPage({params}){const {id}=await params;return <AlbumDetail resourceId={id}/>;}
