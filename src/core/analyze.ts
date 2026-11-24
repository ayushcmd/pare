import { assertWithinCoreLimits, utf8Bytes } from "./config";
import type { AnalysisResult, AnalyzeInput } from "./contracts";
import { AnalysisResultSchema, AnalyzeInputSchema } from "./contracts";
import { detectFindings } from "./detectors";
import { createSafeDraft } from "./draft";
import { countTextTokens, TOKENIZATION } from "./tokenizer";

export function analyzeContext(rawInput: AnalyzeInput): AnalysisResult {
  const input = AnalyzeInputSchema.parse(rawInput);
  assertWithinCoreLimits(input.text, input.task);

  const originalTokens = countTextTokens(input.text);
  const findings = detectFindings(
    input.text,
    input.sourceKind,
    originalTokens,
    input.task,
  );
  const base = {
    schemaVersion: "1.0" as const,
    tokenization: TOKENIZATION,
    original: {
      tokens: originalTokens,
      bytes: utf8Bytes(input.text),
      lines: input.text.split(/\r\n|\r|\n/).length,
    },
    findings,
    warnings: [
      "PARE detects structural patterns and cannot prove that a shorter input preserves meaning.",
    ],
  };

  if (!input.includeDraft) {
    return AnalysisResultSchema.parse({
      ...base,
      draftStatus: "not_requested",
      draft: null,
    });
  }

  const candidate = createSafeDraft(input.text, input.sourceKind);
  if (!candidate) {
    const ineligible = input.sourceKind !== "plain_text";
    return AnalysisResultSchema.parse({
      ...base,
      draftStatus: ineligible ? "not_eligible" : "no_safe_change",
      draft: null,
    });
  }

  const candidateTokens = countTextTokens(candidate.text);
  const savedTokens = originalTokens - candidateTokens;
  if (savedTokens <= 0) {
    return AnalysisResultSchema.parse({
      ...base,
      draftStatus: "no_safe_change",
      draft: null,
    });
  }

  return AnalysisResultSchema.parse({
    ...base,
    draftStatus: "available",
    draft: {
      text: candidate.text,
      tokens: candidateTokens,
      savedTokens,
      reductionPercent: (savedTokens / originalTokens) * 100,
      requiresReview: true,
      changes: candidate.changes,
    },
  });
}
