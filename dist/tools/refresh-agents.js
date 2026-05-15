import { z } from "zod";
import { performHydration, getAgentCache } from "../cache.js";
export function registerRefreshAgentsTool(server) {
    server.registerTool("refresh_agents", {
        description: "Re-index the agent repository. Use this if the agent cache is stale or if hydration previously failed.",
        inputSchema: z.object({}),
        annotations: {
            readOnlyHint: false,
            openWorldHint: false,
        },
    }, async () => {
        try {
            await performHydration();
            return {
                content: [
                    {
                        type: "text",
                        text: `Agent index refreshed — ${getAgentCache().length} agents indexed.`,
                    },
                ],
            };
        }
        catch {
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: `Refresh failed. Use search_agents to check the current state.`,
                    },
                ],
            };
        }
    });
}
//# sourceMappingURL=refresh-agents.js.map