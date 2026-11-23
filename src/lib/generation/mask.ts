import type { PromptToMapSpec } from "../ai/mapSpec";
import { fractalNoise } from "./noise";

export interface LandMask {
  width: number;
  height: number;
  cells: boolean[];
}

export interface MaskOptions {
  width: number;
  height: number;
}

function ellipseDistance(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
): number {
  const dx = (x - centerX) / radiusX;
  const dy = (y - centerY) / radiusY;
  return Math.sqrt(dx * dx + dy * dy);
}

export function generateLandMask(
  spec: PromptToMapSpec,
  options: MaskOptions,
): LandMask {
  const { width, height } = options;
  const scores: number[] = [];
  const octaves = Math.max(2, spec.coastlineComplexity + 1);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const nx = x / Math.max(1, width - 1);
      const ny = y / Math.max(1, height - 1);
      let continentScore = -1;

      for (let continent = 0; continent < spec.continentCount; continent += 1) {
        const angle = (continent / spec.continentCount) * Math.PI * 2 +
          fractalNoise(continent * 0.37, 0.41, spec.seed, 2, 1) * 0.8;
        const centerX = 0.5 + Math.cos(angle) * (0.23 + continent * 0.015);
        const centerY = 0.5 + Math.sin(angle) * (0.22 + continent * 0.01);
        const radiusX = spec.archipelagos ? 0.14 : 0.23;
        const radiusY = spec.archipelagos ? 0.11 : 0.18;
        const distance = ellipseDistance(nx, ny, centerX, centerY, radiusX, radiusY);
        const warp = fractalNoise(nx * 2.4, ny * 2.4, spec.seed + continent * 3571, octaves, 1) - 0.5;
        const score = 1 - distance + warp * (0.12 + spec.coastlineComplexity * 0.025);
        continentScore = Math.max(continentScore, score);
      }

      scores.push(continentScore);
    }
  }

  const sorted = [...scores].sort((a, b) => b - a);
  const landCount = Math.max(
    width * height * 0.02,
    Math.min(width * height * 0.95, width * height * spec.landCoverage),
  );
  const thresholdIndex = Math.max(0, Math.min(sorted.length - 1, Math.floor(landCount) - 1));
  const threshold = sorted[thresholdIndex];
  const cells = scores.map((score) => score >= threshold);

  return { width, height, cells };
}
