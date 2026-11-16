const analysisCache = new Map();
const analysisJobs = new Map();
const MAX_ANALYSIS_BYTES = 30 * 1024 * 1024;
const MAX_ANALYSIS_SECONDS = 12 * 60;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function validBpm(value) {
  const bpm = Number(value);
  return Number.isFinite(bpm) && bpm >= 45 && bpm <= 220 ? bpm : null;
}

function estimateBpm(envelope, sampleRate = 20) {
  if (envelope.length < sampleRate * 8) return { bpm: null, confidence: 0 };
  const novelty = envelope.map((value, index) => Math.max(0, value - (envelope[index - 1] || 0) * 1.12));
  const mean = novelty.reduce((sum, value) => sum + value, 0) / novelty.length;
  if (mean < 1e-5) return { bpm: null, confidence: 0 };
  for (let i = 0; i < novelty.length; i += 1) novelty[i] = Math.max(0, novelty[i] - mean * 0.45);

  let best = { bpm: null, score: 0 };
  let baseline = 0;
  for (let bpm = 65; bpm <= 190; bpm += 1) {
    const lag = (sampleRate * 60) / bpm;
    let score = 0, normA = 0, normB = 0, count = 0;
    for (let index = Math.ceil(lag); index < novelty.length; index += 1) {
      const delayedIndex = index - lag;
      const lowerIndex = Math.floor(delayedIndex);
      const fraction = delayedIndex - lowerIndex;
      const lower = novelty[lowerIndex], upper = novelty[lowerIndex + 1];
      if (lower === undefined || upper === undefined) continue;
      const previous = lower * (1 - fraction) + upper * fraction;
      const current = novelty[index];
      score += current * previous;
      normA += current * current;
      normB += previous * previous;
      count += 1;
    }
    const normalized = count ? score / Math.sqrt(Math.max(normA * normB, 1e-12)) : 0;
    baseline += normalized;
    const subharmonic = bpm * 2 <= 190 ? bpm * 2 : null;
    // Slight preference for the lower metrical interpretation when both score similarly.
    const adjusted = normalized * (subharmonic ? 0.97 : 1);
    if (adjusted > best.score) best = { bpm, score: adjusted };
  }
  baseline /= 126;
  const confidence = clamp((best.score - baseline) / Math.max(0.12, 1 - baseline), 0, 1);
  return confidence >= 0.12 ? { bpm: best.bpm, confidence } : { bpm: null, confidence };
}

export function analyzeEnvelope(envelope, sampleRate = 20) {
  if (!Array.isArray(envelope) || envelope.length < 2) return null;
  const peak = Math.max(...envelope);
  if (!Number.isFinite(peak) || peak <= 0) return null;
  const threshold = Math.max(0.003, peak * 0.075);
  const first = envelope.findIndex(value => value >= threshold);
  let last = envelope.length - 1;
  while (last > first && envelope[last] < threshold) last -= 1;
  const active = envelope.slice(Math.max(0, first), last + 1);
  if (!active.length) return null;
  const rms = Math.sqrt(active.reduce((sum, value) => sum + value * value, 0) / active.length);
  const { bpm, confidence } = estimateBpm(active, sampleRate);
  return {
    bpm,
    bpmConfidence: confidence,
    energy: rms,
    activeStart: first / sampleRate,
    activeEnd: last / sampleRate,
    duration: envelope.length / sampleRate,
    analysis: "signal",
  };
}

export function trackMusicFacts(track) {
  const tags = track?.tags || {};
  const technical = track?.technical || {};
  return {
    id: track?.id,
    duration: Number(track?.duration || technical.duration) || 0,
    bpm: validBpm(tags.bpm),
    bpmConfidence: validBpm(tags.bpm) ? 1 : 0,
    key: typeof tags.key === "string" ? tags.key : null,
    genre: typeof track?.genre === "string" ? track.genre : typeof tags.genre === "string" ? tags.genre : null,
    mood: typeof tags.mood === "string" ? tags.mood : null,
    energy: null,
    activeStart: 0,
    activeEnd: Number(track?.duration) || 0,
    analysis: "tags",
  };
}

function decodeEnvelope(buffer, sampleRate = 20) {
  const channelCount = buffer.numberOfChannels;
  const framesPerWindow = Math.max(1, Math.floor(buffer.sampleRate / sampleRate));
  const envelope = [];
  const channels = Array.from({ length: channelCount }, (_, index) => buffer.getChannelData(index));
  for (let start = 0; start < buffer.length; start += framesPerWindow) {
    const end = Math.min(buffer.length, start + framesPerWindow);
    let sum = 0, samples = 0;
    for (const channel of channels) {
      for (let index = start; index < end; index += 4) { sum += channel[index] * channel[index]; samples += 1; }
    }
    envelope.push(Math.sqrt(sum / Math.max(1, samples)));
  }
  return envelope;
}

export async function analyzeLocalTrack(track) {
  const basic = trackMusicFacts(track);
  if (basic.bpm && basic.energy) return basic;
  const file = track?.file;
  if (!(file instanceof Blob) || file.size > MAX_ANALYSIS_BYTES || basic.duration > MAX_ANALYSIS_SECONDS) return basic;
  const cacheKey = String(track.id || file.name);
  if (analysisCache.has(cacheKey)) return { ...basic, ...analysisCache.get(cacheKey) };
  if (analysisJobs.has(cacheKey)) return { ...basic, ...(await analysisJobs.get(cacheKey)) };
  const job = (async () => {
    try {
      const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!Offline) return {};
      const decoder = new Offline(1, 1, 22050);
      const buffer = await decoder.decodeAudioData(await file.arrayBuffer());
      if (buffer.duration > MAX_ANALYSIS_SECONDS) return {};
      const signal = analyzeEnvelope(decodeEnvelope(buffer), 20);
      if (!signal) return {};
      return {
        ...signal,
        bpm: basic.bpm || signal.bpm,
        bpmConfidence: basic.bpm ? 1 : signal.bpmConfidence,
        key: basic.key,
        genre: basic.genre,
        mood: basic.mood,
        duration: basic.duration || buffer.duration,
      };
    } catch {
      return {};
    }
  })();
  analysisJobs.set(cacheKey, job);
  const result = await job;
  analysisJobs.delete(cacheKey);
  analysisCache.set(cacheKey, result);
  return { ...basic, ...result };
}

function keyPitch(key) {
  if (!key) return null;
  const match = String(key).trim().match(/^([A-G])([#b]?)(?:\s*(major|minor|maj|min|m))?$/i);
  if (!match) return null;
  const notes = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  let pitch = notes[match[1].toUpperCase()];
  if (match[2] === "#") pitch = (pitch + 1) % 12;
  if (match[2] === "b") pitch = (pitch + 11) % 12;
  const minor = /minor|min|m/i.test(match[3] || "");
  return { pitch, minor };
}

function tempoRatio(a, b) {
  if (!a || !b) return null;
  const ratios = [a / b, a / (b * 2), (a * 2) / b];
  return ratios.map(rate => ({ rate, distance: Math.abs(1 - rate) })).sort((x, y) => x.distance - y.distance)[0];
}

function compatibleKeys(a, b) {
  const left = keyPitch(a), right = keyPitch(b);
  if (!left || !right) return null;
  if (left.pitch === right.pitch && left.minor === right.minor) return 1;
  if ((left.pitch + 3) % 12 === right.pitch && left.minor !== right.minor) return 0.9;
  const distance = Math.min((left.pitch - right.pitch + 12) % 12, (right.pitch - left.pitch + 12) % 12);
  return distance === 5 || distance === 7 ? 0.72 : distance === 1 || distance === 11 ? 0.35 : 0.08;
}

export function buildTransitionPlan(current, next, settings = {}) {
  const intensity = clamp(Number(settings.intensity) || 1, 0.5, 1.5);
  const mode = settings.mode === "crossfade" ? "crossfade" : "intelligent";
  const tempo = tempoRatio(validBpm(current?.bpm), validBpm(next?.bpm));
  const beatMatch = Boolean(settings.beatmatching && tempo && tempo.distance <= 0.06 && tempo.rate >= 0.94 && tempo.rate <= 1.06);
  const keyScore = compatibleKeys(current?.key, next?.key);
  const currentEnergy = Number(current?.energy) || null;
  const nextEnergy = Number(next?.energy) || null;
  const energyRatio = currentEnergy && nextEnergy ? currentEnergy / nextEnergy : 1;
  const energyGap = currentEnergy && nextEnergy ? Math.abs(20 * Math.log10(energyRatio)) : null;
  const genresKnown = Boolean(current?.genre && next?.genre);
  const sameGenre = genresKnown && current.genre.toLocaleLowerCase() === next.genre.toLocaleLowerCase();
  const missingReliableTempo = !current?.bpm || !next?.bpm || Math.min(current?.bpmConfidence ?? 0, next?.bpmConfidence ?? 0) < 0.2;
  const natural = missingReliableTempo || (tempo && tempo.distance > 0.06) || keyScore !== null && keyScore < 0.35 || (energyGap !== null && energyGap > 9) || (genresKnown && !sameGenre && !tempo);
  const sourceBpm = validBpm(current?.bpm);
  const barSeconds = sourceBpm ? (60 / sourceBpm) * 4 : null;
  const baseDuration = mode === "crossfade" ? 6 : barSeconds ? barSeconds * (natural ? 2 : 4) : 5;
  const duration = clamp(baseDuration * intensity, mode === "crossfade" ? 2 : 2.5, mode === "crossfade" ? 12 : 14);
  const activeEnd = Number(current?.activeEnd) > 0 ? Number(current.activeEnd) : Number(current?.duration) || 0;
  let startAt = Math.max(0, activeEnd - duration);
  if (mode === "intelligent" && barSeconds && !natural && activeEnd > duration) {
    const activeStart = Number(current.activeStart) || 0;
    const latestBar = Math.floor((activeEnd - duration - activeStart) / barSeconds);
    if (latestBar >= 0) startAt = activeStart + latestBar * barSeconds;
  }
  const targetDb = energyGap === null ? 0 : clamp(10 * Math.log10(energyRatio), -5, 5);
  const energyGain = clamp(10 ** (targetDb / 20), 0.56, 1.78);
  return {
    mode: natural ? "natural" : beatMatch ? "beatmatch" : "smooth",
    startAt,
    duration,
    nextStartAt: Math.max(0, Number(next?.activeStart) || 0),
    beatmatch: beatMatch,
    nextPlaybackRate: beatMatch ? clamp(tempo.rate, 0.94, 1.06) : 1,
    energyGain,
    confidence: Math.min(current?.bpmConfidence ?? 0, next?.bpmConfidence ?? 0),
    reason: missingReliableTempo ? "Tempo fiable indisponible : transition prudente, sans synchronisation rythmique." : natural ? "Les tempos, tonalités ou niveaux d’énergie invitent à une transition douce." : beatMatch ? "Tempo compatible : transition calée sur la pulsation." : "Transition progressive, sans synchronisation de tempo.",
  };
}

export function clearAutoMixAnalysisCache() {
  analysisCache.clear();
  analysisJobs.clear();
}
