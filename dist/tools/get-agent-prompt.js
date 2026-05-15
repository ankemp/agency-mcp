import { z } from "zod";
import { hydrationGuard, getAgentCache } from "../cache.js";
export function registerGetAgentPromptTool(server) {
    server.registerTool("get_agent_prompt", {
        description: "Retrieve the full markdown system prompt for a specific agent. " +
            "Use the exact filepath returned by search_agents.",
        inputSchema: z.object({
            filepath: z
                .string()
                .describe('The exact repo-relative file path of the agent, e.g. "engineering/database-optimizer.md".'),
        }),
        annotations: {
            readOnlyHint: true,
            openWorldHint: false,
        },
    }, async ({ filepath }) => {
        const guard = hydrationGuard();
        if (guard)
            return guard;
        const doc = getAgentCache().find((d) => d.filepath === filepath);
        if (!doc) {
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: `Agent not found in cache: "${filepath}". Use search_agents to find valid paths.`,
                    },
                ],
            };
        }
        return {
            content: [{ type: "text", text: doc.fullContent }],
        };
    });
}
//# sourceMappingURL=get-agent-prompt.js.map