// Client GitHub en lecture seule : uniquement des requêtes GET.
// Aucun message d'erreur ne contient le jeton.

const API = "https://api.github.com";
const PUBLIC_USER = "WillIsback";
const PER_PAGE = 100;
const MAX_PAGES = 20;
export const MAX_IMAGES = 40;
export const README_HEAD_CHARS = 400;

export type GithubAuthInput = {
	token: string | undefined;
	mode: "oauth" | "public";
};

export class GithubError extends Error {
	constructor(
		message: string,
		readonly status: number,
		readonly gone = false,
	) {
		super(message);
		this.name = "GithubError";
	}
}

export interface GithubGetInit {
	method?: string;
	raw?: boolean;
}

/** Requête GET (seule méthode autorisée). Retourne la réponse brute si `ok`. */
export async function githubGet(
	path: string,
	token: string | undefined,
	init: GithubGetInit = {},
): Promise<Response> {
	if (init.method && init.method.toUpperCase() !== "GET") {
		throw new Error("Le client GitHub est en lecture seule (GET uniquement).");
	}
	if (!path.startsWith("/")) throw new Error("Chemin GitHub invalide.");
	const headers: Record<string, string> = {
		Accept: init.raw
			? "application/vnd.github.raw+json"
			: "application/vnd.github+json",
		"X-GitHub-Api-Version": "2022-11-28",
	};
	if (token) headers.Authorization = `Bearer ${token}`;
	let res: Response;
	try {
		res = await fetch(`${API}${path}`, {
			method: "GET",
			headers,
			cache: "no-store",
		});
	} catch {
		throw new GithubError("GitHub injoignable.", 0);
	}
	if (res.ok) return res;
	if (res.status === 404) throw new GithubError("Dépôt disparu.", 404, true);
	if (res.status === 401)
		throw new GithubError("Jeton GitHub refusé : reconnecte-toi.", 401);
	if (res.status === 403 || res.status === 429)
		throw new GithubError("Quota ou accès GitHub refusé.", res.status);
	throw new GithubError(`Erreur GitHub ${res.status}.`, res.status);
}

async function getJson<T>(path: string, token: string | undefined): Promise<T> {
	return (await githubGet(path, token)).json() as Promise<T>;
}

export interface ListedRepo {
	id: number;
	name: string;
	full_name: string;
	description: string | null;
	html_url: string;
	pushed_at: string | null;
	language: string | null;
	private: boolean;
	archived: boolean;
}

async function paginate(
	base: string,
	token: string | undefined,
): Promise<ListedRepo[]> {
	const out: ListedRepo[] = [];
	for (let page = 1; page <= MAX_PAGES; page++) {
		const batch = await getJson<ListedRepo[]>(
			`${base}${base.includes("?") ? "&" : "?"}per_page=${PER_PAGE}&page=${page}`,
			token,
		);
		out.push(...batch);
		if (batch.length < PER_PAGE) break;
	}
	return out;
}

/** oauth : tous les dépôts du propriétaire (privés inclus) ; public : dépôts publics. */
export function listRepos(auth: GithubAuthInput): Promise<ListedRepo[]> {
	return auth.mode === "oauth"
		? paginate("/user/repos?affiliation=owner&sort=updated", auth.token)
		: paginate(
				`/users/${PUBLIC_USER}/repos?type=public&sort=updated`,
				auth.token,
			);
}

export interface RepoMeta {
	id: number;
	full_name: string;
	description: string | null;
	topics?: string[];
	homepage: string | null;
	private: boolean;
	archived: boolean;
	pushed_at: string | null;
	default_branch: string;
	language: string | null;
}

export interface RepoManifests {
	packageJson: string | null;
	pyproject: string | null;
	requirements: string | null;
	cargo: string | null;
	compose: string[];
}

export interface RepoBundle {
	meta: RepoMeta;
	/** Chemins pertinents pour la détection (Dockerfile, workflows, images), sans dossiers vendus. */
	filePaths: string[];
	manifests: RepoManifests;
	readmeHead: string;
	/** Images de l'arbre, 40 au plus. */
	images: string[];
}

const VENDORED = new Set([
	"node_modules",
	"vendor",
	"third_party",
	"bower_components",
	".venv",
	"venv",
	"site-packages",
	"dist",
	"build",
	".next",
	"target",
]);
const IMAGE_RE = /\.(png|jpe?g|webp|gif)$/i;

export const isVendored = (path: string) =>
	path.split("/").some((seg) => VENDORED.has(seg));

const isDockerfile = (p: string) =>
	p === "Dockerfile" || p.endsWith("/Dockerfile");

interface TreeResponse {
	tree?: { path: string; type: string }[];
	truncated?: boolean;
}

async function getRaw(
	fullName: string,
	file: string,
	token: string | undefined,
): Promise<string | null> {
	try {
		const res = await githubGet(
			`/repos/${fullName}/contents/${encodeURI(file)}`,
			token,
			{ raw: true },
		);
		return await res.text();
	} catch (e) {
		if (e instanceof GithubError && e.gone) return null;
		throw e;
	}
}

export async function getRepoBundle(
	fullName: string,
	token: string | undefined,
): Promise<RepoBundle> {
	const meta = await getJson<RepoMeta>(`/repos/${fullName}`, token);
	let tree: TreeResponse = {};
	try {
		tree = await getJson<TreeResponse>(
			`/repos/${fullName}/git/trees/${encodeURIComponent(meta.default_branch)}?recursive=1`,
			token,
		);
	} catch (e) {
		// Dépôt vide : pas d'arbre. Toute autre erreur remonte.
		if (!(e instanceof GithubError) || !(e.gone || e.status === 409)) throw e;
	}
	const paths = (tree.tree ?? [])
		.filter((n) => n.type === "blob")
		.map((n) => n.path)
		.filter((p) => !isVendored(p));
	const images = paths.filter((p) => IMAGE_RE.test(p)).slice(0, MAX_IMAGES);
	const filePaths = [
		...paths.filter(
			(p) => isDockerfile(p) || p.startsWith(".github/workflows/"),
		),
		...images,
	];

	const root = new Set(paths.filter((p) => !p.includes("/")));
	const fetchIf = (file: string) =>
		root.has(file) || tree.truncated
			? getRaw(fullName, file, token)
			: Promise.resolve(null);
	const [packageJson, pyproject, requirements, cargo, c1, c2] =
		await Promise.all([
			fetchIf("package.json"),
			fetchIf("pyproject.toml"),
			fetchIf("requirements.txt"),
			fetchIf("Cargo.toml"),
			fetchIf("docker-compose.yml"),
			fetchIf("compose.yaml"),
		]);

	let readme: string | null = null;
	try {
		const res = await githubGet(`/repos/${fullName}/readme`, token, {
			raw: true,
		});
		readme = await res.text();
	} catch (e) {
		if (!(e instanceof GithubError) || !e.gone) throw e;
	}

	return {
		meta,
		filePaths,
		manifests: {
			packageJson,
			pyproject,
			requirements,
			cargo,
			compose: [c1, c2].filter((x): x is string => x !== null),
		},
		readmeHead: (readme ?? "").slice(0, README_HEAD_CHARS),
		images,
	};
}
