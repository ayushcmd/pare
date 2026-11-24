import { isDraftEligibleDocument } from "./classify";
import { CORE_LIMITS } from "./config";
import type { SourceKind } from "./contracts";
import { findParagraphs } from "./paragraphs";

export type DraftChange = {
  kind: "duplicate_prose_removed";
  startLine: number;
  endLine: number;
  removedCharacters: number;
};

export type DraftCandidate = { text: string; changes: DraftChange[] };

export function createSafeDraft(
  text: string,
  sourceKind: SourceKind,
): DraftCandidate | null {
  if (!isDraftEligibleDocument(text, sourceKind)) return null;

  const paragraphs = findParagraphs(text).slice(0, CORE_LIMITS.maxParagraphs);
  const seen = new Set<string>();
  const removals: Array<{ start: number; end: number; change: DraftChange }> =
    [];

  for (const paragraph of paragraphs) {
    if (paragraph.text.length < CORE_LIMITS.minDuplicateParagraphCharacters)
      continue;
    if (seen.has(paragraph.text)) {
      const start = paragraph.separatorStart;
      removals.push({
        start,
        end: paragraph.end,
        change: {
          kind: "duplicate_prose_removed",
          startLine: paragraph.startLine,
          endLine: paragraph.endLine,
          removedCharacters: paragraph.end - start,
        },
      });
    } else {
      seen.add(paragraph.text);
    }
  }

  if (removals.length === 0) return null;

  let candidate = text;
  for (const removal of removals.toReversed()) {
    candidate = `${candidate.slice(0, removal.start)}${candidate.slice(removal.end)}`;
  }

  return { text: candidate, changes: removals.map((item) => item.change) };
}
