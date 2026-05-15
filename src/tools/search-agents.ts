import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { hydrationGuard, getFuseIndex } from "../cache.js";

export function registerSearchAgentsTool(server: McpServer): void {
  server.registerTool(
    "search_agents",
    {
      description:
        "Search the agent index for the best-matching AI agent prompts. " +
        "Returns the top 5 results with filepath, category, and a content snippet " +
        "so the LLM can decide which agent to load.",
      inputSchema: z.object({
        query: z
          .string()
          .describe("A description of the task or the kind of agent you need."),
      }),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async ({ query }) => {
      const guard = hydrationGuard();
      if (guard) return guard;

      const results = getFuseIndex()!.search(query, { limit: 5 });

      const payload = results.map((r) => ({
        filepath: r.item.filepath,
        category: r.item.category,
        filename: r.item.filename,
        score: r.score,
        contentSnippet: r.item.contentSnippet,
      }));

      return {
        content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
      };
    }
  );
}
