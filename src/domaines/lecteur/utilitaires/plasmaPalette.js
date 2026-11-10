/** Palette compacte, extraite des pixels de la pochette sans service externe. */
export const DEFAULT_PLASMA_PALETTE = [
  [0.16, 0.28, 0.48], [0.36, 0.22, 0.57], [0.14, 0.51, 0.53], [0.42, 0.33, 0.57],
];

export function extractPlasmaPalette(pixels) {
  const samples = [];
  const dark = [];
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] < 128) continue;
    const color = [pixels[index], pixels[index + 1], pixels[index + 2]];
    const max = Math.max(...color);
    // Les bordures noires ne doivent pas effacer la couleur de l’illustration.
    if (max < 18) { dark.push(color); continue; }
    samples.push(color);
  }
  if (!samples.length) {
    if (dark.length) {
      const average = [0, 1, 2].map((channel) => dark.reduce((sum, color) => sum + color[channel], 0) / dark.length / 255);
      return Array.from({ length: 4 }, () => [...average]);
    }
    return DEFAULT_PLASMA_PALETTE.map((color) => [...color]);
  }
  const distance = (a, b) => a.reduce((sum, value, index) => sum + (value - b[index]) ** 2, 0);
  const centers = [samples[Math.floor(samples.length / 2)]];
  while (centers.length < 4) {
    let candidate = samples[0];
    let furthest = -1;
    for (const sample of samples) {
      const nearest = Math.min(...centers.map((center) => distance(sample, center)));
      if (nearest > furthest) { furthest = nearest; candidate = sample; }
    }
    centers.push([...candidate]);
  }
  let clusters;
  for (let iteration = 0; iteration < 7; iteration += 1) {
    clusters = centers.map(() => ({ sum: [0, 0, 0], count: 0 }));
    for (const sample of samples) {
      let nearest = 0;
      for (let index = 1; index < centers.length; index += 1) {
        if (distance(sample, centers[index]) < distance(sample, centers[nearest])) nearest = index;
      }
      const cluster = clusters[nearest];
      cluster.count += 1;
      sample.forEach((value, index) => { cluster.sum[index] += value; });
    }
    clusters.forEach((cluster, index) => {
      if (cluster.count) centers[index] = cluster.sum.map((value) => value / cluster.count);
    });
  }
  return centers.map((color, index) => ({ color, weight: clusters[index].count }))
    .sort((a, b) => b.weight - a.weight)
    .map(({ color }) => color.map((value) => value / 255));
}
