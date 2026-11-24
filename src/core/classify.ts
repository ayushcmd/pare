import type { SourceKind } from "./contracts";

const AMBIGUOUS_PROSE_PATTERNS = [
  /^\s{4,}\S/m,
  /^\s*#{1,6}\s/m,
  /^\s*[-*+]\s/m,
  /^\s*\d+[.)]\s/m,
  /^\s*>/m,
  /```|~~~/,
  /<\/?[a-z][^>]*>/i,
  /(^|\n)\s*[{}[\]]/,
  /\b(import|export|function|class|const|let|def)\b/,
  /^\s*\w+[=:]\s*\S+/m,
];

export function isDraftEligibleDocument(
  text: string,
  sourceKind: SourceKind,
): boolean {
  if (sourceKind !== "plain_text") return false;
  if (text.includes("\0")) return false;
  return !AMBIGUOUS_PROSE_PATTERNS.some((pattern) => pattern.test(text));
}
