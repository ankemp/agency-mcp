/** A single agent document stored in the in-memory cache. */
export interface AgentDocument {
    /** Repo-relative path, e.g. "engineering/database-optimizer.md" */
    filepath: string;
    /** Folder name used as the category, e.g. "engineering" */
    category: string;
    /** File stem without extension, e.g. "database-optimizer" */
    filename: string;
    /** First 1500 chars of the file — usually contains the persona summary */
    contentSnippet: string;
    /** Full raw markdown content */
    fullContent: string;
}
//# sourceMappingURL=types.d.ts.map