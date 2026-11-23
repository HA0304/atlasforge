import { describe, expect, it } from "vitest";

import {
  PromptToMapSpecError,
  VALID_PROMPT_TO_MAP_EXAMPLES,
  parsePromptToMapSpec,
  requestValidatedMapSpec,
  validatePromptToMapSpec,
} from "./mapSpec";

describe("prompt-to-map specification", () => {
  it("accepts the three valid examples", () => {
    for (const example of VALID_PROMPT_TO_MAP_EXAMPLES) {
      expect(validatePromptToMapSpec(example)).toEqual(example);
    }
  });

  it("round-trips a valid specification through JSON", () => {
    const example = VALID_PROMPT_TO_MAP_EXAMPLES[1];
    expect(parsePromptToMapSpec(JSON.stringify(example))).toEqual(example);
  });

  it("rejects unsupported and missing fields", () => {
    expect(() =>
      validatePromptToMapSpec({
        ...VALID_PROMPT_TO_MAP_EXAMPLES[0],
        version: 99,
      }),
    ).toThrow(/unsupported version/);

    const missing: Record<string, unknown> = {
      ...VALID_PROMPT_TO_MAP_EXAMPLES[0],
    };
    delete missing.regions;
    expect(() => validatePromptToMapSpec(missing)).toThrow(/regions/);
  });

  it("rejects unknown fields", () => {
    expect(() =>
      validatePromptToMapSpec({
        ...VALID_PROMPT_TO_MAP_EXAMPLES[0],
        executableCode: "no",
      }),
    ).toThrow(/unknown field/);
  });

  it("rejects out-of-range numeric values", () => {
    const invalid = [
      { seed: -1 },
      { seed: 1.5 },
      { continentCount: 0 },
      { continentCount: 13 },
      { landCoverage: 0.09 },
      { landCoverage: 0.91 },
      { coastlineComplexity: 0 },
      { coastlineComplexity: 6 },
      { regions: 0 },
      { regions: 41 },
    ];

    for (const change of invalid) {
      expect(() =>
        validatePromptToMapSpec({
          ...VALID_PROMPT_TO_MAP_EXAMPLES[0],
          ...change,
        }),
      ).toThrow(PromptToMapSpecError);
    }
  });

  it("rejects invalid booleans, settlements and JSON", () => {
    expect(() =>
      validatePromptToMapSpec({
        ...VALID_PROMPT_TO_MAP_EXAMPLES[0],
        archipelagos: "yes",
      }),
    ).toThrow(/boolean/);

    expect(() =>
      validatePromptToMapSpec({
        ...VALID_PROMPT_TO_MAP_EXAMPLES[0],
        settlements: [{ name: "Port", kind: "harbor" }],
      }),
    ).toThrow(/town.*city.*port/);

    expect(() =>
      validatePromptToMapSpec({
        ...VALID_PROMPT_TO_MAP_EXAMPLES[0],
        settlements: [
          { name: "Twin", kind: "town" },
          { name: "Twin", kind: "city" },
        ],
      }),
    ).toThrow(/unique/);

    expect(() => parsePromptToMapSpec("{broken")).toThrow(/invalid JSON/);
  });

  it("bounds provider prompts and validates provider output", async () => {
    await expect(
      requestValidatedMapSpec(
        {
          generateSpec: async () => VALID_PROMPT_TO_MAP_EXAMPLES[0],
        },
        "",
      ),
    ).rejects.toThrow(/prompt/);

    await expect(
      requestValidatedMapSpec(
        {
          generateSpec: async () => ({ ...VALID_PROMPT_TO_MAP_EXAMPLES[0], regions: 99 }),
        },
        "Generate a map",
      ),
    ).rejects.toThrow(/regions/);
  });
});
