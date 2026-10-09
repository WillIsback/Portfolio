import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GithubError, getRepoBundle, githubGet, listRepos } from "./client";

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), { status });
const text = (body: string, status = 200) => new Response(body, { status });

function mockFetch(routes: Record<string, () => Response>) {
	const calls: { url: string; init?: RequestInit }[] = [];
	const fn = vi.fn(async (url: string | URL, init?: RequestInit) => {
		const u = String(url).replace("https://api.github.com", "");
		calls.push({ url: u, init });
		const key = Object.keys(routes)
			.filter((k) => u === k || u.startsWith(k))
			.sort((a, b) => b.length - a.length)[0];
		return key ? routes[key]() : json({ message: "Not Found" }, 404);
	});
	vi.stubGlobal("fetch", fn);
	return calls;
}

afterEach(() => vi.unstubAllGlobals());

describe("githubGet", () => {
	it("n'émet que des GET et refuse les autres méthodes", async () => {
		const calls = mockFetch({ "/user": () => json({}) });
		await githubGet("/user", "tok");
		expect(calls[0].init?.method).toBe("GET");
		for (const m of ["POST", "PUT", "PATCH", "DELETE"]) {
			await expect(githubGet("/user", "tok", { method: m })).rejects.toThrow(
				/lecture seule/,
			);
		}
		expect(calls).toHaveLength(1);
	});

	it("404 -> « disparu », sans jeton dans le message", async () => {
		mockFetch({});
		const err = await githubGet("/repos/a/b", "gho_secret").catch((e) => e);
		expect(err).toBeInstanceOf(GithubError);
		expect(err.message).toMatch(/disparu/);
		expect(err.gone).toBe(true);
		expect(err.message).not.toContain("gho_secret");
	});

	it("n'envoie pas d'en-tête Authorization sans jeton", async () => {
		const calls = mockFetch({ "/x": () => json({}) });
		await githubGet("/x", undefined);
		expect(
			(calls[0].init?.headers as Record<string, string>).Authorization,
		).toBeUndefined();
	});
});

describe("listRepos", () => {
	const repo = (id: number) => ({ id, name: `r${id}` });
	it("oauth : pagine /user/repos jusqu'à une page incomplète", async () => {
		const calls = mockFetch({
			"/user/repos?affiliation=owner&sort=updated&per_page=100&page=1": () =>
				json(Array.from({ length: 100 }, (_, i) => repo(i))),
			"/user/repos?affiliation=owner&sort=updated&per_page=100&page=2": () =>
				json([repo(100), repo(101)]),
		});
		const repos = await listRepos({ token: "t", mode: "oauth" });
		expect(repos).toHaveLength(102);
		expect(calls).toHaveLength(2);
	});

	it("public : liste les dépôts publics de WillIsback", async () => {
		const calls = mockFetch({
			"/users/WillIsback/repos": () => json([repo(1)]),
		});
		const repos = await listRepos({ token: undefined, mode: "public" });
		expect(repos).toHaveLength(1);
		expect(calls[0].url).toContain("/users/WillIsback/repos?type=public");
	});
});

describe("getRepoBundle", () => {
	const meta = {
		id: 7,
		full_name: "WillIsback/demo",
		description: "d",
		topics: ["agent"],
		homepage: null,
		private: false,
		archived: false,
		pushed_at: "2026-01-01T00:00:00Z",
		default_branch: "main",
		language: "Python",
	};
	const blob = (p: string) => ({ path: p, type: "blob" });

	it("lit métadonnées, manifestes présents, README tronqué, images filtrées", async () => {
		const many = Array.from({ length: 60 }, (_, i) => blob(`docs/img${i}.png`));
		const calls = mockFetch({
			"/repos/WillIsback/demo/git/trees/main": () =>
				json({
					tree: [
						blob("requirements.txt"),
						blob("Dockerfile"),
						blob("node_modules/pkg/Dockerfile"),
						blob("node_modules/pkg/logo.png"),
						blob(".github/workflows/ci.yml"),
						{ path: "docs", type: "tree" },
						...many,
					],
				}),
			"/repos/WillIsback/demo/contents/requirements.txt": () => text("torch\n"),
			"/repos/WillIsback/demo/readme": () => text("x".repeat(1000)),
			"/repos/WillIsback/demo": () => json(meta),
		});
		const b = await getRepoBundle("WillIsback/demo", "tok");
		expect(b.manifests.requirements).toBe("torch\n");
		expect(b.manifests.packageJson).toBeNull();
		expect(b.manifests.cargo).toBeNull();
		expect(b.manifests.compose).toEqual([]);
		expect(b.readmeHead).toHaveLength(400);
		expect(b.images).toHaveLength(40);
		expect(b.images.some((p) => p.includes("node_modules"))).toBe(false);
		expect(b.filePaths).toContain("Dockerfile");
		expect(b.filePaths).toContain(".github/workflows/ci.yml");
		expect(b.filePaths).not.toContain("node_modules/pkg/Dockerfile");
		// Manifestes absents de l'arbre : aucune requête inutile.
		expect(calls.some((c) => c.url.includes("package.json"))).toBe(false);
		expect(calls.every((c) => c.init?.method === "GET")).toBe(true);
	});

	it("manifeste annoncé mais 404 -> null ; README absent -> vide", async () => {
		mockFetch({
			"/repos/WillIsback/demo/git/trees/main": () =>
				json({ tree: [blob("package.json")] }),
			"/repos/WillIsback/demo/contents/": () => json({}, 404),
			"/repos/WillIsback/demo/readme": () => json({}, 404),
			"/repos/WillIsback/demo": () => json(meta),
		});
		const b = await getRepoBundle("WillIsback/demo", undefined);
		expect(b.manifests.packageJson).toBeNull();
		expect(b.readmeHead).toBe("");
	});

	it("dépôt introuvable -> erreur « disparu »", async () => {
		mockFetch({});
		await expect(getRepoBundle("WillIsback/gone", "t")).rejects.toThrow(
			/disparu/,
		);
	});

	it("dépôt vide (409) -> bundle sans fichiers", async () => {
		mockFetch({
			"/repos/WillIsback/demo/git/trees/main": () =>
				json({ message: "empty" }, 409),
			"/repos/WillIsback/demo": () => json(meta),
		});
		const b = await getRepoBundle("WillIsback/demo", "t");
		expect(b.images).toEqual([]);
	});
});

describe("garde serveur", () => {
	it("token.ts n'est importé par aucun composant client", () => {
		const root = path.resolve(__dirname, "../..");
		const src = readFileSync(path.join(root, "lib/github/token.ts"), "utf8");
		expect(src).toMatch(/SERVEUR UNIQUEMENT/);
		expect(src).not.toMatch(/^["']use client["']/m);
	});
});
