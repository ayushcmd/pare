import type { ComparisonResult } from "./contracts";
import { countTextTokens, TOKENIZATION } from "./tokenizer";

export function compareContent(
  original: string,
  candidate: string,
): ComparisonResult {
  const originalTokens = countTextTokens(original);
  const candidateTokens = countTextTokens(candidate);
  const deltaTokens = originalTokens - candidateTokens;
  const reductionPercent =
    originalTokens === 0 ? 0 : (deltaTokens / originalTokens) * 100;
  const warnings: string[] = [
    "Token reduction does not guarantee equivalent meaning or model quality.",
  ];
  if (candidate.length === 0)
    warnings.push(
      "The candidate is empty and would remove all supplied content.",
    );

  return {
    schemaVersion: "1.0",
    tokenization: TOKENIZATION,
    originalTokens,
    candidateTokens,
    deltaTokens,
    reductionPercent,
    outcome:
      deltaTokens > 0 ? "reduced" : deltaTokens < 0 ? "increased" : "unchanged",
    warnings,
  };
}
