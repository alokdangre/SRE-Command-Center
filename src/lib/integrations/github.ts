/**
 * GitHub Integration
 * Fetches real commit data, PRs, and issues from GitHub API
 */

import { getIntegrationConfig } from "./config";

interface GitHubCommit {
    sha: string;
    message: string;
    author: string;
    timestamp: string;
    files: string[];
    additions: number;
    deletions: number;
    url: string;
}

interface GitHubPullRequest {
    number: number;
    title: string;
    author: string;
    state: "open" | "closed" | "merged";
    createdAt: string;
    mergedAt?: string;
    url: string;
    labels: string[];
}

interface GitHubWorkflowRun {
    id: number;
    name: string;
    status: "queued" | "in_progress" | "completed";
    conclusion?: "success" | "failure" | "cancelled" | "skipped";
    branch: string;
    timestamp: string;
    url: string;
}

/**
 * Fetch recent commits from GitHub
 */
export async function fetchGitHubCommits(
    options: {
        since?: Date;
        path?: string;
        limit?: number;
    } = {}
): Promise<{ commits: GitHubCommit[]; error?: string }> {
    const config = await getIntegrationConfig();

    if (!config.github.enabled) {
        return {
            commits: [],
            error: "GitHub integration not configured for this user. Connect GitHub and select at least one repository in Settings.",
        };
    }

    const { token, defaultRepo, repos } = config.github;
    const repoFullName = defaultRepo || (repos && repos.length > 0 ? repos[0] : undefined);
    const limit = options.limit || 10;
    const since = options.since?.toISOString() || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    if (!token || !repoFullName || !repoFullName.includes("/")) {
        return {
            commits: [],
            error: "GitHub integration missing repository configuration. Add repository as owner/repo in Settings.",
        };
    }

    const [owner, repo] = repoFullName.split("/");

    try {
        // Fetch commits list
        const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits?since=${since}&per_page=${limit}${options.path ? `&path=${options.path}` : ""}`;

        const commitsResponse = await fetch(commitsUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github.v3+json",
                "User-Agent": "SRE-Command-Center",
            },
            next: { revalidate: 60 }, // Cache for 1 minute
        });

        if (!commitsResponse.ok) {
            throw new Error(`GitHub API error: ${commitsResponse.status} ${commitsResponse.statusText}`);
        }

        const commitsData = await commitsResponse.json();

        // Fetch detailed info for each commit (includes file changes)
        const commits: GitHubCommit[] = await Promise.all(
            commitsData.slice(0, limit).map(async (commit: { sha: string; commit: { message: string; author: { name: string; date: string } }; html_url: string }) => {
                // Fetch commit details for file changes
                const detailResponse = await fetch(
                    `https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/vnd.github.v3+json",
                            "User-Agent": "SRE-Command-Center",
                        },
                        next: { revalidate: 300 }, // Cache for 5 minutes
                    }
                );

                let files: string[] = [];
                let additions = 0;
                let deletions = 0;

                if (detailResponse.ok) {
                    const detailData = await detailResponse.json();
                    files = detailData.files?.map((f: { filename: string }) => f.filename) || [];
                    additions = detailData.stats?.additions || 0;
                    deletions = detailData.stats?.deletions || 0;
                }

                return {
                    sha: commit.sha.substring(0, 7),
                    message: commit.commit.message.split("\n")[0], // First line only
                    author: commit.commit.author.name,
                    timestamp: commit.commit.author.date,
                    files,
                    additions,
                    deletions,
                    url: commit.html_url,
                };
            })
        );

        return { commits };
    } catch (error) {
        console.error("GitHub API error:", error);
        return {
            commits: [],
            error: error instanceof Error ? error.message : "Failed to fetch commits",
        };
    }
}

/**
 * Fetch recent pull requests
 */
export async function fetchGitHubPullRequests(
    options: {
        state?: "open" | "closed" | "all";
        limit?: number;
    } = {}
): Promise<{ pullRequests: GitHubPullRequest[]; error?: string }> {
    const config = await getIntegrationConfig();

    if (!config.github.enabled) {
        return {
            pullRequests: [],
            error: "GitHub integration not configured for this user.",
        };
    }

    const { token, defaultRepo, repos } = config.github;
    const repoFullName = defaultRepo || (repos && repos.length > 0 ? repos[0] : undefined);
    const state = options.state || "all";
    const limit = options.limit || 10;

    if (!token || !repoFullName || !repoFullName.includes("/")) {
        return { pullRequests: [], error: "GitHub integration missing repository configuration. Add repository as owner/repo in Settings." };
    }

    const [owner, repo] = repoFullName.split("/");

    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}&per_page=${limit}&sort=updated&direction=desc`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/vnd.github.v3+json",
                    "User-Agent": "SRE-Command-Center",
                },
                next: { revalidate: 60 },
            }
        );

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();

        const pullRequests: GitHubPullRequest[] = data.map((pr: {
            number: number;
            title: string;
            user: { login: string };
            state: string;
            created_at: string;
            merged_at?: string;
            html_url: string;
            labels: Array<{ name: string }>;
        }) => ({
            number: pr.number,
            title: pr.title,
            author: pr.user.login,
            state: pr.merged_at ? "merged" : pr.state as "open" | "closed",
            createdAt: pr.created_at,
            mergedAt: pr.merged_at,
            url: pr.html_url,
            labels: pr.labels.map((l) => l.name),
        }));

        return { pullRequests };
    } catch (error) {
        return {
            pullRequests: [],
            error: error instanceof Error ? error.message : "Failed to fetch PRs",
        };
    }
}

/**
 * Fetch recent workflow runs (CI/CD)
 */
export async function fetchGitHubWorkflowRuns(
    options: { limit?: number } = {}
): Promise<{ runs: GitHubWorkflowRun[]; error?: string }> {
    const config = await getIntegrationConfig();

    if (!config.github.enabled) {
        return {
            runs: [],
            error: "GitHub integration not configured for this user.",
        };
    }

    const { token, defaultRepo, repos } = config.github;
    const repoFullName = defaultRepo || (repos && repos.length > 0 ? repos[0] : undefined);
    const limit = options.limit || 10;

    if (!token || !repoFullName || !repoFullName.includes("/")) {
        return { runs: [], error: "GitHub integration missing repository configuration. Add repository as owner/repo in Settings." };
    }

    const [owner, repo] = repoFullName.split("/");

    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=${limit}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/vnd.github.v3+json",
                    "User-Agent": "SRE-Command-Center",
                },
                next: { revalidate: 30 },
            }
        );

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();

        const runs: GitHubWorkflowRun[] = data.workflow_runs.map((run: {
            id: number;
            name: string;
            status: string;
            conclusion?: string;
            head_branch: string;
            created_at: string;
            html_url: string;
        }) => ({
            id: run.id,
            name: run.name,
            status: run.status as GitHubWorkflowRun["status"],
            conclusion: run.conclusion as GitHubWorkflowRun["conclusion"],
            branch: run.head_branch,
            timestamp: run.created_at,
            url: run.html_url,
        }));

        return { runs };
    } catch (error) {
        return {
            runs: [],
            error: error instanceof Error ? error.message : "Failed to fetch workflow runs",
        };
    }
}

/**
 * Analyze commits for potential issues
 */
export async function analyzeGitHubCommits(options: {
    hoursBack?: number;
    service?: string;
}): Promise<{
    commits: Array<GitHubCommit & {
        isBreakingChange: boolean;
        affectsConfiguration: boolean;
        isLargeChange: boolean;
        riskLevel: "low" | "medium" | "high";
    }>;
    suspiciousCommits: number;
    summary: string;
    error?: string;
}> {
    const since = new Date(Date.now() - (options.hoursBack || 24) * 60 * 60 * 1000);
    const { commits, error } = await fetchGitHubCommits({ since, limit: 20 });

    if (error || commits.length === 0) {
        return {
            commits: [],
            suspiciousCommits: 0,
            summary: error || "No commits found",
            error,
        };
    }

    const analyzedCommits = commits.map((commit) => {
        const isBreakingChange = /breaking|BREAKING/i.test(commit.message);
        const affectsConfiguration = commit.files.some(
            (f) => /config|\.yaml|\.yml|\.json|\.env/i.test(f)
        );
        const isLargeChange = commit.additions + commit.deletions > 200;

        let riskLevel: "low" | "medium" | "high" = "low";
        if (isBreakingChange) riskLevel = "high";
        else if (affectsConfiguration || isLargeChange) riskLevel = "medium";

        return {
            ...commit,
            isBreakingChange,
            affectsConfiguration,
            isLargeChange,
            riskLevel,
        };
    });

    // Filter by service if specified
    const filteredCommits = options.service
        ? analyzedCommits.filter((c) =>
            c.files.some((f) => f.toLowerCase().includes(options.service!.toLowerCase()))
        )
        : analyzedCommits;

    const suspiciousCommits = filteredCommits.filter(
        (c) => c.riskLevel === "high" || c.riskLevel === "medium"
    );

    return {
        commits: filteredCommits,
        suspiciousCommits: suspiciousCommits.length,
        summary: `Analyzed ${filteredCommits.length} commits in the last ${options.hoursBack || 24} hours. ${suspiciousCommits.length
            } commits flagged for review (${suspiciousCommits.filter((c) => c.isBreakingChange).length
            } breaking changes, ${suspiciousCommits.filter((c) => c.affectsConfiguration).length
            } config changes).`,
    };
}
