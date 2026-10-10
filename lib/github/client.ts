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
			signal: AbortSignal.timeout(10_000),
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
	/** Manifestes d'un sous-dossier de premier niveau (monorepo : backend/, frontend/…). */
	nested: { path: string; content: string }[];
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
const IMAGE_RE = /\.(png|jpe?g|webp)$/i;

export const isVendored = (path: string) =>
	path.split("/").some((seg) => VENDORED.has(seg));

/** `Dockerfile` ou `Dockerfile.<suffixe>` (pas `Dockerfile.md`). */
const isDockerfile = (p: string) =>
	/(^|\/)Dockerfile(\.(?!md$)[\w-]+)?$/.test(p);

/** Chemins utiles à la détection des pratiques (aucune requête de plus : l'arbre est déjà chargé). */
const MARKER_RE =
	/^(\.(github|forgejo)\/workflows\/|\.gitlab-ci\.yml$|\.github\/dependabot\.ya?ml$|(\.github\/)?renovate\.json5?$|\.semgrep\.ya?ml$|\.gitleaks\.toml$|\.secrets\.baseline$|dvc\.yaml$|vercel\.json$)|(^|\/)(docker-)?compose(\.[\w-]+)?\.ya?ml$|\.dvc$/;
/** Dossiers dont seule la présence compte : un chemin suffit, quel que soit leur volume. */
const PRESENCE_RES = [/(^|\/)(tests?|__tests__)\//, /^\.dvc\//, /\.ipynb$/];
const MAX_MARKERS = 200;

/** Dockerfile et marqueurs (plafonnés), plus un seul chemin par dossier « de présence ». */
function markerPaths(paths: string[]): string[] {
	const markers = paths
		.filter((p) => isDockerfile(p) || MARKER_RE.test(p))
		.slice(0, MAX_MARKERS);
	const presence = PRESENCE_RES.flatMap((re) => {
		const hit = paths.find((p) => re.test(p));
		return hit ? [hit] : [];
	});
	return [...markers, ...presence];
}

const NESTED_MANIFEST_RE =
	/^[^/]+\/(package\.json|pyproject\.toml|requirements\.txt|Cargo\.toml|(docker-)?compose(\.[\w-]+)?\.ya?ml)$/;
const MAX_NESTED = 8;

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

const FULL_NAME_RE = /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/;

/** Valide `owner/repo` et encode chaque segment : aucune injection de chemin. */
export function safeFullName(fullName: string): string {
	const parts = fullName.split("/");
	if (
		!FULL_NAME_RE.test(fullName) ||
		parts.some((p) => p === "." || p === "..")
	) {
		throw new Error("Nom de dépôt invalide.");
	}
	return parts.map(encodeURIComponent).join("/");
}

export async function getRepoBundle(
	rawFullName: string,
	token: string | undefined,
): Promise<RepoBundle> {
	const fullName = safeFullName(rawFullName);
	const meta = await getJson<RepoMeta>(`/repos/${fullName}`, token);
	let tree: TreeResponse = {};
	try {
		tree = await getJson<TreeResponse>(
			`/repos/${fullName}/git/trees/${meta.default_branch.split("/").map(encodeURIComponent).join("/")}?recursive=1`,
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
	const filePaths = [...markerPaths(paths), ...images];

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

	const nestedPaths = paths
		.filter((p) => NESTED_MANIFEST_RE.test(p))
		.slice(0, MAX_NESTED);
	const nested = (
		await Promise.all(
			nestedPaths.map(async (path) => ({
				path,
				content: await getRaw(fullName, path, token),
			})),
		)
	).filter((n): n is { path: string; content: string } => n.content !== null);

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
			nested,
		},
		readmeHead: (readme ?? "").slice(0, README_HEAD_CHARS),
		images,
	};
}
