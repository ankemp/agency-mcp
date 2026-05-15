import Fuse from "fuse.js";
import { OWNER, REPO, BRANCH, GITHUB_API, IGNORED_PATHS, IGNORED_FILES, BATCH_SIZE, } from "./config.js";
import { githubFetch, sleep } from "./github.js";
// ---------------------------------------------------------------------------
// In-memory state
// ---------------------------------------------------------------------------
let agentCache = [];
let fuseIndex = null;
let hydrationError = null;
let hydrating = false;
// ---------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------
export function getAgentCache() {
    return agentCache;
}
export function getFuseIndex() {
    return fuseIndex;
}
// ---------------------------------------------------------------------------
// Hydration — fetch repo tree + file contents, build Fuse index
// ---------------------------------------------------------------------------
async function hydrate() {
    console.error(`[hydrate] Fetching tree for ${OWNER}/${REPO}@${BRANCH}…`);
    const treeUrl = `${GITHUB_API}/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`;
    const treeRes = await githubFetch(treeUrl);
    const treeData = (await treeRes.json());
    if (treeData.truncated) {
        console.error("[hydrate] Warning: tree was truncated by GitHub. Some files may be missing.");
    }
    const mdFiles = treeData.tree.filter((node) => {
        if (node.type !== "blob")
            return false;
        if (!node.path.endsWith(".md"))
            return false;
        if (IGNORED_PATHS.some((prefix) => node.path.startsWith(prefix)))
            return false;
        if (IGNORED_FILES.includes(node.path.toLowerCase()))
            return false;
        return true;
    });
    console.error(`[hydrate] Found ${mdFiles.length} agent markdown files.`);
    const documents = [];
    for (let i = 0; i < mdFiles.length; i += BATCH_SIZE) {
        const batch = mdFiles.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(batch.map(async (file) => {
            const rawUrl = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${file.path}`;
            const res = await githubFetch(rawUrl);
            const text = await res.text();
            return { path: file.path, text };
        }));
        for (const result of results) {
            if (result.status === "fulfilled") {
                const { path, text } = result.value;
                const parts = path.split("/");
                const category = parts.length > 1 ? parts[0] : "root";
                const filename = parts[parts.length - 1].replace(/\.md$/i, "");
                documents.push({
                    filepath: path,
                    category,
                    filename,
                    contentSnippet: text.slice(0, 1500),
                    fullContent: text,
                });
            }
            else {
                console.error(`[hydrate] Failed to fetch a file: ${result.reason}`);
            }
        }
        if (i + BATCH_SIZE < mdFiles.length) {
            await sleep(200);
        }
    }
    fuseIndex = new Fuse(documents, {
        keys: [
            { name: "filename", weight: 0.35 },
            { name: "category", weight: 0.2 },
            { name: "contentSnippet", weight: 0.45 },
        ],
        includeScore: true,
        threshold: 0.45,
        ignoreLocation: true,
    });
    agentCache = documents;
    console.error(`[hydrate] Cache ready — ${agentCache.length} agents indexed.`);
}
// ---------------------------------------------------------------------------
// Hydration orchestrator
// ---------------------------------------------------------------------------
export async function performHydration() {
    if (hydrating)
        throw new Error("Hydration is already in progress.");
    hydrating = true;
    hydrationError = null;
    try {
        await hydrate();
    }
    catch (err) {
        hydrationError = err instanceof Error ? err.message : String(err);
        throw err;
    }
    finally {
        hydrating = false;
    }
}
/** Returns an MCP isError response if hydration is unavailable, or null if ready. */
export function hydrationGuard() {
    if (hydrationError) {
        return {
            isError: true,
            content: [
                {
                    type: "text",
                    text: `Agent index is unavailable: ${hydrationError}. Use the refresh_agents tool to retry.`,
                },
            ],
        };
    }
    if (hydrating || !fuseIndex) {
        return {
            isError: true,
            content: [
                {
                    type: "text",
                    text: "Agent index is not ready yet. The server is still hydrating.",
                },
            ],
        };
    }
    return null;
}
//# sourceMappingURL=cache.js.map