// app/actions/admin.action.ts
"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { buildDomainRows } from "@/lib/domains";
import { ACCEPTABLE_FIELDS, planWrite } from "@/lib/github/apply";
import {
	type AnalyzeResult,
	detectFromBundle,
	remoteFromBundle,
	SYNC_SELECT,
	toBoardProject,
} from "@/lib/github/board";
import { GithubError, getRepoBundle } from "@/lib/github/client";
import { applyAccepted, computeDiff, fullNameOf } from "@/lib/github/sync";
import { getAdminGithubToken } from "@/lib/github/token";
import { type AdminProject, AdminProjectSchema } from "@/schemas";

async function requireAdmin(): Promise<void> {
	const session = await auth();
	if (!session?.user || session.user.githubId !== process.env.ADMIN_GITHUB_ID) {
		throw new Error("Unauthorized");
	}
}

async function upsertProjectRelations(
	tx: any,
	projectId: number,
	data: AdminProject,
): Promise<void> {
	await tx.projectLanguage.deleteMany({ where: { projectId } });
	await tx.projectDatabase.deleteMany({ where: { projectId } });
	await tx.projectBackend.deleteMany({ where: { projectId } });
	await tx.projectFrontend.deleteMany({ where: { projectId } });
	await tx.projectDevOps.deleteMany({ where: { projectId } });
	await tx.projectDomain.deleteMany({ where: { projectId } });
	await tx.projectMlStack.deleteMany({ where: { projectId } });

	if (data.languages.length > 0) {
		await tx.projectLanguage.createMany({
			data: data.languages.map((language) => ({ projectId, language })),
		});
	}
	if (data.databases.length > 0) {
		await tx.projectDatabase.createMany({
			data: data.databases.map((database) => ({ projectId, database })),
		});
	}
	if (data.backends.length > 0) {
		await tx.projectBackend.createMany({
			data: data.backends.map((backend) => ({ projectId, backend })),
		});
	}
	if (data.frontends.length > 0) {
		await tx.projectFrontend.createMany({
			data: data.frontends.map((frontend) => ({ projectId, frontend })),
		});
	}
	if (data.devops.length > 0) {
		await tx.projectDevOps.createMany({
			data: data.devops.map((devops) => ({ projectId, devops })),
		});
	}
	const domainRows = buildDomainRows(projectId, data.domains);
	if (domainRows.length > 0) {
		await tx.projectDomain.createMany({ data: domainRows });
	}
	if (data.mlStack.length > 0) {
		await tx.projectMlStack.createMany({
			data: data.mlStack.map((ml) => ({ projectId, ml })),
		});
	}
}

export async function createProject(raw: AdminProject): Promise<void> {
	await requireAdmin();
	const data = AdminProjectSchema.parse(raw);

	await prisma.$transaction(async (tx) => {
		const project = await tx.project.create({
			data: {
				title: data.title,
				description: data.description,
				imagePath: data.imagePath ?? null,
				github: data.github ?? "",
				lastUpdate: data.lastUpdate ? new Date(data.lastUpdate) : null,
				isPrivate: data.isPrivate,
				isAiGenerated: data.isAiGenerated,
				pitch: data.pitch ?? null,
				status: data.status ?? null,
				period: data.period ?? null,
				githubRepoId: data.githubRepoId ?? null,
				featuredRank: data.featuredRank ?? null,
			},
		});
		await upsertProjectRelations(tx, project.id, data);
	});

	revalidateTag("projects", "max");
}

export async function updateProject(
	id: number,
	raw: AdminProject,
): Promise<void> {
	await requireAdmin();
	const data = AdminProjectSchema.parse(raw);

	await prisma.$transaction(async (tx) => {
		await tx.project.update({
			where: { id },
			data: {
				title: data.title,
				description: data.description,
				imagePath: data.imagePath ?? null,
				github: data.github ?? "",
				lastUpdate: data.lastUpdate ? new Date(data.lastUpdate) : null,
				isPrivate: data.isPrivate,
				isAiGenerated: data.isAiGenerated,
				pitch: data.pitch ?? null,
				status: data.status ?? null,
				period: data.period ?? null,
				githubRepoId: data.githubRepoId ?? null,
				featuredRank: data.featuredRank ?? null,
			},
		});
		await upsertProjectRelations(tx, id, data);
	});

	revalidateTag("projects", "max");
}

export async function deleteProject(id: number): Promise<void> {
	await requireAdmin();
	await prisma.project.delete({ where: { id } });
	revalidateTag("projects", "max");
}

/** Message affichable : jamais de jeton ni de détail interne. */
function safeMessage(e: unknown): string {
	if (e instanceof GithubError) return e.message;
	if (e instanceof Error && e.message === "Nom de dépôt invalide.")
		return e.message;
	return "Opération impossible.";
}

async function findProjectForRepo(id: number, fullName: string) {
	const row =
		(await prisma.project.findUnique({
			where: { githubRepoId: id },
			select: SYNC_SELECT,
		})) ??
		(await prisma.project.findFirst({
			where: {
				github: {
					equals: `https://github.com/${fullName}`,
					mode: "insensitive",
				},
			},
			select: SYNC_SELECT,
		}));
	return row ? toBoardProject(row) : null;
}

/** Lit un dépôt, détecte sa stack et calcule l'écart avec le projet existant. Aucun secret renvoyé. */
export async function analyzeRepo(fullName: string): Promise<AnalyzeResult> {
	await requireAdmin();
	const parsed = z.string().max(200).safeParse(fullName);
	if (!parsed.success) return { ok: false, error: "Nom de dépôt invalide." };
	try {
		const { token } = await getAdminGithubToken();
		const bundle = await getRepoBundle(parsed.data, token);
		const remote = remoteFromBundle(bundle, detectFromBundle(bundle));
		const project = await findProjectForRepo(remote.id, remote.fullName);
		return {
			ok: true,
			remote,
			projectId: project?.id ?? null,
			diff: project ? computeDiff(project, remote) : [],
			images: bundle.images,
		};
	} catch (e) {
		return { ok: false, error: safeMessage(e) };
	}
}

// Seuls les champs synchronisables d'un nouveau projet : rien d'éditorial.
const ImportRepoSchema = AdminProjectSchema.pick({
	title: true,
	description: true,
	github: true,
	lastUpdate: true,
	isPrivate: true,
	languages: true,
	databases: true,
	backends: true,
	frontends: true,
	devops: true,
	mlStack: true,
	domains: true,
	githubRepoId: true,
}).extend({
	github: z.string().regex(/^https:\/\/github\.com\/[^/\s]+\/[^/\s]+$/),
	githubRepoId: z.number().int().positive(),
});

export async function importRepo(
	raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
	await requireAdmin();
	const parsed = ImportRepoSchema.safeParse(raw);
	if (!parsed.success) return { ok: false, error: "Données invalides." };
	const data = parsed.data;
	const name = fullNameOf(data.github);
	const existing = await prisma.project.findFirst({
		where: {
			OR: [
				{ githubRepoId: data.githubRepoId },
				...(name
					? [
							{
								github: {
									equals: `https://github.com/${name}`,
									mode: "insensitive" as const,
								},
							},
						]
					: []),
			],
		},
		select: { id: true },
	});
	if (existing) return { ok: false, error: "Ce dépôt est déjà importé." };
	await createProject({ ...data, isAiGenerated: false });
	return { ok: true };
}

const ApplySyncSchema = z.object({
	projectId: z.number().int().positive(),
	fullName: z.string().max(200),
	accepted: z
		.array(z.enum(ACCEPTABLE_FIELDS))
		.min(1)
		.max(ACCEPTABLE_FIELDS.length),
});

/**
 * Applique les champs cochés. L'écart est recalculé ici depuis GitHub : le client ne
 * fournit que les noms de champs, qui doivent appartenir à cet écart.
 */
export async function applySync(
	projectId: number,
	fullName: string,
	accepted: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
	await requireAdmin();
	const parsed = ApplySyncSchema.safeParse({ projectId, fullName, accepted });
	if (!parsed.success) return { ok: false, error: "Données invalides." };
	try {
		const row = await prisma.project.findUnique({
			where: { id: parsed.data.projectId },
			select: SYNC_SELECT,
		});
		if (!row) return { ok: false, error: "Projet introuvable." };
		const project = toBoardProject(row);

		const { token } = await getAdminGithubToken();
		const bundle = await getRepoBundle(parsed.data.fullName, token);
		const remote = remoteFromBundle(bundle, detectFromBundle(bundle));
		const sameRepo =
			project.githubRepoId !== null
				? project.githubRepoId === remote.id
				: fullNameOf(project.github)?.toLowerCase() ===
					remote.fullName.toLowerCase();
		if (!sameRepo)
			return { ok: false, error: "Ce dépôt ne correspond pas au projet." };

		const diff = computeDiff(project, remote);
		const fields = new Set(diff.map((d) => d.field));
		const unique = [...new Set(parsed.data.accepted)];
		if (unique.some((f) => !fields.has(f)))
			return {
				ok: false,
				error: "Les écarts ont changé : relance l'analyse.",
			};

		const plan = planWrite(applyAccepted(project, diff, unique));
		const id = project.id;
		await prisma.$transaction(async (tx) => {
			await tx.project.update({
				where: { id },
				data: { ...plan.scalars, syncedAt: new Date() },
			});
			const { lists } = plan;
			if (lists.languages) {
				await tx.projectLanguage.deleteMany({ where: { projectId: id } });
				await tx.projectLanguage.createMany({
					data: lists.languages.map((language) => ({
						projectId: id,
						language: language as never,
					})),
				});
			}
			if (lists.databases) {
				await tx.projectDatabase.deleteMany({ where: { projectId: id } });
				await tx.projectDatabase.createMany({
					data: lists.databases.map((database) => ({
						projectId: id,
						database: database as never,
					})),
				});
			}
			if (lists.backends) {
				await tx.projectBackend.deleteMany({ where: { projectId: id } });
				await tx.projectBackend.createMany({
					data: lists.backends.map((backend) => ({
						projectId: id,
						backend: backend as never,
					})),
				});
			}
			if (lists.frontends) {
				await tx.projectFrontend.deleteMany({ where: { projectId: id } });
				await tx.projectFrontend.createMany({
					data: lists.frontends.map((frontend) => ({
						projectId: id,
						frontend: frontend as never,
					})),
				});
			}
			if (lists.devops) {
				await tx.projectDevOps.deleteMany({ where: { projectId: id } });
				await tx.projectDevOps.createMany({
					data: lists.devops.map((devops) => ({
						projectId: id,
						devops: devops as never,
					})),
				});
			}
			if (lists.mlStack) {
				await tx.projectMlStack.deleteMany({ where: { projectId: id } });
				await tx.projectMlStack.createMany({
					data: lists.mlStack.map((ml) => ({ projectId: id, ml: ml as never })),
				});
			}
			if (lists.domains) {
				await tx.projectDomain.deleteMany({ where: { projectId: id } });
				await tx.projectDomain.createMany({
					data: buildDomainRows(id, lists.domains),
				});
			}
		});
		revalidateTag("projects", "max");
		return { ok: true };
	} catch (e) {
		return { ok: false, error: safeMessage(e) };
	}
}
