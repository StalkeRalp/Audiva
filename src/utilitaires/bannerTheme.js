const themes = [
  { background: "linear-gradient(112deg, #42110e 0%, #8b2418 48%, #240d0d 100%)", accent: "#ffb39f" },
  { background: "linear-gradient(112deg, #062b31 0%, #07565d 50%, #031d24 100%)", accent: "#9ff8ed" },
  { background: "linear-gradient(112deg, #21134d 0%, #5430a0 49%, #160c35 100%)", accent: "#d7b8ff" },
  { background: "linear-gradient(112deg, #3d2710 0%, #8c5d16 50%, #271807 100%)", accent: "#ffe0a2" },
  { background: "linear-gradient(112deg, #173451 0%, #216287 50%, #0a2238 100%)", accent: "#b8e9ff" },
];

export function getBannerTheme(id = "audiva") {
  const index = [...String(id)].reduce((total, character) => total + character.charCodeAt(0), 0) % themes.length;
  return themes[index];
}
