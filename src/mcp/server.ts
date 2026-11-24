import { McpServer } from "@modelcontextprotocol/server";
import type { z } from "zod";
import { analyzeContext, compareContent } from "../core";
import {
  AnalysisResultSchema,
  AnalyzeInputSchema,
  CompareInputSchema,
  ComparisonResultSchema,
} from "../core/contracts";

export function createPareMcpServer(): McpServer {
  const server = new McpServer(
    { name: "pare", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    "analyze_context",
    {
      title: "Analyze AI context",
      description:
        "When the user asks to trim or inspect a substantial prompt, call this with the exact text. Report each finding and its line numbers. Set includeDraft only when a reviewable cleaned draft is wanted; never silently replace the user's text.",
      inputSchema: AnalyzeInputSchema,
      outputSchema: AnalysisResultSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (input) => {
      const result = analyzeContext(input);
      return {
        content: [{ type: "text", text: summarizeAnalysis(result) }],
        structuredContent: result,
      };
    },
  );

  server.registerTool(
    "compare_content",
    {
      title: "Compare content tokens",
      description:
        "Use this to measure an explicitly supplied original and candidate with the same tokenizer. It does not claim semantic equivalence.",
      inputSchema: CompareInputSchema,
      outputSchema: ComparisonResultSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ original, candidate }) => {
      const result = compareContent(original, candidate);
      return {
        content: [
          {
            type: "text",
            text: `${result.outcome === "reduced" ? "Reduction" : "Difference"}: ${result.deltaTokens} tokens (${result.reductionPercent.toFixed(1)}%). Review meaning before use.`,
          },
        ],
        structuredContent: result,
      };
    },
  );

  return server;
}

function summarizeAnalysis(
  result: z.infer<typeof AnalysisResultSchema>,
): string {
  const lines = [
    `${result.original.tokens} tokens in ${result.tokenization.encoding}; ${result.findings.length} structural ${result.findings.length === 1 ? "finding" : "findings"}.`,
  ];
  for (const finding of result.findings) {
    const locations = finding.evidence
      .map(({ startLine, endLine }) =>
        startLine === endLine
          ? `line ${startLine + 1}`
          : `lines ${startLine + 1}-${endLine + 1}`,
      )
      .join(", ");
    lines.push(`- ${finding.title} (${locations}): ${finding.recommendation}`);
  }
  if (result.draft) {
    lines.push(
      `Review-required draft: ${result.draft.savedTokens} fewer tokens (${result.draft.reductionPercent.toFixed(1)}%). Inspect the complete draft in structuredContent before using it.`,
    );
  } else if (result.draftStatus === "not_requested") {
    lines.push(
      "No draft requested. Call again with includeDraft: true to check for a safe prose-only draft.",
    );
  } else {
    lines.push(
      "No safe automatic draft is available; use the findings as manual suggestions.",
    );
  }
  lines.push("Review meaning before sending any revised context.");
  return lines.join("\n");
}
