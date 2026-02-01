"use server";

import { unstable_cache } from "next/cache";
import prisma from "@/lib/db";
import { type ProjectFilters, ProjectFiltersSchema } from "@/schemas";
import type { Prisma } from "../../prisma/generated/prisma/client";

// Simple rate limiter en mémoire (désactivé en développement)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requêtes par minute
const IS_DEV = process.env.NODE_ENV === "development";

// Cache duration: 5 minutes en prod, false en dev pour toujours avoir les données fraîches
// const CACHE_REVALIDATE = IS_DEV ? false : 300;

function checkRateLimit(identifier: string): boolean {
	// Désactiver le rate limiting en développement
	if (IS_DEV) return true;

	const now = Date.now();
	const record = rateLimitMap.get(identifier);

	if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
		rateLimitMap.set(identifier, { count: 1, timestamp: now });
		return true;
	}

	if (record.count >= RATE_LIMIT_MAX) {
		return false;
	}

	record.count++;
	return true;
}

// Type pour le projet retourné avec ses relations
export type ProjectWithRelations = Awaited<
	ReturnType<typeof getProjectsFromDb>
>[number];

// Fonction de base pour récupérer les projets (non cachée)
async function getProjectsFromDb(filters?: ProjectFilters) {
	const where: Prisma.ProjectWhereInput = {};

	if (filters?.search) {
		where.OR = [
			{ title: { contains: filters.search } },
			{ description: { contains: filters.search } },
		];
	}

	if (filters?.language?.length) {
		where.languages = {
			some: {
				language: { in: filters.language },
			},
		};
	}

	if (filters?.database?.length) {
		where.databases = {
			some: {
				database: { in: filters.database },
			},
		};
	}

	if (filters?.backend?.length) {
		where.backends = {
			some: {
				backend: { in: filters.backend },
			},
		};
	}

	if (filters?.frontend?.length) {
		where.frontends = {
			some: {
				frontend: { in: filters.frontend },
			},
		};
	}

	if (filters?.devops?.length) {
		where.devops = {
			some: {
				devops: { in: filters.devops },
			},
		};
	}

	return prisma.project.findMany({
		where,
		select: {
			id: true,
			title: true,
			description: true,
			imagePath: true,
			github: true,
			lastUpdate: true,
			isPrivate: true,
			isAiGenerated: true,
			createdAt: true,
			updatedAt: true,
			languages: true,
			databases: true,
			backends: true,
			frontends: true,
			devops: true,
		},
		orderBy: { lastUpdate: "desc" },
	});
}

// Server Action principale avec caching et rate limiting
export async function getProjects(rawFilters?: ProjectFilters) {
	// Rate limiting (utiliser IP ou session en production)
	const identifier = "global"; // En prod, utiliser headers() pour récupérer l'IP
	if (!checkRateLimit(identifier)) {
		throw new Error("Trop de requêtes. Veuillez réessayer plus tard.");
	}

	// Validation des filtres avec Zod
	const parseResult = ProjectFiltersSchema.safeParse(rawFilters ?? {});
	if (!parseResult.success) {
		throw new Error("Filtres invalides");
	}
	const filters = parseResult.data;

	// En développement, pas de cache pour avoir les données fraîches
	if (IS_DEV) {
		return getProjectsFromDb(filters);
	}

	// Créer une clé de cache unique basée sur les filtres
	const cacheKey = JSON.stringify(filters);

	// Fonction cachée (production seulement)
	const getCachedProjects = unstable_cache(
		async () => getProjectsFromDb(filters),
		["projects", cacheKey],
		{
			tags: ["projects"],
			revalidate: 300,
		},
	);

	return getCachedProjects();
}

// Server Action pour récupérer un projet par ID
export async function getProjectById(id: number) {
	const identifier = "global";
	if (!checkRateLimit(identifier)) {
		throw new Error("Trop de requêtes. Veuillez réessayer plus tard.");
	}

	const getCachedProject = unstable_cache(
		async () =>
			prisma.project.findUnique({
				where: { id },
				select: {
					id: true,
					title: true,
					description: true,
					imagePath: true,
					github: true,
					lastUpdate: true,
					isPrivate: true,
					isAiGenerated: true,
					createdAt: true,
					updatedAt: true,
					languages: true,
					databases: true,
					backends: true,
					frontends: true,
					devops: true,
				},
			}),
		["project", String(id)],
		{
			tags: ["projects", `project-${id}`],
			revalidate: 300,
		},
	);

	return getCachedProject();
}

// Server Action pour obtenir les options de filtres disponibles
export async function getFilterOptions() {
	const identifier = "global";
	if (!checkRateLimit(identifier)) {
		throw new Error("Trop de requêtes. Veuillez réessayer plus tard.");
	}

	const getCachedOptions = unstable_cache(
		async () => {
			const [languages, databases, backends, frontends, devops] =
				await Promise.all([
					prisma.projectLanguage.findMany({
						distinct: ["language"],
						select: { language: true },
					}),
					prisma.projectDatabase.findMany({
						distinct: ["database"],
						select: { database: true },
					}),
					prisma.projectBackend.findMany({
						distinct: ["backend"],
						select: { backend: true },
					}),
					prisma.projectFrontend.findMany({
						distinct: ["frontend"],
						select: { frontend: true },
					}),
					prisma.projectDevOps.findMany({
						distinct: ["devops"],
						select: { devops: true },
					}),
				]);

			return {
				languages: languages.map((l) => l.language),
				databases: databases.map((d) => d.database),
				backends: backends.map((b) => b.backend),
				frontends: frontends.map((f) => f.frontend),
				devops: devops.map((d) => d.devops),
			};
		},
		["filter-options"],
		{
			tags: ["projects", "filter-options"],
			revalidate: 3600, // 1 heure
		},
	);

	return getCachedOptions();
}
