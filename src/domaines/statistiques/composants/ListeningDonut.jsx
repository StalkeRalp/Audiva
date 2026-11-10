"use client";

import { useMemo, useState } from "react";

const palette = ["#76eee9", "#8ba4ff", "#c68cff", "#ff9b80", "#ffd166", "#69d5a7", "#5ea9ff"];
const sliceColor = (title, index) => title === "Chaque heure, une bande-son" ? `hsl(${Math.round(index * 15)} 82% 64%)` : palette[index % palette.length];
const duration = seconds => seconds >= 3600 ? `${Math.floor(seconds / 3600)} h ${Math.floor(seconds % 3600 / 60)} min` : `${Math.floor(seconds / 60)} min`;
const number = value => new Intl.NumberFormat("fr-FR").format(Math.round(value));

function makeSlices(items, mode, labelOf, detailOf, limit = 6) {
  const rows = items.map(item => ({ label: labelOf(item), detail: detailOf(item), value: Number(item[mode]) || 0 })).filter(item => item.value > 0).sort((a, b) => b.value - a.value);
  const visible = rows.slice(0, limit);
  const rest = rows.slice(limit).reduce((sum, item) => sum + item.value, 0);
  if (rest) visible.push({ label: "Autres", detail: "Autres éléments de cette période", value: rest });
  return visible;
}

function Donut({ title, subtitle, slices, selected, onSelect, mode }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const active = slices[selected] || slices[0];
  const circumference = 2 * Math.PI * 63;
  return <article className="mi-donut-card">
    <header><h3>{title}</h3><p>{subtitle}</p></header>
    {slices.length ? <>
      <div className="mi-donut-visual">
        <svg viewBox="0 0 180 180" role="group" aria-label={`${title}, répartition interactive`}>
          <circle cx="90" cy="90" r="63" fill="none" stroke="#ffffff0b" strokeWidth="27" />
          {slices.map((slice, index) => {
            const length = slice.value / total * circumference;
            const dashOffset = slices.slice(0, index).reduce((sum, previous) => sum + previous.value / total * circumference, 0);
            return <circle key={slice.label} cx="90" cy="90" r="63" fill="none" stroke={sliceColor(title, index)} strokeWidth={selected === index ? 31 : 27} strokeDasharray={`${Math.max(0, length - 1.5)} ${circumference - Math.max(0, length - 1.5)}`} strokeDashoffset={-dashOffset} transform="rotate(-90 90 90)" className="mi-donut-slice" role="button" tabIndex={0} aria-label={`${slice.label} : ${mode === "seconds" ? duration(slice.value) : number(slice.value) + " écoutes"}`} aria-pressed={selected === index} onClick={() => onSelect(index)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(index); } }} />;
          })}
        </svg>
        <div className="mi-donut-center" aria-live="polite"><strong>{active ? `${Math.round(active.value / Math.max(1, total) * 100)}%` : "—"}</strong><span>{active?.label || "Aucune donnée"}</span><small>{active ? mode === "seconds" ? duration(active.value) : `${number(active.value)} écoutes` : "Écoutez quelques titres"}</small></div>
      </div>
      <div className="mi-donut-legend">{slices.map((slice, index) => <button key={slice.label} type="button" aria-pressed={selected === index} onClick={() => onSelect(index)}><i style={{ background: sliceColor(title, index) }} /><span>{slice.label}</span><small>{Math.round(slice.value / total * 100)}%</small></button>)}</div>
      {active?.detail && <p className="mi-donut-detail">{active.detail}</p>}
    </> : <p className="mi-donut-empty">Aucune donnée pour cette période.</p>}
  </article>;
}

export default function ListeningDonut({ stats, onlyHours = false }) {
  const [mode, setMode] = useState("seconds");
  const [selected, setSelected] = useState([0, 0, 0, 0]);
  const hours = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, seconds: Number(stats.hours[hour]) || 0, count: 0, tracks: new Map() }));
    stats.rows.forEach(row => {
      const hour = new Date(row.start).getHours();
      const bucket = buckets[hour];
      const track = row.track || {};
      const key = track.id || `${track.title || ""}:${track.artist || ""}`;
      const saved = bucket.tracks.get(key) || { title: track.title || "Titre inconnu", artist: track.artist || "Artiste inconnu", count: 0 };
      if (row.seconds >= Math.min(30, row.duration > 0 ? row.duration / 2 : 30)) { bucket.count += 1; saved.count += 1; }
      bucket.tracks.set(key, saved);
    });
    return buckets.map(bucket => {
      const favorite = [...bucket.tracks.values()].sort((a, b) => b.count - a.count)[0];
      return { ...bucket, label: `${String(bucket.hour).padStart(2, "0")} h`, detail: favorite ? `À ${String(bucket.hour).padStart(2, "0")} h · ${duration(bucket.seconds)} d’écoute · titre marquant : ${favorite.title}${favorite.artist ? ` — ${favorite.artist}` : ""}` : `À ${String(bucket.hour).padStart(2, "0")} h · aucune écoute enregistrée` };
    });
  }, [stats.hours, stats.rows]);
  const charts = useMemo(() => {
    const hourChart = { title: "Chaque heure, une bande-son", subtitle: "Choisissez un créneau pour découvrir les titres qui l’accompagnent", slices: makeSlices(hours, "seconds", item => item.label, item => item.detail, 24) };
    if (onlyHours) return [hourChart];
    return [
    { title: "Artistes", subtitle: "Part du temps d’écoute par artiste", slices: makeSlices(stats.artists, mode, item => item.name, item => `${item.count} écoutes · ${duration(item.seconds)} · ${item.tracks.size} titres`) },
    { title: "Titres", subtitle: "Vos morceaux les plus écoutés", slices: makeSlices(stats.tracks, mode, item => item.title, item => `${item.artist} · ${item.count} écoutes · ${duration(item.seconds)}`) },
    { title: "Genres", subtitle: "Styles renseignés dans vos titres", slices: makeSlices(stats.genres.map(([name, seconds]) => ({ name, seconds, count: 0 })), "seconds", item => item.name, item => `${duration(item.seconds)} d’écoute`) },
  ];
  }, [stats, mode, hours, onlyHours]);
  const changeMode = value => { setMode(value); setSelected([0, 0, 0, 0]); };
  const selectionIndex = onlyHours ? 3 : null;
  return <section className={`mi-donuts${onlyHours ? " mi-donuts--hour" : ""}`} aria-label={onlyHours ? "Bande-son selon l’heure" : "Répartition de vos tendances musicales"}>
    {!onlyHours && <header className="mi-donuts-header"><div><span>VOS TENDANCES, EN UN COUP D’ŒIL</span><h2>La part de chaque son dans votre univers</h2><p>Sélectionnez une portion ou une légende pour explorer vos artistes, titres et genres.</p></div><div className="mi-donut-modes" role="group" aria-label="Mesure des graphiques"><button type="button" aria-pressed={mode === "seconds"} onClick={() => changeMode("seconds")}>Temps d’écoute</button><button type="button" aria-pressed={mode === "count"} onClick={() => changeMode("count")}>Nombre d’écoutes</button></div></header>}
    <div className="mi-donuts-grid">{charts.map((chart, index) => { const currentIndex = onlyHours ? selectionIndex : index; return <Donut key={chart.title} {...chart} mode={onlyHours || index >= 2 ? "seconds" : mode} selected={selected[currentIndex]} onSelect={value => setSelected(current => current.map((item, i) => i === currentIndex ? value : item))} />; })}</div>
  </section>;
}
