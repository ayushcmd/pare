import { CORE_LIMITS } from "./config";
import type { Finding, SourceKind } from "./contracts";
import { findParagraphs } from "./paragraphs";

export function detectFindings(
  text: string,
  sourceKind: SourceKind,
  tokens: number,
): Finding[] {
  const findings: Finding[] = [];
  const paragraphs = findParagraphs(text).slice(0, CORE_LIMITS.maxParagraphs);
  const firstByText = new Map<string, (typeof paragraphs)[number]>();

  for (const paragraph of paragraphs) {
    if (paragraph.text.length < CORE_LIMITS.minDuplicateParagraphCharacters)
      continue;
    const first = firstByText.get(paragraph.text);
    if (first) {
      findings.push({
        code: "duplicate_prose",
        title: "Repeated prose",
        message: "An exact standalone paragraph appears more than once.",
        recommendation:
          "Review whether the later copy is intentional before removing it.",
        confidence: "high",
        risk: "low",
        evidence: [
          { startLine: first.startLine, endLine: first.endLine },
          { startLine: paragraph.startLine, endLine: paragraph.endLine },
        ],
      });
    } else {
      firstByText.set(paragraph.text, paragraph);
    }
    if (findings.length >= CORE_LIMITS.maxFindings) return findings;
  }

  if (tokens >= CORE_LIMITS.oversizedTokenThreshold) {
    findings.push({
      code: "oversized_context",
      title: "Large context",
      message: `This input contains ${tokens.toLocaleString()} tokens in the selected encoding.`,
      recommendation:
        "Consider sending only the sections needed for the current task.",
      confidence: "high",
      risk: "medium",
      evidence: [
        {
          startLine: 0,
          endLine: Math.max(0, text.split(/\r\n|\r|\n/).length - 1),
        },
      ],
    });
  }

  if (sourceKind === "log") {
    const lineCount = text.split(/\r\n|\r|\n/).length;
    if (lineCount >= CORE_LIMITS.verboseLogLineThreshold) {
      findings.push({
        code: "verbose_log",
        title: "Long log output",
        message: `The supplied log contains ${lineCount.toLocaleString()} lines.`,
        recommendation:
          "Keep failures, stack traces, and nearby context; filter routine success output upstream.",
        confidence: "high",
        risk: "high",
        evidence: [{ startLine: 0, endLine: lineCount - 1 }],
      });
    }
  }

  if (sourceKind === "json") detectJson(text, findings);
  if (
    sourceKind === "mcp_tool_schema" &&
    text.length >= CORE_LIMITS.verboseToolDescriptionCharacters
  ) {
    findings.push({
      code: "tool_schema_bloat",
      title: "Verbose tool metadata",
      message:
        "The supplied MCP metadata contains substantial descriptive text.",
      recommendation:
        "Shorten repeated prose while preserving parameter constraints and safety guidance.",
      confidence: "medium",
      risk: "high",
      evidence: [
        {
          startLine: 0,
          endLine: Math.max(0, text.split(/\r\n|\r|\n/).length - 1),
        },
      ],
    });
  }

  return findings.slice(0, CORE_LIMITS.maxFindings);
}

function detectJson(text: string, findings: Finding[]): void {
  try {
    const value: unknown = JSON.parse(text);
    const hasLargeArray = findLargeArray(value);
    if (!hasLargeArray) return;
    findings.push({
      code: "verbose_json",
      title: "Large JSON collection",
      message: "The supplied JSON contains a large array.",
      recommendation:
        "Select required fields or paginate upstream; PARE will not remove JSON values automatically.",
      confidence: "high",
      risk: "high",
      evidence: [
        {
          startLine: 0,
          endLine: Math.max(0, text.split(/\r\n|\r|\n/).length - 1),
        },
      ],
    });
  } catch {
    // Invalid JSON remains analyzable as text and is never repaired automatically.
  }
}

function findLargeArray(value: unknown, depth = 0): boolean {
  if (depth > 12) return false;
  if (Array.isArray(value)) {
    return (
      value.length >= CORE_LIMITS.verboseJsonArrayThreshold ||
      value.some((item) => findLargeArray(item, depth + 1))
    );
  }
  if (value && typeof value === "object") {
    return Object.values(value).some((item) => findLargeArray(item, depth + 1));
  }
  return false;
}
