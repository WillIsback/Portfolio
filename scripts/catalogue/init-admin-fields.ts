import { prisma } from "../../lib/db";

/** Rang phare initial : identifiant du projet -> rang (spec §4). */
const FEATURED_RANKS: Record<number, number> = {
	26: 1,
	18: 2,
	9: 3,
	20: 4,
	24: 5,
	13: 6,
};

function parseRepo(url: string | null): { owner: string; repo: string } | null {
	const m = url?.match(
		/^https:\/\/github\.com\/([^/]+)\/([^/#?]+?)(?:\.git)?\/?$/,
	);
	return m ? { owner: m[1], repo: m[2] } : null;
}

async function fetchRepoId(owner: string, repo: string): Promise<number> {
	const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
		method: "GET",
		headers: {
			Accept: "application/vnd.github+json",
			Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
			"X-GitHub-Api-Version": "2022-11-28",
		},
	});
	if (!res.ok) throw new Error(`GitHub ${res.status} pour ${owner}/${repo}`);
	const body = (await res.json()) as { id?: unknown };
	if (typeof body.id !== "number") {
		throw new Error(`Identifiant absent pour ${owner}/${repo}`);
	}
	return body.id;
}

async function main() {
	if (!process.env.DATABASE_URL || !process.env.GITHUB_TOKEN) {
		throw new Error(
			"DATABASE_URL ou GITHUB_TOKEN manquante : lancer via `pnpm catalogue:init-admin`.",
		);
	}
	const apply = process.argv.includes("--apply");

	const projects = await prisma.project.findMany({
		select: { id: true, title: true, github: true },
		orderBy: { id: "asc" },
	});
	const missing = Object.keys(FEATURED_RANKS)
		.map(Number)
		.filter((id) => !projects.some((p) => p.id === id));
	if (missing.length > 0) {
		throw new Error(`Projets absents de la base : ${missing.join(", ")}.`);
	}

	const plan: { id: number; repoId: number | null; rank: number | null }[] = [];
	for (const p of projects) {
		const ref = parseRepo(p.github);
		const repoId = ref ? await fetchRepoId(ref.owner, ref.repo) : null;
		const rank = FEATURED_RANKS[p.id] ?? null;
		plan.push({ id: p.id, repoId, rank });
		console.log(
			`#${p.id} ${p.title} : githubRepoId=${repoId ?? "-"} featuredRank=${rank ?? "-"}`,
		);
	}

	if (!apply) {
		console.log(
			"\nEssai à blanc : rien n'a été écrit (--apply pour appliquer).",
		);
		return;
	}

	await prisma.$transaction(
		plan.map((x) =>
			prisma.project.update({
				where: { id: x.id },
				data: { githubRepoId: x.repoId, featuredRank: x.rank },
			}),
		),
	);
	console.log(`\n${plan.length} projets initialisés.`);
}

main()
	.catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	})
	.finally(() => prisma.$disconnect());
