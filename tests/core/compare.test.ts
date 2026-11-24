import { describe, expect, it } from "vitest";
import { compareContent } from "../../src/core/compare";

describe("compareContent", () => {
  it("reports a smaller candidate as reduced", () => {
    const result = compareContent(
      "This sentence repeats. This sentence repeats.",
      "This sentence repeats.",
    );
    expect(result.outcome).toBe("reduced");
    expect(result.deltaTokens).toBeGreaterThan(0);
  });

  it("allows an empty explicit candidate with a warning", () => {
    const result = compareContent("Keep this important content.", "");
    expect(result.candidateTokens).toBe(0);
    expect(result.warnings.some((warning) => warning.includes("empty"))).toBe(
      true,
    );
  });

  it("never calls a larger candidate a reduction", () => {
    const result = compareContent(
      "Short.",
      "This candidate is substantially longer than the original text.",
    );
    expect(result.outcome).toBe("increased");
    expect(result.deltaTokens).toBeLessThan(0);
  });
});
