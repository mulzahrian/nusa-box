export class SimplexNoise {
  constructor(seed = 1337) {
    this.seed = seed;
    this.perm = makePerm(seed);
  }
  noise2D(x, y) { return baseNoise2D(x, y, this.perm); }
}
function makePerm(seedValue = 1337) {
  const p = Array.from({ length: 256 }, (_, index) => index);
  let seed = seedValue;
  for (let i = 255; i > 0; i -= 1) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = Math.floor((seed / 233280) * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  return [...p, ...p];
}
const DEFAULT_PERM = makePerm();
const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + t * (b - a);
const grad = (hash, x, y) => {
  const h = hash & 3;
  const u = h < 2 ? x : y;
  const v = h < 2 ? y : x;
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
};
function baseNoise2D(x, y, perm) {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = fade(xf);
  const v = fade(yf);
  const A = perm[X] + Y;
  const B = perm[X + 1] + Y;
  return lerp(lerp(grad(perm[A], xf, yf), grad(perm[B], xf - 1, yf), u), lerp(grad(perm[A + 1], xf, yf - 1), grad(perm[B + 1], xf - 1, yf - 1), u), v);
}
export function noise2D(x, y) { return baseNoise2D(x, y, DEFAULT_PERM); }
export function fbm(x, y, octaves = 4, lacunarity = 2, gain = 0.5) {
  let value = 0, amplitude = 1, frequency = 1, maxAmp = 0;
  for (let i = 0; i < octaves; i += 1) {
    value += amplitude * noise2D(x * frequency, y * frequency);
    maxAmp += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }
  return maxAmp ? value / maxAmp : 0;
}
