import { HugeiconsIcon } from "@hugeicons/react";
import {
  AudioWaveformIcon,
  DiscAlbumIcon,
  HeadphonesIcon,
  Mic01Icon,
  MusicNote01Icon,
  Notification01Icon,
  UserCircleIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

const motifs = [
  { icon: MusicNote01Icon, className: "auth-float auth-float--one", size: 34 },
  { icon: Mic01Icon, className: "auth-float auth-float--two", size: 38 },
  { icon: HeadphonesIcon, className: "auth-float auth-float--three", size: 42 },
  { icon: AudioWaveformIcon, className: "auth-float auth-float--four", size: 58 },
  { icon: DiscAlbumIcon, className: "auth-float auth-float--five", size: 44 },
  { icon: MusicNote01Icon, className: "auth-float auth-float--six", size: 25 },
  { icon: UserCircleIcon, className: "auth-float auth-float--seven", size: 37 },
  { icon: Notification01Icon, className: "auth-float auth-float--eight", size: 32 },
  { icon: UserGroupIcon, className: "auth-float auth-float--nine", size: 43 },
];

export default function AuthAmbient() {
  return <div className="auth-ambient" aria-hidden="true">{motifs.map(item => <span key={item.className} className={item.className} style={{ width: item.size, height: item.size }}><HugeiconsIcon icon={item.icon} size={item.size} strokeWidth={1.5} /></span>)}</div>;
}
