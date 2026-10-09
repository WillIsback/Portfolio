import type { DevOps, Language } from "@/schemas";

export interface GitHubRepo {
	id: number;
	name: string;
	full_name: string;
	description: string | null;
	html_url: string;
	pushed_at: string;
	language: string | null;
	private: boolean;
}

export interface DetectedTechStack {
	languages: Language[];
	databases: string[];
	backends: string[];
	frontends: string[];
	devops: DevOps[];
}

const GITHUB_API = "https://api.github.com";

const LANGUAGE_MAP: Record<string, Language> = {
	Python: "Python",
	TypeScript: "TypeScript",
	JavaScript: "JavaScript",
	Rust: "Rust",
};

export function detectTechStack(
	filePaths: string[],
	primaryLanguage: string | null,
): DetectedTechStack {
	const languages: Language[] = [];
	const devops: DevOps[] = [];

	if (primaryLanguage && LANGUAGE_MAP[primaryLanguage]) {
		languages.push(LANGUAGE_MAP[primaryLanguage]);
	}

	const hasDockerfile = filePaths.some(
		(p) => p === "Dockerfile" || p.endsWith("/Dockerfile"),
	);
	if (hasDockerfile) devops.push("Docker");

	const hasGithubActions = filePaths.some((p) =>
		p.startsWith(".github/workflows/"),
	);
	if (hasGithubActions) devops.push("GithubActions");

	return { languages, databases: [], backends: [], frontends: [], devops };
}

export async function fetchUserRepos(username: string): Promise<GitHubRepo[]> {
	const token = process.env.GITHUB_TOKEN;
	const res = await fetch(
		`${GITHUB_API}/users/${username}/repos?per_page=100&sort=updated&type=public`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/vnd.github.v3+json",
			},
			next: { revalidate: 300 },
		},
	);
	if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
	return res.json();
}

export async function fetchRepoFilePaths(
	owner: string,
	repo: string,
): Promise<string[]> {
	const token = process.env.GITHUB_TOKEN;
	const res = await fetch(
		`${GITHUB_API}/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/vnd.github.v3+json",
			},
			next: { revalidate: 300 },
		},
	);
	if (!res.ok) return [];
	const data = await res.json();
	return (data.tree ?? []).map((item: { path: string }) => item.path);
}
