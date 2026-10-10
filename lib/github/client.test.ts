import { readdirSync, readFileSync } from "node:fs";
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
						blob("docs/anim.gif"),
						blob("node_modules/pkg/Dockerfile"),
						blob("node_modules/pkg/logo.png"),
						blob(".github/workflows/ci.yml"),
						blob("renovate.json"),
						blob(".github/dependabot.yml"),
						blob("dvc.yaml"),
						blob("tests/test_x.py"),
						blob("deploy/compose.yaml"),
						blob("vercel.json"),
						blob("src/app.py"),
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
		expect(b.images.some((p) => p.endsWith(".gif"))).toBe(false);
		expect(b.filePaths).toContain("Dockerfile");
		expect(b.filePaths).toContain(".github/workflows/ci.yml");
		expect(b.filePaths).not.toContain("node_modules/pkg/Dockerfile");
		expect(b.filePaths).toEqual(
			expect.arrayContaining([
				"renovate.json",
				".github/dependabot.yml",
				"dvc.yaml",
				"tests/test_x.py",
				"deploy/compose.yaml",
				"vercel.json",
			]),
		);
		expect(b.filePaths).not.toContain("src/app.py");
		// Manifestes absents de l'arbre : aucune requête inutile.
		expect(calls.some((c) => c.url.includes("package.json"))).toBe(false);
		expect(calls.every((c) => c.init?.method === "GET")).toBe(true);
	});

	it("beaucoup de fichiers de test n'évincent ni Dockerfile ni workflows ni marqueurs", async () => {
		const tests = Array.from({ length: 250 }, (_, i) =>
			blob(`a/tests/x${i}.py`),
		);
		mockFetch({
			"/repos/WillIsback/demo/git/trees/main": () =>
				json({
					tree: [
						...tests,
						blob("z/Dockerfile"),
						blob("z/.github/x.yml"),
						blob(".github/workflows/ci.yml"),
						blob("vercel.json"),
					],
				}),
			"/repos/WillIsback/demo/readme": () => json({}, 404),
			"/repos/WillIsback/demo": () => json(meta),
		});
		const b = await getRepoBundle("WillIsback/demo", "tok");
		expect(b.filePaths).toContain("z/Dockerfile");
		expect(b.filePaths).toContain(".github/workflows/ci.yml");
		expect(b.filePaths).toContain("vercel.json");
		expect(b.filePaths.filter((p) => p.includes("/tests/"))).toHaveLength(1);
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

describe("sécurité du client", () => {
	it("refuse les noms de dépôt qui altèrent le chemin", async () => {
		const calls = mockFetch({});
		for (const bad of [
			"../../user",
			"a/b?x=",
			"a/b#",
			"a/..",
			"a/.",
			"a/b/c",
			"a",
			"",
			"a b/c",
		]) {
			await expect(getRepoBundle(bad, "t")).rejects.toThrow(/invalide/);
		}
		expect(calls).toHaveLength(0);
	});

	it("branche avec « / » : segments encodés séparément", async () => {
		const calls = mockFetch({
			"/repos/WillIsback/demo/git/trees/feature/x": () => json({ tree: [] }),
			"/repos/WillIsback/demo/readme": () => json({}, 404),
			"/repos/WillIsback/demo": () =>
				json({ ...{ id: 1, default_branch: "feature/x" } }),
		});
		await getRepoBundle("WillIsback/demo", "t");
		expect(calls.map((c) => c.url)).toContain(
			"/repos/WillIsback/demo/git/trees/feature/x?recursive=1",
		);
	});

	it("passe un signal d'expiration et traduit l'abandon", async () => {
		const calls = mockFetch({ "/x": () => json({}) });
		await githubGet("/x", "t");
		expect(calls[0].init?.signal).toBeDefined();
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				throw new DOMException("t", "TimeoutError");
			}),
		);
		await expect(githubGet("/x", "t")).rejects.toThrow(/injoignable/);
	});
});

describe("garde serveur", () => {
	it("aucun composant client n'importe lib/github/token", () => {
		const root = path.resolve(__dirname, "../..");
		const walk = (d: string): string[] =>
			readdirSync(d, { withFileTypes: true }).flatMap((e) =>
				e.isDirectory()
					? walk(path.join(d, e.name))
					: /\.(tsx?|jsx?)$/.test(e.name)
						? [path.join(d, e.name)]
						: [],
			);
		const offenders = ["app", "components"]
			.flatMap((d) => walk(path.join(root, d)))
			.map((f) => [f, readFileSync(f, "utf8")] as const)
			.filter(
				([, src]) =>
					/^\s*["']use client["']/m.test(src) && /lib\/github\/token/.test(src),
			)
			.map(([f]) => f);
		expect(offenders).toEqual([]);
	});
});
