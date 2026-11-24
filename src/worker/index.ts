import { createMcpHandler } from "@modelcontextprotocol/server";
import { AnalyzeInputSchema, analyzeContext } from "../core";
import { createPareMcpServer } from "../mcp/server";

type Env = {
  ASSETS: { fetch(request: Request): Promise<Response> };
};

const MAX_REQUEST_BODY_SIZE = 300 * 1024;
const mcp = createMcpHandler(createPareMcpServer, {
  legacy: "stateless",
  responseMode: "json",
  maxRequestBodySize: MAX_REQUEST_BODY_SIZE,
  onerror(error) {
    console.error("PARE MCP request failed:", error.name);
  },
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/analyze") {
      return handleAnalyzeRequest(request);
    }

    if (url.pathname === "/mcp" || url.pathname.startsWith("/mcp/")) {
      const response = await mcp.fetch(request);
      return withPrivateHeaders(response);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleAnalyzeRequest(request: Request): Promise<Response> {
  if (request.method !== "POST")
    return jsonError("METHOD_NOT_ALLOWED", "Use POST for analysis.", 405);
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    return jsonError("UNSUPPORTED_MEDIA_TYPE", "Use application/json.", 415);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BODY_SIZE) {
    return jsonError(
      "INPUT_TOO_LARGE",
      "The request exceeds the current analysis limit.",
      413,
    );
  }

  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BODY_SIZE) {
      return jsonError(
        "INPUT_TOO_LARGE",
        "The request exceeds the current analysis limit.",
        413,
      );
    }

    const body: unknown = JSON.parse(rawBody);
    const input = AnalyzeInputSchema.parse(body);
    return Response.json(analyzeContext(input), {
      headers: privateHeaders(),
    });
  } catch (error) {
    if (error instanceof RangeError)
      return jsonError("INPUT_TOO_LARGE", error.message, 413);
    return jsonError(
      "INVALID_INPUT",
      "The analysis request is invalid or unsupported.",
      400,
    );
  }
}

function jsonError(code: string, message: string, status: number): Response {
  return Response.json(
    { error: { code, message } },
    { status, headers: privateHeaders() },
  );
}

function privateHeaders(): HeadersInit {
  return {
    "cache-control": "no-store",
    "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
    "x-content-type-options": "nosniff",
  };
}

function withPrivateHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(privateHeaders()))
    headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
