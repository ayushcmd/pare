import { spawn } from "node:child_process";
import { mkdtemp, readdir, readFile, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve, sep } from "node:path";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run this check with npm run test:package.");

const scratch = await mkdtemp(join(tmpdir(), "pare-package-smoke-"));

try {
  await runNpm(["pack", "--pack-destination", scratch, "--json"]);
  const archives = (await readdir(scratch)).filter((file) =>
    file.endsWith(".tgz"),
  );
  if (archives.length !== 1)
    throw new Error("Expected exactly one npm tarball.");

  const installDir = join(scratch, "install");
  await runNpm([
    "install",
    "--prefix",
    installDir,
    join(scratch, archives[0]),
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
  ]);

  const packageDir = join(installDir, "node_modules", "pare-mcp");
  const manifest = JSON.parse(
    await readFile(join(packageDir, "package.json"), "utf8"),
  );
  if (
    manifest.name !== "pare-mcp" ||
    manifest.bin?.["pare-mcp"] !== "./dist/mcp/stdio.js"
  ) {
    throw new Error(
      "Installed package metadata does not expose the expected command.",
    );
  }

  const client = new Client({ name: "pare-package-smoke", version: "1.0.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(packageDir, "dist", "mcp", "stdio.js")],
    stderr: "pipe",
  });

  try {
    await client.connect(transport);
    const tools = await client.listTools();
    const names = tools.tools.map((tool) => tool.name).sort();
    if (
      JSON.stringify(names) !==
      JSON.stringify(["analyze_context", "compare_content"])
    ) {
      throw new Error(`Unexpected installed tool list: ${names.join(", ")}`);
    }

    const analysis = await client.callTool({
      name: "analyze_context",
      arguments: { text: "A short example for package installation testing." },
    });
    if (
      analysis.isError ||
      typeof analysis.structuredContent?.original !== "object"
    ) {
      throw new Error("Installed analyze_context call failed.");
    }

    const comparison = await client.callTool({
      name: "compare_content",
      arguments: {
        original: "A longer sample sentence.",
        candidate: "Short sample.",
      },
    });
    if (
      comparison.isError ||
      comparison.structuredContent?.schemaVersion !== "1.0"
    ) {
      throw new Error("Installed compare_content call failed.");
    }
  } finally {
    await client.close();
  }

  process.stdout.write(
    "Installed npm tarball passed MCP tool discovery and both calls.\n",
  );
} finally {
  const root = resolve(tmpdir()) + sep;
  const target = await realpath(scratch);
  if (
    target.startsWith(root) &&
    basename(target).startsWith("pare-package-smoke-")
  ) {
    await rm(target, { recursive: true, force: true });
  }
}

async function runNpm(args) {
  await new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, [npmCli, ...args], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.stderr.on("data", (chunk) => {
      output += chunk;
    });
    child.on("error", rejectRun);
    child.on("close", (code) => {
      if (code === 0) resolveRun();
      else
        rejectRun(new Error(`npm ${args[0]} failed: ${output.slice(-2000)}`));
    });
  });
}
