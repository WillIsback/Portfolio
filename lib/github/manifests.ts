/** Lecture de manifestes : fonctions pures, sans dépendance (TOML par expressions régulières). */

function dedupe(values: string[]): string[] {
	return [...new Set(values)];
}

/** Noms des dependencies et devDependencies ; JSON invalide ou inattendu → []. */
export function parsePackageJson(text: string): string[] {
	let json: unknown;
	try {
		json = JSON.parse(text);
	} catch {
		return [];
	}
	if (typeof json !== "object" || json === null) return [];
	const record = json as Record<string, unknown>;
	const names: string[] = [];
	for (const key of ["dependencies", "devDependencies"]) {
		const section = record[key];
		if (typeof section === "object" && section !== null) {
			names.push(...Object.keys(section));
		}
	}
	return dedupe(names);
}

/** Nom d'un paquet Python depuis une spécification PEP 508 (extras, version, marqueurs ignorés). */
function pythonName(spec: string): string | null {
	const match = /^\s*([A-Za-z0-9][A-Za-z0-9._-]*)/.exec(spec);
	return match ? match[1].toLowerCase() : null;
}

/** Noms d'un requirements.txt, en minuscules ; commentaires, options, URL et versions ignorés. */
export function parseRequirements(text: string): string[] {
	const names: string[] = [];
	for (const raw of text.split(/\r?\n/)) {
		const line = raw.replace(/(^|\s)#.*$/, "").trim();
		if (!line || line.startsWith("-") || /^[a-z+]+:\/\//i.test(line)) continue;
		if (/^git\+|^https?:/i.test(line)) continue;
		const name = pythonName(line);
		if (name) names.push(name);
	}
	return dedupe(names);
}

// Un tableau TOML de chaînes (les tables inline `{include-group = …}` sont retirées avant).
const ARRAY =
	/([A-Za-z0-9_.-]+)\s*=\s*\[((?:\s*(?:"[^"]*"|'[^']*'|\{[^}]*\})\s*,?|\s*#[^\n]*)*\s*)\]/g;

function arrayEntries(sectionBody: string, onlyKey?: string): string[] {
	const out: string[] = [];
	for (const match of sectionBody.matchAll(ARRAY)) {
		if (onlyKey && match[1] !== onlyKey) continue;
		const body = match[2].replace(/\{[^}]*\}/g, "");
		for (const str of body.matchAll(/"([^"]*)"|'([^']*)'/g)) {
			const name = pythonName(str[1] ?? str[2] ?? "");
			if (name) out.push(name);
		}
	}
	return out;
}

/** Dépendances d'un pyproject.toml : [project] dependencies, optional-dependencies, dependency-groups. */
export function parsePyproject(text: string): string[] {
	const parts = text.split(/^\[([^\]\n]+)\]\s*$/m);
	// parts = [préambule, titre1, corps1, titre2, corps2, …]
	const names: string[] = [];
	for (let i = 1; i < parts.length; i += 2) {
		const title = parts[i].trim();
		const body = parts[i + 1] ?? "";
		if (title === "project") names.push(...arrayEntries(body, "dependencies"));
		else if (
			title === "project.optional-dependencies" ||
			title === "dependency-groups"
		)
			names.push(...arrayEntries(body));
	}
	return dedupe(names);
}

/** Derniers segments des `image:` d'un compose, sans registre, sans tag ni digest. */
export function parseComposeImages(text: string): string[] {
	const names: string[] = [];
	for (const match of text.matchAll(/^\s*-?\s*image:\s*["']?([^\s"'#]+)/gm)) {
		// ${VAR:-défaut} → défaut ; toute autre variable non résolue est ignorée.
		const ref = match[1].replace(/\$\{[^}:-]*:?-([^}]*)\}/g, "$1");
		if (ref.includes("$")) continue;
		const last = ref.split("@")[0].split("/").pop() ?? "";
		const name = last.split(":")[0].toLowerCase();
		if (name) names.push(name);
	}
	return dedupe(names);
}
