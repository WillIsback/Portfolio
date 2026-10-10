const API = "https://api.github.com";

export interface GithubWriteDeps {
	token: string | undefined;
	repo: string; // "owner/name"
	baseBranch: string;
	fetchImpl?: typeof fetch;
}

export interface ArticlePrInput {
	slug: string;
	mdx: string;
	branch: string;
	title: string;
	body: string;
}

export type ArticlePrResult =
	| { ok: true; url: string }
	| { ok: false; error: string };

async function gh(
	deps: GithubWriteDeps,
	path: string,
	init: RequestInit,
): Promise<Response> {
	const fetchImpl = deps.fetchImpl ?? fetch;
	return fetchImpl(`${API}${path}`, {
		...init,
		headers: {
			Accept: "application/vnd.github+json",
			"X-GitHub-Api-Version": "2022-11-28",
			Authorization: `Bearer ${deps.token}`,
			"Content-Type": "application/json",
			...init.headers,
		},
		cache: "no-store",
		signal: AbortSignal.timeout(15_000),
	});
}

/** Crée une branche depuis la base, y commit le MDX, puis ouvre une PR. */
export async function createArticlePr(
	input: ArticlePrInput,
	deps: GithubWriteDeps,
): Promise<ArticlePrResult> {
	if (!deps.token) return { ok: false, error: "Jeton GitHub manquant." };
	try {
		const base = await gh(
			deps,
			`/repos/${deps.repo}/git/ref/heads/${deps.baseBranch}`,
			{ method: "GET" },
		);
		if (!base.ok)
			return {
				ok: false,
				error: `Branche de base introuvable (${base.status}).`,
			};
		const baseSha = ((await base.json()) as { object: { sha: string } }).object
			.sha;

		const branch = await gh(deps, `/repos/${deps.repo}/git/refs`, {
			method: "POST",
			body: JSON.stringify({ ref: `refs/heads/${input.branch}`, sha: baseSha }),
		});
		if (!branch.ok && branch.status !== 422)
			return {
				ok: false,
				error: `Création de branche impossible (${branch.status}).`,
			};

		const path = `/repos/${deps.repo}/contents/content/articles/${input.slug}.mdx`;
		const existing = await gh(deps, path, { method: "GET" });
		const sha = existing.ok
			? ((await existing.json()) as { sha: string }).sha
			: undefined;

		const commit = await gh(deps, path, {
			method: "PUT",
			body: JSON.stringify({
				message: `content(article): ${input.title}\n\nGénéré par l'agent articles.`,
				content: Buffer.from(input.mdx, "utf8").toString("base64"),
				branch: input.branch,
				...(sha ? { sha } : {}),
			}),
		});
		if (!commit.ok)
			return { ok: false, error: `Commit impossible (${commit.status}).` };

		const pr = await gh(deps, `/repos/${deps.repo}/pulls`, {
			method: "POST",
			body: JSON.stringify({
				title: input.title,
				head: input.branch,
				base: deps.baseBranch,
				body: input.body,
			}),
		});
		if (!pr.ok)
			return { ok: false, error: `Ouverture de PR impossible (${pr.status}).` };
		return {
			ok: true,
			url: ((await pr.json()) as { html_url: string }).html_url,
		};
	} catch {
		return { ok: false, error: "GitHub injoignable." };
	}
}
