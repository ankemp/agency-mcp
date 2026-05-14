// ---------------------------------------------------------------------------
// Configuration from environment
// ---------------------------------------------------------------------------

const GITHUB_REPO = process.env.GITHUB_REPO ?? "msitarzewski/agency-agents";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH ?? "main";
const GITHUB_PAT = process.env.GITHUB_PAT; // optional

const repoParts = GITHUB_REPO.split("/");
if (repoParts.length !== 2 || !repoParts[0] || !repoParts[1]) {
  console.error(
    `[config] GITHUB_REPO must be in "owner/repo" format, got: "${GITHUB_REPO}"`
  );
  process.exit(1);
}

export const OWNER = repoParts[0];
export const REPO = repoParts[1];
export const BRANCH = GITHUB_BRANCH;
export const PAT = GITHUB_PAT;

export const GITHUB_API = "https://api.github.com";

/** Paths / files to ignore when scanning the repo tree */
export const IGNORED_PATHS = [".github/", "LICENSE"];
export const IGNORED_FILES = ["readme.md"];

/** Max concurrent raw-content fetches per batch */
export const BATCH_SIZE = 10;
