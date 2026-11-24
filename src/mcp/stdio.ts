#!/usr/bin/env node
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createPareMcpServer } from "./server";

serveStdio(createPareMcpServer, {
  onerror(error) {
    console.error("PARE MCP error:", error.message);
  },
});
