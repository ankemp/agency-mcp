import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSearchAgentsTool, registerGetAgentPromptTool, registerRefreshAgentsTool, } from "./tools/index.js";
import { registerAgentCategoriesResource } from "./resources/index.js";
export function createServer() {
    const server = new McpServer({
        name: "agency-mcp",
        version: "1.0.0",
    }, {
        instructions: "You are connected to the Agency MCP server, which indexes AI agent system prompts from a GitHub repository. " +
            "Use 'search_agents' first with a natural-language description of the task to find matching agents. " +
            "Then use 'get_agent_prompt' with the exact filepath from the search results to retrieve the full system prompt. " +
            "Adopt the retrieved prompt as your active persona for the conversation.",
    });
    // Resources
    registerAgentCategoriesResource(server);
    // Tools
    registerSearchAgentsTool(server);
    registerGetAgentPromptTool(server);
    registerRefreshAgentsTool(server);
    return server;
}
//# sourceMappingURL=server.js.map