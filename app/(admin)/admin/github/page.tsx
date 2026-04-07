// app/(admin)/github/page.tsx

import prisma from "@/lib/db";
import { fetchUserRepos } from "@/lib/github";
import { GitHubReposBrowser } from "./GitHubReposBrowser";

export default async function AdminGitHubPage() {
	const [repos, dbProjects] = await Promise.all([
		fetchUserRepos("WillIsback"),
		prisma.project.findMany({ select: { github: true } }),
	]);

	const importedUrls = new Set(dbProjects.map((p) => p.github).filter(Boolean));

	return (
		<div className="max-w-4xl">
			<h1 className="text-2xl font-bold font-mono mb-2">Import from GitHub</h1>
			<p className="text-sm text-zinc-500 mb-8">
				{repos.length} public repos found. Select repos to import into the DB.
			</p>
			<GitHubReposBrowser
				repos={repos}
				importedUrls={Array.from(importedUrls) as string[]}
			/>
		</div>
	);
}
