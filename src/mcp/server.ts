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
        "Use this before sending substantial text to an AI model. Finds structural token waste and can propose only conservative, review-required prose deduplication.",
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
  const findingText = `${result.findings.length} structural ${result.findings.length === 1 ? "finding" : "findings"}`;
  if (result.draft) {
    return `${findingText}. A review-required draft saves ${result.draft.savedTokens} tokens (${result.draft.reductionPercent.toFixed(1)}%) with the selected encoding.`;
  }
  return `${findingText}. No measured draft reduction is available.`;
}
