#!/usr/bin/env node
import { createServer as createHttpServer } from "node:http";
import { randomUUID } from "node:crypto";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.js";
import { performHydration } from "./cache.js";

function logHydrationError(err: unknown): void {
  console.error(
    `[hydrate] Hydration failed: ${err instanceof Error ? err.message : err}. ` +
      "Server remains alive — use refresh_agents to retry."
  );
}

async function runStdio(): Promise<void> {
  const server = createServer();

  // Start hydration in background so the transport can connect immediately.
  const hydrationPromise = performHydration().catch(logHydrationError);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[server] MCP server running on stdio.");

  await hydrationPromise;

  const shutdown = async () => {
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

async function runHttp(port: number): Promise<void> {
  const server = createServer();
  await performHydration().catch(logHydrationError);

  // One transport instance per active session.
  const transports = new Map<string, StreamableHTTPServerTransport>();

  const httpServer = createHttpServer(async (req, res) => {
    const url = req.url ?? "";

    if (url !== "/mcp") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not Found" }));
      return;
    }

    // DELETE — client requests session termination.
    if (req.method === "DELETE") {
      const sid = req.headers["mcp-session-id"] as string | undefined;
      const transport = sid ? transports.get(sid) : undefined;
      if (transport) {
        await transport.close();
        transports.delete(sid!);
        res.writeHead(200);
        res.end();
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Session not found" }));
      }
      return;
    }

    // GET — SSE stream for an existing session.
    if (req.method === "GET") {
      const sid = req.headers["mcp-session-id"] as string | undefined;
      const transport = sid ? transports.get(sid) : undefined;
      if (transport) {
        await transport.handleRequest(req, res);
      } else {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid or missing session ID" }));
      }
      return;
    }

    // POST — MCP JSON-RPC messages.
    if (req.method === "POST") {
      let body: unknown;
      try {
        const raw = await new Promise<string>((resolve, reject) => {
          const chunks: Buffer[] = [];
          req.on("data", (chunk: Buffer) => chunks.push(chunk));
          req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
          req.on("error", reject);
        });
        body = raw ? JSON.parse(raw) : {};
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON body" }));
        return;
      }

      const sid = req.headers["mcp-session-id"] as string | undefined;
      const existing = sid ? transports.get(sid) : undefined;

      if (existing) {
        await existing.handleRequest(req, res, body);
        return;
      }

      // No existing session — only an initialize request may start one.
      const isInit =
        (typeof body === "object" &&
          body !== null &&
          !Array.isArray(body) &&
          (body as Record<string, unknown>).method === "initialize") ||
        (Array.isArray(body) &&
          body.some(
            (m) =>
              typeof m === "object" &&
              m !== null &&
              (m as Record<string, unknown>).method === "initialize"
          ));

      if (!isInit) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ error: "Missing session ID or not an initialize request" })
        );
        return;
      }

      const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSid) => { transports.set(newSid, transport); },
      });
      transport.onclose = () => {
        if (transport.sessionId) transports.delete(transport.sessionId);
      };
      await server.connect(transport);
      await transport.handleRequest(req, res, body);
      return;
    }

    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method Not Allowed" }));
  });

  httpServer.listen(port, () => {
    console.error(`[server] MCP server running on HTTP port ${port}.`);
  });

  const shutdown = async () => {
    for (const t of transports.values()) {
      await t.close().catch(() => {});
    }
    httpServer.close();
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

async function main(): Promise<void> {
  const rawPort = process.env.MCP_HTTP_PORT;
  const httpPort = rawPort ? parseInt(rawPort, 10) : undefined;

  if (httpPort) {
    await runHttp(httpPort);
  } else {
    await runStdio();
  }
}

main().catch((err) => {
  console.error(`[fatal] ${err}`);
  process.exit(1);
});
