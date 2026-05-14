#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/server";
import { createServer } from "./server.js";
import { performHydration } from "./cache.js";

async function main(): Promise<void> {
  const server = createServer();

  // Start hydration in the background so the transport can connect immediately.
  // Tools will return a descriptive error if hydration fails.
  const hydrationPromise = performHydration().catch((err) => {
    console.error(
      `[hydrate] Hydration failed: ${err instanceof Error ? err.message : err}. ` +
        "Server remains alive — use refresh_agents to retry."
    );
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[server] MCP server running on stdio.");

  // Wait for hydration to finish (the server is already accepting requests).
  await hydrationPromise;

  const shutdown = async () => {
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(`[fatal] ${err}`);
  process.exit(1);
});
