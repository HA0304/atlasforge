export interface SeededRandom {
  next(): number;
}

export function createSeededRandom(seed: number): SeededRandom {
  let state = seed >>> 0;

  return {
    next(): number {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
    },
  };
}

function hashGrid(x: number, y: number, seed: number): number {
  let value = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  value = (value ^ (value >>> 13)) * 1274126177;
  return ((value ^ (value >>> 16)) >>> 0) / 4_294_967_296;
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}

function valueNoise(
  x: number,
  y: number,
  seed: number,
): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = smoothstep(x - x0);
  const ty = smoothstep(y - y0);

  const top =
    hashGrid(x0, y0, seed) * (1 - tx) +
    hashGrid(x0 + 1, y0, seed) * tx;
  const bottom =
    hashGrid(x0, y0 + 1, seed) * (1 - tx) +
    hashGrid(x0 + 1, y0 + 1, seed) * tx;

  return top * (1 - ty) + bottom * ty;
}

export function fractalNoise(
  x: number,
  y: number,
  seed: number,
  octaves: number,
  frequency: number,
): number {
  let result = 0;
  let amplitude = 1;
  let amplitudeTotal = 0;

  for (let octave = 0; octave < octaves; octave += 1) {
    result += valueNoise(x * frequency, y * frequency, seed + octave * 1013) * amplitude;
    amplitudeTotal += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return result / amplitudeTotal;
}
