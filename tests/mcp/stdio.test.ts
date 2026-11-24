import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { describe, expect, it } from "vitest";

const repeated =
  "Keep this exact paragraph because it explains how to deploy the application safely and contains guidance a reviewer should inspect.";

describe("stdio MCP client", () => {
  it("discovers and calls the two tools through the built server", async () => {
    const client = new Client({ name: "pare-contract-test", version: "1.0.0" });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: ["dist/mcp/stdio.js"],
      cwd: process.cwd(),
      stderr: "pipe",
    });

    try {
      await client.connect(transport);
      const listed = await client.listTools();
      expect(listed.tools.map((tool) => tool.name).sort()).toEqual([
        "analyze_context",
        "compare_content",
      ]);

      const analysis = await client.callTool({
        name: "analyze_context",
        arguments: {
          text: `${repeated}\n\n${repeated}`,
          sourceKind: "plain_text",
          includeDraft: true,
        },
      });
      expect(analysis.isError).not.toBe(true);
      expect(analysis.structuredContent).toMatchObject({
        draftStatus: "available",
      });
      expect(analysis.content).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "text",
            text: expect.stringContaining("Repeated prose (line 1, line 3)"),
          }),
        ]),
      );

      const comparison = await client.callTool({
        name: "compare_content",
        arguments: {
          original: `${repeated}\n\n${repeated}`,
          candidate: repeated,
        },
      });
      expect(comparison.isError).not.toBe(true);
      expect(comparison.structuredContent).toMatchObject({
        outcome: "reduced",
      });
    } finally {
      await client.close();
    }
  }, 20_000);
});
