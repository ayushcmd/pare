import { describe, expect, it } from "vitest";
import { analyzeContext } from "../../src/core/analyze";

const duplicate =
  "PARE should preserve every unique instruction while identifying exact structural repetition that a person can review before use.";

describe("analyzeContext", () => {
  it("finds an exact prose duplicate and creates an opt-in draft", () => {
    const input = `${duplicate}\n\nA separate paragraph remains untouched because it contains unique information for the task.\n\n${duplicate}`;
    const result = analyzeContext({
      text: input,
      sourceKind: "plain_text",
      includeDraft: true,
    });

    expect(
      result.findings.some((finding) => finding.code === "duplicate_prose"),
    ).toBe(true);
    expect(result.draftStatus).toBe("available");
    expect(result.draft?.text).toContain(
      "A separate paragraph remains untouched",
    );
    expect(result.draft?.text.match(/PARE should preserve/g)).toHaveLength(1);
    expect(result.draft?.savedTokens).toBeGreaterThan(0);
    expect(result.draft?.requiresReview).toBe(true);
  });

  it("never drafts changes for code", () => {
    const code = `export function keep(value: string) {\n  return value;\n}\n\nexport function keep(value: string) {\n  return value;\n}`;
    const result = analyzeContext({
      text: code,
      sourceKind: "typescript",
      includeDraft: true,
    });

    expect(result.draft).toBeNull();
    expect(result.draftStatus).toBe("not_eligible");
  });

  it("does not generate a draft unless requested", () => {
    const result = analyzeContext({
      text: `${duplicate}\n\n${duplicate}`,
      sourceKind: "plain_text",
    });

    expect(result.draftStatus).toBe("not_requested");
    expect(result.draft).toBeNull();
  });

  it("preserves unicode and reports UTF-8 bytes", () => {
    const text = "नमस्ते दुनिया — مرحبا بالعالم — hello 👋";
    const result = analyzeContext({ text, sourceKind: "plain_text" });
    expect(result.original.bytes).toBe(
      new TextEncoder().encode(text).byteLength,
    );
    expect(result.original.tokens).toBeGreaterThan(0);
  });
});
