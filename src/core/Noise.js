/**
 * Noise functions for procedural terrain generation
 */

// Permutation table (seeded)
const _NOISE_PERM = (() => {
  const p = [];
  for (let i = 0; i < 256; i++) p[i] = i;
  let seed = 1337;
  for (let i = 255; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = Math.floor((seed / 233280) * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  return [...p, ...p];
})();

function _fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function _lerp(a, b, t) { return a + t * (b - a); }
function _grad(hash, x, y) {
  const h = hash & 3;
  const u = h < 2 ? x : y;
  const v = h < 2 ? y : x;
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
}

/**
 * 2D Perlin-like noise, returns -1..1
 */
export function noise2D(x, y) {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  const u = _fade(x);
  const v = _fade(y);
  const A = _NOISE_PERM[X] + Y;
  const B = _NOISE_PERM[X + 1] + Y;
  return _lerp(
    _lerp(_grad(_NOISE_PERM[A], x, y), _grad(_NOISE_PERM[B], x - 1, y), u),
    _lerp(_grad(_NOISE_PERM[A + 1], x, y - 1), _grad(_NOISE_PERM[B + 1], x - 1, y - 1), u),
    v
  );
}

/**
 * Fractal Brownian Motion - multiple octaves for natural terrain
 */
export function fbm(x, y, octaves = 4, lacunarity = 2.0, gain = 0.5) {
  let value = 0, amplitude = 1, frequency = 1, maxAmp = 0;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise2D(x * frequency, y * frequency);
    maxAmp += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }
  return value / maxAmp;
}
