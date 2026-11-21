import { upsertProjectRelations } from "@/lib/admin/project-relations";
import { type AdminProject, AdminProjectSchema } from "@/schemas";

type Db = {
	project: {
		findUnique: (args: {
			where: { githubRepoId: number };
			select: { id: true; title: true };
		}) => Promise<{ id: number; title: string } | null>;
	};
};

/**
 * Fiches à créer : celles dont le dépôt (`githubRepoId`) n'a pas encore de fiche.
 * Les autres sont annoncées et ignorées, pour qu'un script reste relançable.
 */
export async function pendingCreations(
	db: Db,
	projects: readonly AdminProject[],
	log: (line: string) => void = console.log,
): Promise<AdminProject[]> {
	const pending: AdminProject[] = [];
	for (const raw of projects) {
		const data = AdminProjectSchema.parse(raw);
		if (data.githubRepoId === undefined) {
			throw new Error(`${data.title} : githubRepoId manquant.`);
		}
		const existing = await db.project.findUnique({
			where: { githubRepoId: data.githubRepoId },
			select: { id: true, title: true },
		});
		if (existing) {
			log(`déjà présent : #${existing.id} ${existing.title}`);
			continue;
		}
		log(`nouvelle fiche : ${data.title}`);
		pending.push(data);
	}
	return pending;
}

/** Crée une fiche et ses relations dans une transaction ouverte. */
export async function createProject(tx: any, data: AdminProject) {
	const created = await tx.project.create({
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
			training: data.training ?? null,
		},
	});
	await upsertProjectRelations(tx, created.id, data);
	return created as { id: number };
}
