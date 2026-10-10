import { FAMILIES, type PracticeFamily } from "@/lib/practices";
import type { ProjectFilters } from "@/schemas";

/** Filtres du registre lus dans l'URL ; une famille ou une formation inconnue est ignorée. */
export function parseFilters(params: URLSearchParams): ProjectFilters {
	const list = (key: string) =>
		(params.get(key) ?? "").split(",").filter(Boolean);
	return {
		search: params.get("search") || undefined,
		language: list("language") as ProjectFilters["language"],
		database: list("database") as ProjectFilters["database"],
		backend: list("backend") as ProjectFilters["backend"],
		frontend: list("frontend") as ProjectFilters["frontend"],
		devops: list("devops") as ProjectFilters["devops"],
		domain: list("domain") as ProjectFilters["domain"],
		practice: list("practice").filter((v): v is PracticeFamily =>
			(FAMILIES as readonly string[]).includes(v),
		),
		training: (["only", "exclude"] as const).find(
			(v) => v === params.get("training"),
		),
	};
}

/** Au moins un filtre réel (après filtrage des valeurs inconnues). */
export function hasActiveFilters(filters: ProjectFilters): boolean {
	return (
		Boolean(filters.search) ||
		Boolean(filters.training) ||
		[
			filters.language,
			filters.database,
			filters.backend,
			filters.frontend,
			filters.devops,
			filters.domain,
			filters.practice,
		].some((l) => (l?.length ?? 0) > 0)
	);
}
