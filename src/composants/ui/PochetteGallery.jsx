import Image from "next/image";
import styles from "./PochetteGallery.module.css";

const discs = Array.from({ length: 12 }, (_, index) => `/POCHETTE/P${index + 1}.png`);

export default function PochetteGallery({ compact = false }) {
  return <section className={`audiva-cover-gallery ${styles.gallery} ${compact ? styles.compact : ""}`} aria-label="Collection de disques Audiva">
    <header><span>LA COLLECTION AUDIVA</span><h2>Un peu de matière, beaucoup de musique.</h2></header>
    <div className={styles.row}>
      {discs.map(src => <div className={styles.disc} key={src}>
        <Image src={src} alt="" width={240} height={240} sizes="(max-width: 640px) 88px, 132px" />
      </div>)}
    </div>
  </section>;
}
