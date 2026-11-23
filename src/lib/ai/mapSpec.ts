export const PROMPT_TO_MAP_SPEC_VERSION = 1 as const;

export type SettlementKind = "town" | "city" | "port";

export interface SettlementSpec {
  name: string;
  kind: SettlementKind;
}

export interface PromptToMapSpec {
  version: typeof PROMPT_TO_MAP_SPEC_VERSION;
  seed: number;
  continentCount: number;
  landCoverage: number;
  coastlineComplexity: number;
  archipelagos: boolean;
  regions: number;
  settlements: SettlementSpec[];
}

export class PromptToMapSpecError extends Error {
  constructor(message: string, readonly path = "spec") {
    super(`${path}: ${message}`);
    this.name = "PromptToMapSpecError";
  }
}

export interface PromptToMapSpecProvider {
  generateSpec(prompt: string): Promise<unknown>;
}

export async function requestValidatedMapSpec(
  provider: PromptToMapSpecProvider,
  prompt: string,
): Promise<PromptToMapSpec> {
  if (prompt.trim().length === 0) {
    throw new PromptToMapSpecError("expected a non-empty prompt", "prompt");
  }
  if (prompt.length > 2_000) {
    throw new PromptToMapSpecError("prompt exceeds 2000 characters", "prompt");
  }

  return validatePromptToMapSpec(await provider.generateSpec(prompt));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new PromptToMapSpecError("expected an object", path);
  }
  return value;
}

function requireExactKeys(
  record: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
): void {
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) {
      throw new PromptToMapSpecError(`unknown field "${key}"`, `${path}.${key}`);
    }
  }
}

function requireInteger(
  record: Record<string, unknown>,
  key: string,
  min: number,
  max: number,
  path: string,
): number {
  const value = record[key];
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < min ||
    value > max
  ) {
    throw new PromptToMapSpecError(
      `expected an integer from ${min} to ${max}`,
      `${path}.${key}`,
    );
  }
  return value;
}

function requireNumber(
  record: Record<string, unknown>,
  key: string,
  min: number,
  max: number,
  path: string,
): number {
  const value = record[key];
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  ) {
    throw new PromptToMapSpecError(
      `expected a finite number from ${min} to ${max}`,
      `${path}.${key}`,
    );
  }
  return value;
}

function requireBoolean(
  record: Record<string, unknown>,
  key: string,
  path: string,
): boolean {
  const value = record[key];
  if (typeof value !== "boolean") {
    throw new PromptToMapSpecError("expected a boolean", `${path}.${key}`);
  }
  return value;
}

function validateSettlement(value: unknown, index: number): SettlementSpec {
  const path = `spec.settlements[${index}]`;
  const settlement = requireRecord(value, path);
  requireExactKeys(settlement, ["name", "kind"], path);

  const name = settlement.name;
  if (
    typeof name !== "string" ||
    name.trim().length === 0 ||
    name.length > 80
  ) {
    throw new PromptToMapSpecError(
      "expected a non-empty name of at most 80 characters",
      `${path}.name`,
    );
  }

  if (
    settlement.kind !== "town" &&
    settlement.kind !== "city" &&
    settlement.kind !== "port"
  ) {
    throw new PromptToMapSpecError(
      'expected "town", "city", or "port"',
      `${path}.kind`,
    );
  }

  return { name: name.trim(), kind: settlement.kind };
}

export function validatePromptToMapSpec(value: unknown): PromptToMapSpec {
  const spec = requireRecord(value, "spec");
  requireExactKeys(
    spec,
    [
      "version",
      "seed",
      "continentCount",
      "landCoverage",
      "coastlineComplexity",
      "archipelagos",
      "regions",
      "settlements",
    ],
    "spec",
  );

  if (spec.version !== PROMPT_TO_MAP_SPEC_VERSION) {
    throw new PromptToMapSpecError(
      `unsupported version ${String(spec.version)}`,
      "spec.version",
    );
  }

  if (!Array.isArray(spec.settlements) || spec.settlements.length > 100) {
    throw new PromptToMapSpecError(
      "expected an array of at most 100 settlements",
      "spec.settlements",
    );
  }

  const settlements = spec.settlements.map(validateSettlement);
  const names = new Set(settlements.map((settlement) => settlement.name));
  if (names.size !== settlements.length) {
    throw new PromptToMapSpecError(
      "settlement names must be unique",
      "spec.settlements",
    );
  }

  return {
    version: PROMPT_TO_MAP_SPEC_VERSION,
    seed: requireInteger(spec, "seed", 0, 4_294_967_295, "spec"),
    continentCount: requireInteger(spec, "continentCount", 1, 12, "spec"),
    landCoverage: requireNumber(spec, "landCoverage", 0.1, 0.9, "spec"),
    coastlineComplexity: requireInteger(
      spec,
      "coastlineComplexity",
      1,
      5,
      "spec",
    ),
    archipelagos: requireBoolean(spec, "archipelagos", "spec"),
    regions: requireInteger(spec, "regions", 1, 40, "spec"),
    settlements,
  };
}

export function parsePromptToMapSpec(json: string): PromptToMapSpec {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    throw new PromptToMapSpecError("invalid JSON");
  }
  return validatePromptToMapSpec(value);
}

export const VALID_PROMPT_TO_MAP_EXAMPLES: readonly PromptToMapSpec[] = [
  {
    version: 1,
    seed: 18452,
    continentCount: 1,
    landCoverage: 0.55,
    coastlineComplexity: 3,
    archipelagos: false,
    regions: 8,
    settlements: [
      { name: "Northwatch", kind: "city" },
      { name: "Greyhaven", kind: "port" },
    ],
  },
  {
    version: 1,
    seed: 90210,
    continentCount: 5,
    landCoverage: 0.28,
    coastlineComplexity: 5,
    archipelagos: true,
    regions: 20,
    settlements: [
      { name: "Pearl Cay", kind: "port" },
      { name: "Windrest", kind: "town" },
      { name: "The Glass Citadel", kind: "city" },
    ],
  },
  {
    version: 1,
    seed: 4_294_967_295,
    continentCount: 12,
    landCoverage: 0.1,
    coastlineComplexity: 1,
    archipelagos: true,
    regions: 1,
    settlements: [],
  },
];
