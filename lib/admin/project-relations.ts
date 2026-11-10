import { buildDomainRows } from "@/lib/domains";
import { normalizePractices } from "@/lib/practices";
import type { AdminProject } from "@/schemas";

/**
 * Remplace toutes les relations d'un projet (stacks, domaines, pratiques) par celles de `data`.
 * À appeler dans une transaction Prisma : partagé par l'admin et les scripts de catalogue.
 */
export async function upsertProjectRelations(
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
	await tx.projectPractice.deleteMany({ where: { projectId } });

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
	const practices = normalizePractices(data.practices);
	if (practices.length > 0) {
		await tx.projectPractice.createMany({
			data: practices.map((practice) => ({ projectId, practice })),
		});
	}
}
