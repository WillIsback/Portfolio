import { PRACTICES_OF } from "@/lib/practices";
import type { ProjectFilters } from "@/schemas";

/** Clause `where` Prisma des filtres du registre (logique pure). */
export function buildProjectWhere(
	filters: ProjectFilters,
): Record<string, unknown> {
	const where: Record<string, unknown> = {};

	if (filters.search) {
		where.OR = [
			{ title: { contains: filters.search } },
			{ description: { contains: filters.search } },
		];
	}

	if (filters.language?.length) {
		where.languages = {
			some: {
				language: { in: filters.language },
			},
		};
	}

	if (filters.database?.length) {
		where.databases = {
			some: {
				database: { in: filters.database },
			},
		};
	}

	if (filters.backend?.length) {
		where.backends = {
			some: {
				backend: { in: filters.backend },
			},
		};
	}

	if (filters.frontend?.length) {
		where.frontends = {
			some: {
				frontend: { in: filters.frontend },
			},
		};
	}

	if (filters.devops?.length) {
		where.devops = {
			some: {
				devops: { in: filters.devops },
			},
		};
	}

	if (filters.domain?.length) {
		where.domains = {
			some: {
				domain: { in: filters.domain },
			},
		};
	}

	if (filters.practice?.length) {
		where.practices = {
			some: {
				practice: { in: filters.practice.flatMap((f) => PRACTICES_OF[f]) },
			},
		};
	}
	if (filters.training === "only") where.training = { not: null };
	else if (filters.training === "exclude") where.training = null;
	return where;
}
