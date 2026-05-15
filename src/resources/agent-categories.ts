import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getAgentCache } from "../cache.js";

export function registerAgentCategoriesResource(server: McpServer): void {
  server.registerResource(
    "agent-categories",
    "agent-categories://list",
    {
      title: "Agent Categories",
      description:
        "Lists all available agent categories (top-level folders) in the indexed repository.",
      mimeType: "application/json",
    },
    async (uri) => {
      const categories = [...new Set(getAgentCache().map((d) => d.category))].sort();
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(categories, null, 2),
          },
        ],
      };
    }
  );
}
