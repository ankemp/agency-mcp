/** Build common headers for GitHub API requests. */
export declare function githubHeaders(): Record<string, string>;
/**
 * Fetch wrapper that respects GitHub rate limits.
 * On a 403 with a Retry-After or x-ratelimit-reset header it waits and
 * retries once.  Other errors are surfaced directly.
 */
export declare function githubFetch(url: string): Promise<Response>;
export declare function sleep(ms: number): Promise<void>;
//# sourceMappingURL=github.d.ts.map