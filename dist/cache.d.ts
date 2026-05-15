import Fuse from "fuse.js";
import type { AgentDocument } from "./types.js";
export declare function getAgentCache(): readonly AgentDocument[];
export declare function getFuseIndex(): Fuse<AgentDocument> | null;
export declare function performHydration(): Promise<void>;
/** Returns an MCP isError response if hydration is unavailable, or null if ready. */
export declare function hydrationGuard(): {
    isError: true;
    content: {
        type: "text";
        text: string;
    }[];
} | null;
//# sourceMappingURL=cache.d.ts.map