import { describe, expect, it, vi } from "vitest";
import { createArticlePr, type GithubWriteDeps } from "./github-pr";

function deps(over: Partial<GithubWriteDeps> = {}): GithubWriteDeps {
	return {
		token: "t",
		repo: "WillIsback/portfolio",
		baseBranch: "main",
		fetchImpl: vi.fn(async (url: string, init?: RequestInit) => {
			const method = init?.method ?? "GET";
			if (url.endsWith("/git/ref/heads/main"))
				return new Response(JSON.stringify({ object: { sha: "base" } }), {
					status: 200,
				});
			if (url.endsWith("/git/refs") && method === "POST")
				return new Response(JSON.stringify({ ref: "refs/heads/x" }), {
					status: 201,
				});
			if (url.endsWith("/contents/content/articles/a.mdx") && method === "GET")
				return new Response("", { status: 404 });
			if (url.endsWith("/contents/content/articles/a.mdx") && method === "PUT")
				return new Response(JSON.stringify({ commit: { sha: "c" } }), {
					status: 201,
				});
			if (url.endsWith("/pulls") && method === "POST")
				return new Response(
					JSON.stringify({ html_url: "https://github.com/x/pr/1" }),
					{ status: 201 },
				);
			return new Response("{}", { status: 404 });
		}),
		...over,
	} as unknown as GithubWriteDeps;
}

describe("createArticlePr", () => {
	it("crée branche, commit et PR, et renvoie l'URL", async () => {
		const d = deps();
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
	});

	it("échoue proprement sans jeton", async () => {
		const res = await createArticlePr(
			{ slug: "a", mdx: "x", branch: "b", title: "A", body: "b" },
			deps({ token: undefined }),
		);
		expect(res.ok).toBe(false);
	});
});
