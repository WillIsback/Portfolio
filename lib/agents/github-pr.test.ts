import { describe, expect, it, vi } from "vitest";
import { createArticlePr, type GithubWriteDeps } from "./github-pr";

interface Call {
	url: string;
	method: string;
	body: unknown;
	headers: Record<string, string>;
}

function makeDeps(
	opts: {
		token?: string | undefined;
		branchExists?: boolean;
		articleStatus?: number;
	} = {},
): GithubWriteDeps & { calls: Call[]; fetchImpl: ReturnType<typeof vi.fn> } {
	const token = "token" in opts ? opts.token : "t";
	const { branchExists = false, articleStatus = 404 } = opts;
	const calls: Call[] = [];
	const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
		const method = init?.method ?? "GET";
		const headers = (init?.headers ?? {}) as Record<string, string>;
		const body = init?.body ? JSON.parse(init.body as string) : undefined;
		calls.push({ url, method, body, headers });
		if (url.endsWith("/git/ref/heads/agent/article-a"))
			return branchExists
				? new Response(JSON.stringify({ object: { sha: "br" } }), {
						status: 200,
					})
				: new Response("{}", { status: 404 });
		if (url.endsWith("/git/ref/heads/main"))
			return new Response(JSON.stringify({ object: { sha: "base" } }), {
				status: 200,
			});
		if (url.endsWith("/git/refs") && method === "POST")
			return new Response(JSON.stringify({ ref: "refs/heads/x" }), {
				status: 201,
			});
		if (url.includes("/contents/content/articles/a.mdx") && method === "GET")
			return articleStatus === 200
				? new Response(JSON.stringify({ sha: "oldsha" }), { status: 200 })
				: new Response("", { status: articleStatus });
		if (url.includes("/contents/content/articles/a.mdx") && method === "PUT")
			return new Response(JSON.stringify({ commit: { sha: "c" } }), {
				status: 201,
			});
		if (url.endsWith("/pulls") && method === "POST")
			return new Response(
				JSON.stringify({ html_url: "https://github.com/x/pr/1" }),
				{ status: 201 },
			);
		return new Response("{}", { status: 404 });
	});
	return {
		token,
		repo: "WillIsback/portfolio",
		baseBranch: "main",
		fetchImpl,
		calls,
	} as unknown as GithubWriteDeps & {
		calls: Call[];
		fetchImpl: ReturnType<typeof vi.fn>;
	};
}

describe("createArticlePr", () => {
	it("crée branche, commit et PR, et renvoie l'URL", async () => {
		const d = makeDeps();
		const res = await createArticlePr(
			{
				slug: "a",
				mdx: "---\n---\n",
				branch: "agent/article-a",
				title: "A",
				body: "b",
			},
			d,
		);
		expect(res).toEqual({ ok: true, url: "https://github.com/x/pr/1" });
		expect(d.calls.map((c) => `${c.method} ${c.url}`)).toEqual([
			"GET https://api.github.com/repos/WillIsback/portfolio/git/ref/heads/agent/article-a",
			"GET https://api.github.com/repos/WillIsback/portfolio/git/ref/heads/main",
			"POST https://api.github.com/repos/WillIsback/portfolio/git/refs",
			"GET https://api.github.com/repos/WillIsback/portfolio/contents/content/articles/a.mdx?ref=agent%2Farticle-a",
			"PUT https://api.github.com/repos/WillIsback/portfolio/contents/content/articles/a.mdx",
			"POST https://api.github.com/repos/WillIsback/portfolio/pulls",
		]);
		expect(d.calls[2].body).toEqual({
			ref: "refs/heads/agent/article-a",
			sha: "base",
		});
		const put = d.calls[4];
		expect(put.headers.Authorization).toBe("Bearer t");
		expect(put.body).toEqual({
			message: "content(article): A\n\nGénéré par l'agent articles.",
			content: Buffer.from("---\n---\n", "utf8").toString("base64"),
			branch: "agent/article-a",
		});
	});

	it("met à jour un article existant (200 → sha)", async () => {
		const d = makeDeps({ branchExists: true, articleStatus: 200 });
		const res = await createArticlePr(
			{ slug: "a", mdx: "x", branch: "agent/article-a", title: "A", body: "b" },
			d,
		);
		expect(res.ok).toBe(true);
		expect(d.calls.map((c) => `${c.method} ${c.url}`)).toEqual([
			"GET https://api.github.com/repos/WillIsback/portfolio/git/ref/heads/agent/article-a",
			"GET https://api.github.com/repos/WillIsback/portfolio/contents/content/articles/a.mdx?ref=agent%2Farticle-a",
			"PUT https://api.github.com/repos/WillIsback/portfolio/contents/content/articles/a.mdx",
			"POST https://api.github.com/repos/WillIsback/portfolio/pulls",
		]);
		expect(d.calls[2].body).toMatchObject({
			branch: "agent/article-a",
			sha: "oldsha",
		});
	});

	it("échoue si la lecture du contenu échoue", async () => {
		const d = makeDeps({ branchExists: true, articleStatus: 500 });
		const res = await createArticlePr(
			{ slug: "a", mdx: "x", branch: "agent/article-a", title: "A", body: "b" },
			d,
		);
		expect(res).toEqual({
			ok: false,
			error: "Lecture du contenu impossible (500).",
		});
	});

	it("échoue proprement sans jeton et n'appelle pas l'API", async () => {
		const d = makeDeps({ token: undefined });
		const res = await createArticlePr(
			{ slug: "a", mdx: "x", branch: "b", title: "A", body: "b" },
			d,
		);
		expect(res.ok).toBe(false);
		expect(res).toEqual({ ok: false, error: "Jeton GitHub manquant." });
		expect(d.fetchImpl).not.toHaveBeenCalled();
	});
});
