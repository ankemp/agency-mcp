import { PAT } from "./config.js";

/** Build common headers for GitHub API requests. */
export function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "agency-mcp/1.0",
  };
  if (PAT) {
    headers["Authorization"] = `Bearer ${PAT}`;
  }
  return headers;
}

/**
 * Fetch wrapper that respects GitHub rate limits.
 * On a 403 with a Retry-After or x-ratelimit-reset header it waits and
 * retries once.  Other errors are surfaced directly.
 */
export async function githubFetch(url: string): Promise<Response> {
  const res = await fetch(url, { headers: githubHeaders() });

  if (res.status === 403) {
    const retryAfter = res.headers.get("retry-after");
    const resetEpoch = res.headers.get("x-ratelimit-reset");
    let waitMs = 0;

    if (retryAfter) {
      waitMs = parseInt(retryAfter, 10) * 1000;
    } else if (resetEpoch) {
      waitMs = parseInt(resetEpoch, 10) * 1000 - Date.now();
    }

    if (waitMs > 0 && waitMs < 120_000) {
      console.error(
        `[hydrate] Rate-limited. Waiting ${Math.ceil(waitMs / 1000)}s before retry…`
      );
      await sleep(waitMs + 1000);
      return fetch(url, { headers: githubHeaders() });
    }

    throw new Error(
      `GitHub rate limit exceeded. ${PAT ? "Your PAT may have hit its limit." : "Set GITHUB_PAT to raise the limit."}`
    );
  }

  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${res.statusText} — ${url}`);
  }

  return res;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
